import 'server-only';
import { HttpError } from '@/lib/types/api';
import type { AppSession } from '@/lib/types/auth';
import { callKsm } from '@/server/ksm/client';

export type ForumStatus = 'PENDING' | 'VALIDATED' | 'REJECTED';
export type GroupType = 'FORUM' | 'COMMUNITY';

export type DiscussionGroup = {
  groupId: string;
  name: string;
  description?: string | null;
  type: GroupType;
  status: ForumStatus;
  creatorId?: string | null;
  creatorName?: string | null;
  members?: string[] | null;
  tenantId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ForumPost = {
  postId: string;
  title: string;
  content: string;
  authorId: string;
  groupId: string;
  categoriesIds?: string[] | null;
  numberOfLikes?: number | null;
  numberOfDislikes?: number | null;
  postLikes?: string[] | null;
  postDislikes?: string[] | null;
  commentCount?: number | null;
  creationDate?: string | null;
  modificationDate?: string | null;
};

export type ForumCategorie = {
  categorieId: string;
  categorieName: string;
  groupeId: string;
  postsIds?: string[] | null;
};

export type ForumCommentaire = {
  commentaireId?: string | null;
  contenu: string;
  auteurId: string;
  postId: string;
  parentId?: string | null;
  createdAt?: string | null;
};

async function readRaw<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!res.ok) {
    let message = res.statusText || 'Request failed';
    try {
      const parsed = text ? (JSON.parse(text) as { message?: string }) : null;
      if (parsed?.message) message = parsed.message;
    } catch { /* non-JSON */ }
    throw new HttpError({ status: res.status, errorCode: null, message });
  }
  return (text ? (JSON.parse(text) as T) : (null as T));
}

// ── Groupes ──
export async function listPublicGroups(session: AppSession) {
  const res = await callKsm<Response>('/api/v1/forum/groups/public', { method: 'GET', raw: true }, { session });
  return readRaw<DiscussionGroup[]>(res);
}

export async function listAllGroups(session: AppSession) {
  const res = await callKsm<Response>('/api/v1/forum/groups/all', { method: 'GET', raw: true }, { session });
  return readRaw<DiscussionGroup[]>(res);
}

export async function getGroup(session: AppSession, groupId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/groups/${groupId}`, { method: 'GET', raw: true }, { session });
  return readRaw<DiscussionGroup>(res);
}

export async function createGroup(session: AppSession, body: { name: string; description?: string; type: GroupType; creatorId: string; creatorName?: string }) {
  const res = await callKsm<Response>('/api/v1/forum/groups', { method: 'POST', body, raw: true }, { session });
  return readRaw<DiscussionGroup>(res);
}

export async function validateGroup(session: AppSession, groupId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/groups/${groupId}/validate`, { method: 'PUT', raw: true }, { session });
  return readRaw<DiscussionGroup>(res);
}

export async function rejectGroup(session: AppSession, groupId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/groups/${groupId}/reject`, { method: 'PUT', raw: true }, { session });
  return readRaw<DiscussionGroup>(res);
}

// ── Posts ──
export async function listPostsByGroup(session: AppSession, groupeId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/posts/groupe/${groupeId}`, { method: 'GET', raw: true }, { session });
  return readRaw<ForumPost[]>(res);
}

export async function getPost(session: AppSession, postId: string, memberId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/posts/${postId}?memberId=${memberId}`, { method: 'GET', raw: true }, { session });
  return readRaw<ForumPost>(res);
}

export async function createPost(session: AppSession, body: { title: string; content: string; authorId: string; groupId: string; categoriesIds: string[] }) {
  const res = await callKsm<Response>('/api/v1/forum/posts', { method: 'POST', body, raw: true }, { session });
  return readRaw<ForumPost>(res);
}

export async function toggleLikePost(session: AppSession, postId: string, memberId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/posts/${postId}/like?memberId=${memberId}`, { method: 'POST', raw: true }, { session });
  return readRaw<ForumPost>(res);
}

export async function toggleDislikePost(session: AppSession, postId: string, memberId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/posts/${postId}/dislike?memberId=${memberId}`, { method: 'POST', raw: true }, { session });
  return readRaw<{ numberOfLikes: number; numberOfDislikes: number }>(res);
}

export async function deletePost(session: AppSession, postId: string, memberId: string) {
  await callKsm<Response>(`/api/v1/forum/posts/${postId}?memberId=${memberId}`, { method: 'DELETE', raw: true }, { session });
}

// ── Catégories ──
export async function listCategoriesByGroup(session: AppSession, groupeId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/categories/groupe/${groupeId}`, { method: 'GET', raw: true }, { session });
  return readRaw<ForumCategorie[]>(res);
}

export async function createCategorie(session: AppSession, groupeId: string, body: { categorieName: string }) {
  const res = await callKsm<Response>(`/api/v1/forum/categories/${groupeId}`, { method: 'POST', body, raw: true }, { session });
  return readRaw<ForumCategorie>(res);
}

export async function deleteCategorie(session: AppSession, categorieId: string) {
  await callKsm<Response>(`/api/v1/forum/categories/${categorieId}`, { method: 'DELETE', raw: true }, { session });
}

// ── Commentaires ──
export async function listCommentairesByPost(session: AppSession, postId: string) {
  const res = await callKsm<Response>(`/api/v1/forum/commentaires/post/${postId}`, { method: 'GET', raw: true }, { session });
  return readRaw<ForumCommentaire[]>(res);
}

export async function createCommentaire(session: AppSession, body: { contenu: string; auteurId: string; postId: string; parentId?: string }) {
  const res = await callKsm<Response>('/api/v1/forum/commentaires/', { method: 'POST', body, raw: true }, { session });
  return readRaw<ForumCommentaire>(res);
}

export async function deleteCommentaire(session: AppSession, commentaireId: string) {
  await callKsm<Response>(`/api/v1/forum/commentaires/${commentaireId}`, { method: 'DELETE', raw: true }, { session });
}
