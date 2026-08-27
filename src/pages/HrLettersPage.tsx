import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '../api/hr/employeeApi';
import { useLocale } from '../context/LocaleContext';
import { Button, DataTable, Modal, PageHeader, SelectField } from '../components/ui';
import type { DataTableColumn } from '../components/ui';

// Mock-only letter generation - reads real Employee data (Employees is a working module) but
// the generated letters themselves are never sent anywhere; the "template" is a canned string.

type LetterType = 'OFFER' | 'EXPERIENCE' | 'SALARY_CERTIFICATE' | 'RELIEVING' | 'CONFIRMATION';

interface GeneratedLetter {
  id: number;
  employeeId: number;
  employeeName: string;
  type: LetterType;
  generatedOn: string;
  generatedByName: string;
  previewText: string;
}

const LETTER_TYPES: LetterType[] = ['OFFER', 'EXPERIENCE', 'SALARY_CERTIFICATE', 'RELIEVING', 'CONFIRMATION'];

const LETTER_TEMPLATES: Record<LetterType, string> = {
  OFFER: 'We are pleased to offer {{employeeName}} the position of {{designation}} at Univo, effective from the date of joining.',
  EXPERIENCE: 'This is to certify that {{employeeName}} worked with Univo as {{designation}} and their conduct during the tenure was found to be satisfactory.',
  SALARY_CERTIFICATE: 'This is to certify that {{employeeName}}, {{designation}} at Univo, draws a salary as per company records.',
  RELIEVING: '{{employeeName}} has been relieved from their duties as {{designation}} at Univo as of the last working day.',
  CONFIRMATION: 'We are pleased to confirm the employment of {{employeeName}} as {{designation}} at Univo, effective from their date of joining.',
};

function seedLetters(): GeneratedLetter[] {
  return [];
}

export function HrLettersPage() {
  const { t } = useLocale();
  const { data: employees } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });
  const employeeOptions = employees?.content ?? [];

  const [letters, setLetters] = useState<GeneratedLetter[]>(seedLetters());
  const [showGenerate, setShowGenerate] = useState(false);
  const [employeeId, setEmployeeId] = useState<number | ''>('');
  const [letterType, setLetterType] = useState<LetterType>('OFFER');

  const selectedEmployee = employeeOptions.find((e) => e.id === employeeId);
  const preview = selectedEmployee
    ? LETTER_TEMPLATES[letterType]
        .replace('{{employeeName}}', `${selectedEmployee.firstName} ${selectedEmployee.lastName}`)
        .replace('{{designation}}', selectedEmployee.designationTitle ?? t('common.none'))
    : '';

  const closeGenerate = () => {
    setShowGenerate(false);
    setEmployeeId('');
    setLetterType('OFFER');
  };

  const handleGenerate = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedEmployee) return;
    setLetters((prev) => [
      {
        id: Date.now(),
        employeeId: selectedEmployee.id,
        employeeName: `${selectedEmployee.firstName} ${selectedEmployee.lastName}`,
        type: letterType,
        generatedOn: new Date().toISOString().slice(0, 10),
        generatedByName: 'You',
        previewText: preview,
      },
      ...prev,
    ]);
    closeGenerate();
  };

  const columns: DataTableColumn<GeneratedLetter>[] = [
    { key: 'employee', header: t('fields.name'), render: (l) => l.employeeName },
    { key: 'type', header: t('pages.hrLetters.type'), render: (l) => t(`pages.hrLetters.types.${l.type}`) },
    { key: 'generatedOn', header: t('pages.hrLetters.generatedOn'), render: (l) => l.generatedOn },
    { key: 'generatedBy', header: t('pages.hrLetters.generatedBy'), render: (l) => l.generatedByName },
  ];

  return (
    <div>
      <PageHeader
        title={t('pages.hrLetters.title')}
        description={t('pages.hrLetters.description')}
        actions={<Button onClick={() => setShowGenerate(true)}>{t('pages.hrLetters.generateButton')}</Button>}
      />

      <DataTable
        columns={columns}
        rows={letters}
        getRowKey={(l) => l.id}
        onView={(l) => window.alert(l.previewText)}
        onDelete={(l) => setLetters((prev) => prev.filter((row) => row.id !== l.id))}
      />
      <p className="field-hint" style={{ marginTop: 12 }}>{t('pages.hrLetters.mockNotice')}</p>

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
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('pages.hrLetters.preview')}</label>
              <textarea className="input" readOnly value={preview} style={{ minHeight: 120 }} />
            </div>
            <span className="field-hint" style={{ gridColumn: '1 / -1' }}>{t('pages.hrLetters.mockNotice')}</span>
            <div className="form-actions">
              <Button type="submit" disabled={!selectedEmployee}>{t('pages.hrLetters.generateButton')}</Button>
              <Button type="button" variant="secondary" onClick={closeGenerate}>{t('common.cancel')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
