import 'server-only';
import { serverEnv } from '@/env';
import { logger } from '@/server/logger';
import type { AppSession } from '@/lib/types/auth';
import * as authApi from '@/server/ksm/modules/auth';
import { listRoles, ROLE_CODE_READER } from '@/server/ksm/modules/administration';

// Session admin YowNews obtenue côté serveur et réutilisée pour les opérations privilégiées
// (poser le rôle Lecteur aux nouveaux inscrits). L'admin a déjà administration:assignments:write.
// Mise en cache en mémoire (pattern de platform-org.ts) ; re-login peu avant expiration.

let cachedSession: AppSession | null = null;
let cachedReaderRoleId: string | null = null;

// marge de sécurité avant l'expiration du token (secondes)
const REFRESH_MARGIN_SECONDS = 60;

function buildAdminSession(contextual: authApi.ContextualLoginResponse): AppSession {
  const s = contextual.session;
  return {
    sid: 'admin-service',
    accessToken: s.accessToken,
    expiresAt: Math.floor(Date.now() / 1000) + s.expiresInSeconds,
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

/**
 * Login admin (creds en env) et renvoie une AppSession utilisable par les modules KSM.
 * Renvoie null si non configuré ou si le login échoue (l'appelant doit dégrader proprement).
 */
export async function getAdminSession(): Promise<AppSession | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedSession && cachedSession.expiresAt - REFRESH_MARGIN_SECONDS > now) {
    return cachedSession;
  }

  const email = serverEnv.KSM_PLATFORM_ADMIN_EMAIL;
  const password = serverEnv.KSM_PLATFORM_ADMIN_PASSWORD;
  if (!email || !password) {
    logger.warn({}, 'ksm.admin_session.not_configured');
    return null;
  }

  try {
    const discovery = await authApi.discoverContexts(email, password);
    const ctx = discovery.contexts[0];
    if (!ctx) {
      logger.warn({}, 'ksm.admin_session.no_context');
      return null;
    }
    const orgId = ctx.organizations[0]?.organizationId ?? undefined;
    const contextual = await authApi.selectContext(discovery.selectionToken, ctx.contextId, orgId);
    cachedSession = buildAdminSession(contextual);
    return cachedSession;
  } catch (cause) {
    logger.error({ cause }, 'ksm.admin_session.login_failed');
    cachedSession = null;
    return null;
  }
}

/** Id du rôle Lecteur (EDUCATION_READER_PERMISSIONS) ; mis en cache (stable). */
export async function getReaderRoleId(adminSession: AppSession): Promise<string | null> {
  if (cachedReaderRoleId) return cachedReaderRoleId;
  try {
    const roles = await listRoles(adminSession);
    cachedReaderRoleId = roles.find((r) => r.code === ROLE_CODE_READER)?.id ?? null;
    if (!cachedReaderRoleId) {
      logger.warn({ code: ROLE_CODE_READER }, 'ksm.admin_session.reader_role_not_found');
    }
    return cachedReaderRoleId;
  } catch (cause) {
    logger.error({ cause }, 'ksm.admin_session.list_roles_failed');
    return null;
  }
}
