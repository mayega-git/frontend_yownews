import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail } from '@/server/api-response';
import { readSession } from '@/server/session';
import * as newsletterApi from '@/server/ksm/modules/newsletter';

type CategoryChoice = { nom: string; isCustom: boolean };

// POST /api/newsletter/redacteurs — demande de création de newsletter.
// nom/prénom proviennent du compte authentifié ; email est saisi explicitement (peut différer).
export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');

    const body = (await request.json()) as { email?: string; categories?: CategoryChoice[] };
    const email = String(body.email ?? '').trim();
    const categories = Array.isArray(body.categories) ? body.categories.filter((c) => c?.nom?.trim()) : [];
    if (!email) return fail(400, 'VALIDATION_ERROR', 'email is required');
    if (categories.length === 0) return fail(400, 'VALIDATION_ERROR', 'At least one category is required');

    const nom = session.user.lastName || session.user.email;
    const prenom = session.user.firstName || '';

    return newsletterApi.createRedacteurRequest(session, session.user.id, { nom, prenom, email, categories });
  });
}
