import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail } from '@/server/api-response';
import { readSession } from '@/server/session';
import * as newsletterApi from '@/server/ksm/modules/newsletter';
import type { StatutNewsletter } from '@/server/ksm/modules/newsletter';

// GET /api/newsletter/newsletters?statut= — file de modération (admin).
export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');
    const statut = request.nextUrl.searchParams.get('statut') as StatutNewsletter | null;
    if (!statut) return fail(400, 'VALIDATION_ERROR', 'statut is required');
    return newsletterApi.listNewslettersByStatut(session, statut);
  });
}

// POST /api/newsletter/newsletters — { titre, contenu, categorieIds }
export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');

    const body = (await request.json()) as { titre?: string; contenu?: string; categorieIds?: string[] };
    const titre = String(body.titre ?? '').trim();
    const contenu = String(body.contenu ?? '').trim();
    const categorieIds = Array.isArray(body.categorieIds) ? body.categorieIds : [];
    if (!titre) return fail(400, 'VALIDATION_ERROR', 'titre is required');
    if (!contenu) return fail(400, 'VALIDATION_ERROR', 'contenu is required');
    if (categorieIds.length === 0) return fail(400, 'VALIDATION_ERROR', 'At least one category is required');

    return newsletterApi.createNewsletter(session, session.user.id, { titre, contenu, categorieIds });
  });
}
