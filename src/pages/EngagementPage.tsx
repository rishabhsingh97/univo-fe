import { useState, type FormEvent } from 'react';
import { useLocale } from '../context/LocaleContext';
import { Button, Card, Modal, PageHeader, SelectField, TextField } from '../components/ui';

type Audience = 'All' | 'Department';

interface AnnouncementPost {
  id: number;
  title: string;
  body: string;
  authorName: string;
  postedOn: string;
  audience: Audience;
}

interface PollOption {
  id: number;
  label: string;
  votes: number;
}

interface Poll {
  id: number;
  question: string;
  options: PollOption[];
  closesOn: string;
  votedOptionId: number | null;
}

function seedAnnouncements(): AnnouncementPost[] {
  return [
    { id: 1, title: 'Office closed for Independence Day', body: 'The office will remain closed on 15th August. Enjoy the long weekend!', authorName: 'HR Team', postedOn: '2026-08-12', audience: 'All' },
    { id: 2, title: 'New health insurance provider', body: 'We are moving to a new insurance provider starting next month. Details to follow.', authorName: 'HR Team', postedOn: '2026-08-05', audience: 'All' },
  ];
}

function seedPolls(): Poll[] {
  return [
    {
      id: 1,
      question: 'Preferred day for the monthly town hall?',
      options: [
        { id: 1, label: 'Monday', votes: 4 },
        { id: 2, label: 'Wednesday', votes: 9 },
        { id: 3, label: 'Friday', votes: 6 },
      ],
      closesOn: '2026-08-30',
      votedOptionId: null,
    },
  ];
}

interface AnnouncementForm {
  title: string;
  body: string;
  audience: Audience;
}

function emptyAnnouncementForm(): AnnouncementForm {
  return { title: '', body: '', audience: 'All' };
}

interface PollForm {
  question: string;
  closesOn: string;
  options: string[];
}

function emptyPollForm(): PollForm {
  return { question: '', closesOn: '', options: ['', ''] };
}

export function EngagementPage() {
  const { t } = useLocale();
  const [announcements, setAnnouncements] = useState<AnnouncementPost[]>(seedAnnouncements());
  const [polls, setPolls] = useState<Poll[]>(seedPolls());
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementForm>(emptyAnnouncementForm());
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollForm, setPollForm] = useState<PollForm>(emptyPollForm());

  const closeAnnouncementForm = () => {
    setShowAnnouncementForm(false);
    setAnnouncementForm(emptyAnnouncementForm());
  };

  const handlePostAnnouncement = (event: FormEvent) => {
    event.preventDefault();
    setAnnouncements((prev) => [
      { id: Date.now(), title: announcementForm.title, body: announcementForm.body, authorName: 'You', postedOn: new Date().toISOString().slice(0, 10), audience: announcementForm.audience },
      ...prev,
    ]);
    closeAnnouncementForm();
  };

  const closePollForm = () => {
    setShowPollForm(false);
    setPollForm(emptyPollForm());
  };

  const updatePollOption = (index: number, value: string) =>
    setPollForm((prev) => ({ ...prev, options: prev.options.map((o, i) => (i === index ? value : o)) }));
  const addPollOption = () => setPollForm((prev) => ({ ...prev, options: [...prev.options, ''] }));
  const removePollOption = (index: number) => setPollForm((prev) => ({ ...prev, options: prev.options.filter((_, i) => i !== index) }));

  const handleCreatePoll = (event: FormEvent) => {
    event.preventDefault();
    const options = pollForm.options.filter((o) => o.trim());
    if (options.length < 2) return;
    setPolls((prev) => [
      { id: Date.now(), question: pollForm.question, closesOn: pollForm.closesOn, votedOptionId: null, options: options.map((label, i) => ({ id: i + 1, label, votes: 0 })) },
      ...prev,
    ]);
    closePollForm();
  };

  const vote = (pollId: number, optionId: number) => {
    setPolls((prev) =>
      prev.map((poll) => {
        if (poll.id !== pollId || poll.votedOptionId !== null) return poll;
        return { ...poll, votedOptionId: optionId, options: poll.options.map((o) => (o.id === optionId ? { ...o, votes: o.votes + 1 } : o)) };
      }),
    );
  };

  return (
    <div>
      <PageHeader title={t('pages.engagement.title')} description={t('pages.engagement.description')} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
        <div>
          <div className="row-actions" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{t('pages.engagement.announcements')}</h2>
            <Button onClick={() => setShowAnnouncementForm(true)}>{t('pages.engagement.newAnnouncement')}</Button>
          </div>
          {announcements.map((a) => (
            <Card key={a.id} style={{ marginBottom: 12 }}>
              <div className="field-hint">{a.authorName} - {a.postedOn}</div>
              <h3 style={{ margin: '4px 0' }}>{a.title}</h3>
              <p style={{ margin: 0 }}>{a.body}</p>
            </Card>
          ))}
        </div>

        <div>
          <div className="row-actions" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{t('pages.engagement.polls')}</h2>
            <Button onClick={() => setShowPollForm(true)}>{t('pages.engagement.newPoll')}</Button>
          </div>
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
            return (
              <Card key={poll.id} style={{ marginBottom: 12 }}>
                <h3 style={{ marginTop: 0 }}>{poll.question}</h3>
                {poll.options.map((option) => {
                  const pct = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => vote(poll.id, option.id)}
                      disabled={poll.votedOptionId !== null}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-sm)',
                        marginBottom: 8,
                        padding: '8px 12px',
                        background: `linear-gradient(to right, var(--color-primary-soft) ${pct}%, transparent ${pct}%)`,
                        cursor: poll.votedOptionId !== null ? 'default' : 'pointer',
                      }}
                    >
                      {option.label} - {pct}% ({option.votes})
                    </button>
                  );
                })}
                <div className="field-hint">{t('pages.engagement.closesOn')}: {poll.closesOn}</div>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="field-hint" style={{ marginTop: 16 }}>{t('pages.engagement.mockNotice')}</p>

      {showAnnouncementForm && (
        <Modal title={t('pages.engagement.newAnnouncement')} onClose={closeAnnouncementForm}>
          <form onSubmit={handlePostAnnouncement} className="form-grid">
            <TextField label={t('fields.title')} value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} required />
            <SelectField label={t('pages.engagement.audience')} value={announcementForm.audience} onChange={(e) => setAnnouncementForm({ ...announcementForm, audience: e.target.value as Audience })}>
              <option value="All">{t('common.all')}</option>
              <option value="Department">{t('fields.department')}</option>
            </SelectField>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.description')}</label>
              <textarea className="input" value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })} required />
            </div>
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.engagement.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit">{t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={closeAnnouncementForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {showPollForm && (
        <Modal title={t('pages.engagement.newPoll')} onClose={closePollForm}>
          <form onSubmit={handleCreatePoll} className="form-grid">
            <TextField label={t('pages.engagement.question')} value={pollForm.question} onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })} required />
            <div className="field">
              <label className="field-label">{t('pages.engagement.closesOn')}</label>
              <input type="date" className="input" value={pollForm.closesOn} onChange={(e) => setPollForm({ ...pollForm, closesOn: e.target.value })} required />
            </div>
            {pollForm.options.map((option, index) => (
              <div key={index} className="row-actions" style={{ gridColumn: '1 / -1' }}>
                <TextField label={`${t('pages.engagement.option')} ${index + 1}`} value={option} onChange={(e) => updatePollOption(index, e.target.value)} />
                {pollForm.options.length > 2 && (
                  <Button type="button" variant="danger" onClick={() => removePollOption(index)}>{t('pages.addCandidate.removeRow')}</Button>
                )}
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <Button type="button" variant="secondary" onClick={addPollOption}>{t('pages.addCandidate.addRow')}</Button>
            </div>
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.engagement.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit">{t('common.create')}</Button>
              <Button type="button" variant="secondary" onClick={closePollForm}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
