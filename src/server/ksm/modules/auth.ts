import 'server-only';
import { callKsm } from '@/server/ksm/client';

// ── Organisation access ───────────────────────────────────────────────────────

export type UserOrganizationAccess = {
  organizationId: string;
  organizationCode?: string;
  shortName?: string;
  longName?: string;
  displayName?: string;
  legalName?: string;
  services?: string[];
};

// ── Login — discover-contexts ─────────────────────────────────────────────────

export type DiscoveredContext = {
  contextId: string;
  tenantId: string;
  userId: string;
  actorId: string;
  organizations: UserOrganizationAccess[];
};

export type DiscoverContextsResponse = {
  selectionToken: string;
  expiresInSeconds: number;
  contexts: DiscoveredContext[];
};

export function discoverContexts(principal: string, password: string) {
  return callKsm<DiscoverContextsResponse>('/api/auth/discover-contexts', {
    method: 'POST',
    body: { principal, password },
    authenticated: false,
  });
}

// ── Login — select-context ────────────────────────────────────────────────────

export type KsmLoginSession = {
  id: string;
  tenantId: string;
  actorId: string;
  username: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  authProvider: string;
  status: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaChannel?: string | null;
  forcePasswordChange: boolean;
  accountType?: string | null;
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  authorities: string[];
  organizations: UserOrganizationAccess[];
};

export type ContextualLoginResponse = {
  selectedTenantId: string;
  selectedOrganizationId?: string | null;
  session: KsmLoginSession;
};

export function selectContext(
  selectionToken: string,
  contextId: string,
  organizationId?: string | null,
) {
  return callKsm<ContextualLoginResponse>('/api/auth/select-context', {
    method: 'POST',
    body: { selectionToken, contextId, ...(organizationId ? { organizationId } : {}) },
    authenticated: false,
  });
}

// ── Sign-up — discover-sign-up-contexts ───────────────────────────────────────

export type SelectableSignUpContext = {
  contextId: string;
  tenantId: string;
  organizationId: string;
  organizationCode: string;
  organizationName: string;
  organizationType: string;
};

export type DiscoverSignUpContextsResponse = {
  selectionToken: string;
  expiresInSeconds: number;
  contexts: SelectableSignUpContext[];
};

export function discoverSignUpContexts(organizationCode: string) {
  return callKsm<DiscoverSignUpContextsResponse>('/api/auth/discover-sign-up-contexts', {
    method: 'POST',
    body: { organizationCode },
    authenticated: false,
  });
}

// ── Sign-up ───────────────────────────────────────────────────────────────────

export type SignUpInput = {
  signUpSelectionToken: string;
  contextId: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  accountType?: string;
  businessType?: string;
};

export function signUp(input: SignUpInput) {
  return callKsm<KsmLoginSession>('/api/auth/sign-up', {
    method: 'POST',
    body: input,
    authenticated: false,
  });
}
