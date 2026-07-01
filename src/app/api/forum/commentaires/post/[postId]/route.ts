import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail } from '@/server/api-response';
import { readSession } from '@/server/session';
import * as forumApi from '@/server/ksm/modules/forum';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');
    const { postId } = await params;
    return forumApi.listCommentairesByPost(session, postId);
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');
    const { postId } = await params;
    const body = (await request.json()) as { contenu?: string; parentId?: string };
    const contenu = String(body.contenu ?? '').trim();
    if (!contenu) return fail(400, 'VALIDATION_ERROR', 'contenu is required');
    return forumApi.createCommentaire(session, { contenu, auteurId: session.user.id, postId, parentId: body.parentId });
  });
}
