import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail } from '@/server/api-response';
import * as authApi from '@/server/ksm/modules/auth';
import { writeSession } from '@/server/session';
import type { AppSession } from '@/lib/types/auth';

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const body = (await request.json()) as { email?: string; password?: string };
    const principal = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!principal || !password) {
      return fail(400, 'VALIDATION_ERROR', 'email and password are required');
    }

    const discovery = await authApi.discoverContexts(principal, password);

    if (!discovery.contexts.length) {
      return fail(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const ctx = discovery.contexts[0];
    const orgId = ctx.organizations[0]?.organizationId ?? undefined;

    const contextual = await authApi.selectContext(
      discovery.selectionToken,
      ctx.contextId,
      orgId,
    );

    const session = buildSession(contextual);
    await writeSession(session);

    return {
      user: session.user,
      workspace: session.workspace,
      forcePasswordChange: session.forcePasswordChange ?? false,
    };
  });
}

function buildSession(contextual: authApi.ContextualLoginResponse): AppSession {
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
}
