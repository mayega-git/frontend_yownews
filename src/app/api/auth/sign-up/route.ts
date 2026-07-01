import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail, ok } from '@/server/api-response';
import * as authApi from '@/server/ksm/modules/auth';
import { assignRole } from '@/server/ksm/modules/administration';
import { getAdminSession, getReaderRoleId } from '@/server/ksm/admin-session';
import { writeSession } from '@/server/session';
import { logger } from '@/server/logger';
import type { AppSession } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const body = (await request.json()) as {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      phoneNumber?: string;
      accountType?: string;
      businessType?: string;
    };

    const firstName = String(body.firstName ?? '').trim();
    const lastName  = String(body.lastName  ?? '').trim();
    const email     = String(body.email     ?? '').trim().toLowerCase();
    const password  = String(body.password  ?? '');

    if (!firstName || !lastName || !email || !password) {
      return fail(400, 'VALIDATION_ERROR', 'firstName, lastName, email and password are required');
    }

    // Le formulaire envoie individual/organization ; KSM n'accepte que PROSPECT/BUSINESS.
    const accountType = body.accountType === 'organization' ? 'BUSINESS' : 'PROSPECT';

    // Step 1 — discover YOWNEWS sign-up context (automatic, no user input needed)
    const discovery = await authApi.discoverSignUpContexts('YOWNEWS');

    if (!discovery.contexts.length) {
      return fail(404, 'ORG_NOT_FOUND', 'YowNews organisation not found. Contact support.');
    }

    const ctx = discovery.contexts[0];

    // Step 2 — create the account
    const registered = await authApi.signUp({
      signUpSelectionToken: discovery.selectionToken,
      contextId: ctx.contextId,
      firstName,
      lastName,
      email,
      password,
      phoneNumber:  body.phoneNumber,
      accountType,
      businessType: body.businessType,
    });

    // Step 3 — assign the default Lecteur role (best-effort, server-side, as the YowNews admin).
    // L'admin a administration:assignments:write ; même appel que la page /admin/users.
    // Un échec ici ne doit jamais casser l'inscription : l'admin pourra reposer le rôle.
    await assignDefaultReaderRole(registered.id);

    // Step 4 — open a session. On re-login l'utilisateur pour que les authorities reflètent
    // le rôle Lecteur fraîchement posé (la réponse de sign-up date d'avant l'assignation).
    const session =
      (await reloginSession(email, password)) ?? buildSessionFromSignUp(registered, ctx.tenantId);
    await writeSession(session);

    return ok(
      { user: session.user, workspace: session.workspace },
      { status: 201 },
    );
  });
}

/** Assigne EDUCATION_READER_PERMISSIONS au nouvel inscrit via la session admin (best-effort). */
async function assignDefaultReaderRole(userId: string): Promise<void> {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) return;
    const readerRoleId = await getReaderRoleId(adminSession);
    if (!readerRoleId) return;
    await assignRole(adminSession, userId, readerRoleId);
  } catch (cause) {
    logger.error({ cause, userId }, 'auth.sign_up.reader_role_assignment_failed');
  }
}

/** Re-login l'utilisateur pour obtenir des authorities à jour ; null si le re-login échoue. */
async function reloginSession(email: string, password: string): Promise<AppSession | null> {
  try {
    const discovery = await authApi.discoverContexts(email, password);
    const ctx = discovery.contexts[0];
    if (!ctx) return null;
    const orgId = ctx.organizations[0]?.organizationId ?? undefined;
    const contextual = await authApi.selectContext(discovery.selectionToken, ctx.contextId, orgId);
    const s = contextual.session;
    return {
      sid: crypto.randomUUID(),
      accessToken: s.accessToken,
      expiresAt: Math.floor(Date.now() / 1000) + s.expiresInSeconds,
      forcePasswordChange: s.forcePasswordChange,
      user: {
        id: s.id,
        tenantId: contextual.selectedTenantId,
        email: s.email,
        firstName: s.firstName ?? undefined,
        lastName: s.lastName ?? undefined,
        roles: s.authorities,
        permissions: s.authorities,
      },
      workspace: {
        tenantId: contextual.selectedTenantId,
        ...(contextual.selectedOrganizationId
          ? { organizationId: contextual.selectedOrganizationId }
          : {}),
      },
    };
  } catch (cause) {
    logger.error({ cause }, 'auth.sign_up.relogin_failed');
    return null;
  }
}

function buildSessionFromSignUp(
  s: authApi.KsmLoginSession,
  tenantId: string,
): AppSession {
  return {
    sid: crypto.randomUUID(),
    accessToken: s.accessToken,
    expiresAt: Math.floor(Date.now() / 1000) + s.expiresInSeconds,
    forcePasswordChange: s.forcePasswordChange,
    user: {
      id: s.id,
      tenantId: s.tenantId ?? tenantId,
      email: s.email,
      firstName: s.firstName ?? undefined,
      lastName: s.lastName ?? undefined,
      roles: s.authorities,
      permissions: s.authorities,
    },
    workspace: {
      tenantId: s.tenantId ?? tenantId,
    },
  };
}
