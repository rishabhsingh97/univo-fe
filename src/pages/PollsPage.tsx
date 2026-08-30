import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pollApi } from '../api/common/pollApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useTimezone } from '../hooks/useTimezone';
import { Badge, Button, Card, Modal, PageHeader, Spinner, TextField } from '../components/ui';
import type { PollRequest } from '../types/engagement';

interface PollForm {
  question: string;
  closesOn: string;
  options: string[];
}

function emptyPollForm(): PollForm {
  return { question: '', closesOn: '', options: ['', ''] };
}

export function PollsPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const { formatDate } = useTimezone();
  const queryClient = useQueryClient();

  const canManage = hasPermission('engagement.poll.manage');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PollForm>(emptyPollForm());

  const pollsQuery = useQuery({ queryKey: ['polls'], queryFn: () => pollApi.list(0, 20) });
  const polls = pollsQuery.data?.content ?? [];

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyPollForm());
  };

  const updateOption = (index: number, value: string) =>
    setForm((prev) => ({ ...prev, options: prev.options.map((o, i) => (i === index ? value : o)) }));
  const addOption = () => setForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  const removeOption = (index: number) => setForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));

  const createPoll = useMutation({
    mutationFn: (request: PollRequest) => pollApi.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      closeForm();
    },
  });

  const deletePoll = useMutation({
    mutationFn: (id: number) => pollApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });

  const votePoll = useMutation({
    mutationFn: ({ id, optionId }: { id: number; optionId: number }) => pollApi.vote(id, { optionId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls'] }),
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const options = form.options.map((o) => o.trim()).filter(Boolean);
    if (options.length < 2) return;
    createPoll.mutate({ question: form.question, closesOn: form.closesOn || null, options });
  };

  return (
    <div>
      <PageHeader
        title={t('pages.polls.title')}
        description={t('pages.polls.description')}
        actions={canManage ? <Button onClick={() => setShowForm(true)}>{t('pages.polls.newPoll')}</Button> : undefined}
      />

      {pollsQuery.isLoading ? (
        <Spinner />
      ) : (
        <div style={{ maxWidth: 640 }}>
          {polls.map((poll) => (
            <Card key={poll.id} style={{ marginBottom: 12 }}>
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                <h3 style={{ marginTop: 0 }}>{poll.question}</h3>
                {poll.closed && <Badge tone="neutral">{t('common.closed')}</Badge>}
              </div>
              {poll.options.map((option) => {
                const pct = poll.totalVotes === 0 ? 0 : Math.round((option.voteCount / poll.totalVotes) * 100);
                const alreadyVoted = poll.myVotedOptionId !== null;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => votePoll.mutate({ id: poll.id, optionId: option.id })}
                    disabled={alreadyVoted || poll.closed || votePoll.isPending}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      border: option.id === poll.myVotedOptionId ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: 8,
                      padding: '8px 12px',
                      background: `linear-gradient(to right, var(--color-primary-soft) ${pct}%, transparent ${pct}%)`,
                      cursor: alreadyVoted || poll.closed ? 'default' : 'pointer',
                    }}
                  >
                    {option.label} - {pct}% ({option.voteCount})
                  </button>
                );
              })}
              <div className="row-actions" style={{ justifyContent: 'space-between' }}>
                {poll.closesOn && <div className="field-hint">{t('pages.polls.closesOn')}: {formatDate(poll.closesOn)}</div>}
                {canManage && (
                  <Button
                    variant="danger"
                    onClick={() => window.confirm(t('common.confirmDelete')) && deletePoll.mutate(poll.id)}
                  >
                    {t('common.delete')}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={t('pages.polls.newPoll')} onClose={closeForm}>
          <form onSubmit={handleSubmit} className="form-grid">
            <TextField label={t('pages.polls.question')} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
            <div className="field">
              <label className="field-label">{t('pages.polls.closesOn')}</label>
              <input type="date" className="input" value={form.closesOn} onChange={(e) => setForm({ ...form, closesOn: e.target.value })} />
            </div>
            {form.options.map((option, index) => (
              <div key={index} className="row-actions" style={{ gridColumn: '1 / -1' }}>
                <TextField label={`${t('pages.polls.option')} ${index + 1}`} value={option} onChange={(e) => updateOption(index, e.target.value)} />
                {form.options.length > 2 && (
                  <Button type="button" variant="danger" onClick={() => removeOption(index)}>{t('pages.addCandidate.removeRow')}</Button>
                )}
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <Button type="button" variant="secondary" onClick={addOption}>{t('pages.addCandidate.addRow')}</Button>
            </div>
            <div className="form-actions">
              <Button type="submit" disabled={createPoll.isPending}>
                {createPoll.isPending ? t('common.creating') : t('common.create')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
