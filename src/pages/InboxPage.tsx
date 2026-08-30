import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conversationApi } from '../api/common/conversationApi';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { useTimezone } from '../hooks/useTimezone';
import { Button, Card, Modal, PageHeader, SelectField, Spinner } from '../components/ui';
import type { ConversationResponse } from '../types/messaging';

export function InboxPage() {
  const { t } = useLocale();
  const { format } = useTimezone();
  const queryClient = useQueryClient();

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [targetUserId, setTargetUserId] = useState<number | ''>('');
  const [draft, setDraft] = useState('');

  const conversationsQuery = useQuery({ queryKey: ['conversations'], queryFn: () => conversationApi.list() });
  const conversations = conversationsQuery.data ?? [];

  // Auto-select the first (most recent) conversation once the list loads, if nothing is
  // selected yet - avoids an empty right pane on first load when there's already a thread.
  // Depends on the query's own (referentially stable) data rather than the derived `conversations`
  // fallback array, which is a fresh [] every render while still loading.
  useEffect(() => {
    if (selectedId === null && conversationsQuery.data && conversationsQuery.data.length > 0) {
      setSelectedId(conversationsQuery.data[0].id);
    }
  }, [conversationsQuery.data, selectedId]);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const messagesQuery = useQuery({
    queryKey: ['conversations', selectedId, 'messages'],
    queryFn: () => conversationApi.listMessages(selectedId as number, 0, 30),
    enabled: selectedId !== null,
  });
  const messages = [...(messagesQuery.data?.content ?? [])].reverse();

  const markReadMutation = useMutation({
    mutationFn: (id: number) => conversationApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });

  useEffect(() => {
    if (selected && selected.unreadCount > 0) {
      markReadMutation.mutate(selected.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const sendMutation = useMutation({
    mutationFn: () => conversationApi.sendMessage(selectedId as number, { body: draft }),
    onSuccess: () => {
      setDraft('');
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', selectedId, 'messages'] });
    },
  });

  const handleSend = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() || selectedId === null) return;
    sendMutation.mutate();
  };

  const { data: employeesPage } = useQuery({
    queryKey: ['employees', 'messageable'],
    queryFn: () => employeeApi.list(0, 200),
    enabled: showNewMessage,
  });
  const messageableEmployees = (employeesPage?.content ?? []).filter((e) => e.hasUserAccount && e.userId !== null);

  const startConversationMutation = useMutation({
    mutationFn: () => conversationApi.startOrGet({ targetUserId: targetUserId as number }),
    onSuccess: (conversation: ConversationResponse) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setSelectedId(conversation.id);
      setShowNewMessage(false);
      setTargetUserId('');
    },
  });

  const handleStartConversation = (event: FormEvent) => {
    event.preventDefault();
    if (targetUserId === '') return;
    startConversationMutation.mutate();
  };

  return (
    <div>
      <PageHeader
        title={t('pages.inbox.title')}
        description={t('pages.inbox.description')}
        actions={<Button onClick={() => setShowNewMessage(true)}>{t('pages.inbox.newMessage')}</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'start' }}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {conversationsQuery.isLoading ? (
            <Spinner />
          ) : conversations.length === 0 ? (
            <div className="field-hint" style={{ padding: 16 }}>{t('pages.inbox.empty')}</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  border: 'none',
                  borderBottom: '1px solid var(--color-border)',
                  background: c.id === selectedId ? 'var(--color-primary-soft)' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                  <strong>{c.otherUserName ?? '-'}</strong>
                  {c.unreadCount > 0 && (
                    <span className="notification-badge" style={{ position: 'static' }}>{c.unreadCount > 9 ? '9+' : c.unreadCount}</span>
                  )}
                </div>
                <div className="field-hint" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMessageBody ?? t('pages.inbox.noMessagesYet')}
                </div>
              </button>
            ))
          )}
        </Card>

        <Card style={{ minHeight: 420, display: 'flex', flexDirection: 'column' }}>
          {!selected ? (
            <div className="field-hint">{t('pages.inbox.selectConversation')}</div>
          ) : (
            <>
              <h3 style={{ marginTop: 0 }}>{selected.otherUserName}</h3>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {messagesQuery.isLoading ? (
                  <Spinner />
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.mine ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        background: m.mine ? 'var(--color-primary-soft)' : 'var(--color-surface-alt)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '6px 10px',
                      }}
                    >
                      <div>{m.body}</div>
                      <div className="field-hint" style={{ fontSize: 11 }}>{format(m.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSend} className="row-actions">
                <input
                  className="input"
                  style={{ flex: 1 }}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t('pages.inbox.messagePlaceholder')}
                />
                <Button type="submit" disabled={sendMutation.isPending || !draft.trim()}>
                  {t('pages.inbox.send')}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>

      {showNewMessage && (
        <Modal title={t('pages.inbox.newMessage')} onClose={() => setShowNewMessage(false)}>
          <form onSubmit={handleStartConversation} className="form-grid">
            <SelectField
              label={t('pages.inbox.recipient')}
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value ? Number(e.target.value) : '')}
              required
            >
              <option value="" disabled>{t('common.selectOption')}</option>
              {messageableEmployees.map((e) => (
                <option key={e.userId} value={e.userId as number}>{e.firstName} {e.lastName}</option>
              ))}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={startConversationMutation.isPending || targetUserId === ''}>
                {t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => setShowNewMessage(false)}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
