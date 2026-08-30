import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { hrLetterApi } from '../api/hr/hrLetterApi';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Button, Modal, PageHeader, PagedDataTable, SelectField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';
import type { GeneratedLetterResponse, LetterType } from '../types/hrLetters';

const LETTER_TYPES: LetterType[] = ['OFFER', 'EXPERIENCE', 'SALARY_CERTIFICATE', 'RELIEVING', 'CONFIRMATION'];

export function HrLettersPage() {
  const { t } = useLocale();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const canManage = hasPermission('hrletter.manage');
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });
  const employeeOptions = employees?.content ?? [];

  const [showGenerate, setShowGenerate] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [letterType, setLetterType] = useState<LetterType>('OFFER');

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['hr-letters'] });

  const closeGenerate = () => {
    setShowGenerate(false);
    setEmployeeId('');
    setLetterType('OFFER');
  };

  const generateMutation = useMutation({
    mutationFn: () => hrLetterApi.generate({ employeeId: employeeId as number, letterType }),
    onSuccess: () => { invalidate(); closeGenerate(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => hrLetterApi.delete(id),
    onSuccess: invalidate,
  });

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault();
    if (!employeeId) return;
    generateMutation.mutate();
  };

  const columns: DataTableColumn<GeneratedLetterResponse>[] = [
    { key: 'employee', header: t('fields.name'), render: (l) => l.employeeName },
    { key: 'type', header: t('pages.hrLetters.type'), render: (l) => t(`pages.hrLetters.types.${l.letterType}`) },
    { key: 'generatedOn', header: t('pages.hrLetters.generatedOn'), render: (l) => new Date(l.generatedOn).toLocaleDateString() },
    { key: 'generatedBy', header: t('pages.hrLetters.generatedBy'), render: (l) => l.generatedByName ?? '-' },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.hrLetters.title')}
        description={t('pages.hrLetters.description')}
        actions={canManage && <Button onClick={() => setShowGenerate(true)}>{t('pages.hrLetters.generateButton')}</Button>}
      />

      <PagedDataTable
        columns={columns}
        queryKey={['hr-letters']}
        fetchPage={hrLetterApi.list}
        getRowKey={(l) => l.id}
        onView={(l) => window.alert(l.content)}
        onDelete={canManage ? (l) => deleteMutation.mutate(l.id) : undefined}
      />

      {showGenerate && (
        <Modal title={t('pages.hrLetters.generateButton')} onClose={closeGenerate}>
          <form onSubmit={handleGenerate} className="form-grid">
            <SelectField label={t('common.selectEmployee')} value={employeeId} onChange={(e) => setEmployeeId(Number(e.target.value))} required>
              <option value="">{t('common.selectEmployee')}</option>
              {employeeOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.employeeCode} - {e.firstName} {e.lastName}</option>
              ))}
            </SelectField>
            <SelectField label={t('pages.hrLetters.type')} value={letterType} onChange={(e) => setLetterType(e.target.value as LetterType)}>
              {LETTER_TYPES.map((type) => <option key={type} value={type}>{t(`pages.hrLetters.types.${type}`)}</option>)}
            </SelectField>
            <div className="form-actions">
              <Button type="submit" disabled={!employeeId || generateMutation.isPending}>
                {generateMutation.isPending ? t('common.creating') : t('pages.hrLetters.generateButton')}
              </Button>
              <Button type="button" variant="secondary" onClick={closeGenerate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
