'use client';
import { useState } from 'react';
import ContentWorkspace from '../../editor/ContentWorkspace';
import ContentModeration from '@/components/education/ContentModeration';

type Tab = 'podcasts' | 'moderation';

export default function AdminPodcastsWorkspace() {
  const [tab, setTab] = useState<Tab>('podcasts');

  const tabStyle = (val: Tab): React.CSSProperties => ({
    padding: '10px 18px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: tab === val ? '2px solid var(--accent)' : '2px solid transparent',
    color: tab === val ? 'var(--primary)' : 'var(--gray-500, #6b7280)',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--gray-200)', marginBottom: '24px' }}>
        <button type="button" style={tabStyle('podcasts')} onClick={() => setTab('podcasts')}>Podcasts</button>
        <button type="button" style={tabStyle('moderation')} onClick={() => setTab('moderation')}>Gestion des podcasts</button>
      </div>

      {tab === 'podcasts' ? <ContentWorkspace kind="podcasts" /> : <ContentModeration kind="podcasts" />}
    </div>
  );
}
