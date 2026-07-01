import 'server-only';
import type { NextRequest } from 'next/server';
import { handleRoute, fail } from '@/server/api-response';
import { readSession } from '@/server/session';
import { isPlatformAdmin } from '@/lib/roles';
import * as adminApi from '@/server/ksm/modules/administration';
import * as editorApi from '@/server/ksm/modules/editor-applications';

// POST /api/admin/role-requests/{id}/approve — assigne le rôle Rédacteur puis marque APPROVED.
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const session = await readSession();
    if (!session) return fail(401, 'UNAUTHORIZED', 'Not authenticated');
    if (!isPlatformAdmin(session.user.permissions ?? session.user.roles)) {
      return fail(403, 'FORBIDDEN', 'Admin only');
    }

    const { id } = await ctx.params;
    const all = await editorApi.listApplications(session);
    const app = all.find((a) => a.id === id);
    if (!app) return fail(404, 'NOT_FOUND', 'Candidature introuvable.');
    if (app.status !== 'PENDING') return fail(409, 'ALREADY_DECIDED', 'Candidature déjà traitée.');

    const roles = await adminApi.listRoles(session);
    const editorRoleId = roles.find((r) => r.code === adminApi.ROLE_CODE_EDITOR)?.id;
    if (!editorRoleId) return fail(500, 'ROLE_NOT_FOUND', 'Rôle Rédacteur introuvable.');

    // Promotion Lecteur → Rédacteur, idempotente (cf. setRole de la page Utilisateurs) :
    // révoque le rôle Lecteur s'il est présent, assigne Rédacteur seulement s'il manque.
    // Sans ce garde, ré-assigner un rôle déjà posé renvoie 400 « Role already assigned ».
    const users = await adminApi.listTenantUsers(session);
    const applicant = users.find((u) => u.userId === app.userId);
    if (applicant) {
      const readerAssignments = applicant.roles.filter((r) => r.code === adminApi.ROLE_CODE_READER);
      for (const r of readerAssignments) {
        await adminApi.revokeRole(session, app.userId, r.assignmentId);
      }
      const alreadyEditor = applicant.roles.some((r) => r.code === adminApi.ROLE_CODE_EDITOR);
      if (!alreadyEditor) await adminApi.assignRole(session, app.userId, editorRoleId);
    } else {
      await adminApi.assignRole(session, app.userId, editorRoleId);
    }

    return editorApi.setStatus(session, id, 'APPROVED');
  });
}
