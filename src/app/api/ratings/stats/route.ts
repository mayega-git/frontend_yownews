import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail } from '@/server/api-response';
import { readSession } from '@/server/session';
import * as ratingsApi from '@/server/ksm/modules/ratings';

// GET /api/ratings/stats?entityId= — compteurs + état du like/dislike pour l'utilisateur courant.
export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');

    const entityId = request.nextUrl.searchParams.get('entityId');
    if (!entityId) return fail(400, 'VALIDATION_ERROR', 'entityId is required');

    const [totalLikes, totalDislikes, hasLiked, hasDisliked] = await Promise.all([
      ratingsApi.getTotalLikes(session, entityId),
      ratingsApi.getTotalDislikes(session, entityId),
      ratingsApi.hasUserLiked(session, session.user.id, entityId),
      ratingsApi.hasUserDisliked(session, session.user.id, entityId),
    ]);

    return { totalLikes, totalDislikes, hasLiked, hasDisliked };
  });
}
