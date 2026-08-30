import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { feedApi } from '../api/common/feedApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { Button, Card, PageHeader, Spinner } from '../components/ui';

export function FeedPage() {
  const { t } = useLocale();
  const { format } = useTimezone();
  const queryClient = useQueryClient();

  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const feedQuery = useQuery({ queryKey: ['feed'], queryFn: () => feedApi.list(0, 20) });
  const posts = feedQuery.data?.content ?? [];

  const createPost = useMutation({
    mutationFn: () => feedApi.create(content, attachment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      setContent('');
      setAttachment(null);
    },
  });

  const deletePost = useMutation({
    mutationFn: (id: number) => feedApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    createPost.mutate();
  };

  return (
    <div>
      <PageHeader title={t('pages.feed.title')} description={t('pages.feed.description')} />

      <Card style={{ marginBottom: 16, maxWidth: 640 }}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field-label">{t('pages.feed.newPost')}</label>
            <textarea className="input" value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <input
            type="file"
            onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            style={{ gridColumn: '1 / -1' }}
          />
          <div className="form-actions">
            <Button type="submit" disabled={createPost.isPending || !content.trim()}>
              {createPost.isPending ? t('common.creating') : t('pages.feed.newPost')}
            </Button>
          </div>
        </form>
      </Card>

      {feedQuery.isLoading ? (
        <Spinner />
      ) : (
        <div style={{ maxWidth: 640 }}>
          {posts.map((post) => (
            <Card key={post.id} style={{ marginBottom: 12 }}>
              <div className="field-hint">{post.authorName ?? '-'} - {format(post.createdAt)}</div>
              <p style={{ margin: '8px 0' }}>{post.content}</p>
              {post.hasAttachment && (
                <a href={feedApi.attachmentUrl(post.id)} target="_blank" rel="noreferrer">
                  {t('pages.feed.viewAttachment')}
                </a>
              )}
              {post.canDelete && (
                <div className="form-actions" style={{ marginTop: 8 }}>
                  <Button
                    variant="danger"
                    onClick={() => window.confirm(t('common.confirmDelete')) && deletePost.mutate(post.id)}
                  >
                    {t('common.delete')}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
