import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail } from '@/server/api-response';
import { readSession } from '@/server/session';
import * as ratingsApi from '@/server/ksm/modules/ratings';
import type { EntityType } from '@/server/ksm/modules/ratings';

const VALID_TYPES: EntityType[] = ['BLOG', 'PODCAST', 'COMMENT', 'FORUM', 'DRIVER', 'AUTHOR', 'APPLICATION', 'ORGANISATION'];

// POST /api/ratings/like-or-dislike — { entityId, entityType, isLike }
export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');

    const body = (await request.json()) as { entityId?: string; entityType?: string; isLike?: boolean };
    const entityId = String(body.entityId ?? '').trim();
    const entityType = String(body.entityType ?? '').toUpperCase();
    if (!entityId) return fail(400, 'VALIDATION_ERROR', 'entityId is required');
    if (!VALID_TYPES.includes(entityType as EntityType)) return fail(400, 'VALIDATION_ERROR', 'entityType is invalid');
    if (typeof body.isLike !== 'boolean') return fail(400, 'VALIDATION_ERROR', 'isLike must be a boolean');

    await ratingsApi.likeOrDislike(session, session.user.id, entityId, entityType as EntityType, body.isLike);
    return { ok: true };
  });
}
