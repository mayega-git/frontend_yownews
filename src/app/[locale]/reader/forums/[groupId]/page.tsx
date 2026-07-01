import ForumGroupView from './ForumGroupView';

export default async function ForumGroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <ForumGroupView groupId={groupId} />;
}
