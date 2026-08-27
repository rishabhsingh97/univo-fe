import type { ChangeEvent } from 'react';
import { useLocale } from '../context/LocaleContext';
import { Button, SelectField, TextField } from './ui';

// Extra Candidate-Details-page fields shown alongside the core, backend-wired candidate form
// (job posting / name / email / phone / source / resume / status) inside the "Add candidate"
// popup. These are UI-preview only - no API field exists for them yet, so they aren't sent on
// submit (see the mockNotice copy shown in the popup).

export interface AddressData {
  line1: string;
  line2: string;
  city: string;
  country: string;
  state: string;
  postalCode: string;
}

export interface EducationRow {
  id: number;
  schoolName: string;
  degree: string;
  fieldOfStudy: string;
  dateOfCompletion: string;
  notes: string;
}

export interface ExperienceRow {
  id: number;
  occupation: string;
  company: string;
  summary: string;
  duration: string;
  currentlyWorkHere: '' | 'YES' | 'NO';
}

export interface CandidateExtras {
  officialEmail: string;
  uan: string;
  aadhaar: string;
  pan: string;
  photoFileName: string;
  present: AddressData;
  permanent: AddressData;
  sameAsPresent: boolean;
  totalExperience: string;
  skillSet: string;
  highestQualification: string;
  additionalInformation: string;
  location: string;
  jobTitle: string;
  currentSalary: string;
  department: string;
  offerLetterFileName: string;
  tentativeJoiningDate: string;
  education: EducationRow[];
  experience: ExperienceRow[];
}

function emptyAddress(): AddressData {
  return { line1: '', line2: '', city: '', country: '', state: '', postalCode: '' };
}

function emptyEducationRow(id: number): EducationRow {
  return { id, schoolName: '', degree: '', fieldOfStudy: '', dateOfCompletion: '', notes: '' };
}

function emptyExperienceRow(id: number): ExperienceRow {
  return { id, occupation: '', company: '', summary: '', duration: '', currentlyWorkHere: '' };
}

export function emptyCandidateExtras(): CandidateExtras {
  return {
    officialEmail: '',
    uan: '',
    aadhaar: '',
    pan: '',
    photoFileName: '',
    present: emptyAddress(),
    permanent: emptyAddress(),
    sameAsPresent: false,
    totalExperience: '',
    skillSet: '',
    highestQualification: '',
    additionalInformation: '',
    location: '',
    jobTitle: '',
    currentSalary: '',
    department: '',
    offerLetterFileName: '',
    tentativeJoiningDate: '',
    education: [emptyEducationRow(1)],
    experience: [emptyExperienceRow(1)],
  };
}

const LOCATION_OPTIONS = ['Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune', 'Remote'];
const TITLE_OPTIONS = ['Software Engineer', 'Senior Software Engineer', 'HR Executive', 'Product Manager', 'Sales Associate'];
const DEPARTMENT_OPTIONS = ['Engineering', 'Human Resources', 'Sales', 'Finance', 'Operations'];
const COUNTRY_OPTIONS = ['India', 'United States', 'United Kingdom'];
const STATE_OPTIONS = ['Karnataka', 'Maharashtra', 'Delhi', 'Tamil Nadu', 'Uttar Pradesh', 'Telangana'];

function UploadField({
  label,
  fileName,
  onFileChange,
  helpText,
  maxSizeText,
}: {
  label: string;
  fileName: string;
  onFileChange: (file: File | null) => void;
  helpText: string;
  maxSizeText: string;
}) {
  const { t } = useLocale();
  return (
    <div className="upload-field">
      <span className="field-label">{label}</span>
      <span className="field-hint">{t('pages.addCandidate.uploadFrom')}</span>
      <div className="upload-tabs">
        <button type="button" className="upload-tab is-active">{t('pages.addCandidate.desktop')}</button>
        <button type="button" className="upload-tab" disabled title={t('pages.addCandidate.others')}>
          {t('pages.addCandidate.others')}
        </button>
      </div>
      <div className="upload-dropzone">
        <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => onFileChange(e.target.files?.[0] ?? null)} />
        <span className="upload-filename">{fileName || t('pages.addCandidate.noFileChosen')}</span>
      </div>
      {helpText && <span className="field-hint">{helpText}</span>}
      <span className="field-hint">{maxSizeText}</span>
    </div>
  );
}

export function CandidateDetailsFormFields({
  value,
  onChange,
}: {
  value: CandidateExtras;
  onChange: (next: CandidateExtras) => void;
}) {
  const { t } = useLocale();

  const update = (patch: Partial<CandidateExtras>) => onChange({ ...value, ...patch });

  const updatePresent = (patch: Partial<AddressData>) => {
    const present = { ...value.present, ...patch };
    onChange({ ...value, present, permanent: value.sameAsPresent ? present : value.permanent });
  };
  const updatePermanent = (patch: Partial<AddressData>) => onChange({ ...value, permanent: { ...value.permanent, ...patch } });
  const toggleSameAsPresent = (checked: boolean) =>
    onChange({ ...value, sameAsPresent: checked, permanent: checked ? { ...value.present } : value.permanent });

  const addEducationRow = () => onChange({ ...value, education: [...value.education, emptyEducationRow(Date.now())] });
  const removeEducationRow = (id: number) => onChange({ ...value, education: value.education.filter((row) => row.id !== id) });
  const updateEducationRow = (id: number, patch: Partial<EducationRow>) =>
    onChange({ ...value, education: value.education.map((row) => (row.id === id ? { ...row, ...patch } : row)) });

  const addExperienceRow = () => onChange({ ...value, experience: [...value.experience, emptyExperienceRow(Date.now())] });
  const removeExperienceRow = (id: number) => onChange({ ...value, experience: value.experience.filter((row) => row.id !== id) });
  const updateExperienceRow = (id: number, patch: Partial<ExperienceRow>) =>
    onChange({ ...value, experience: value.experience.map((row) => (row.id === id ? { ...row, ...patch } : row)) });

  return (
    <>
      <TextField label={t('fields.officialEmail')} type="email" value={value.officialEmail} onChange={(e) => update({ officialEmail: e.target.value })} />
      <TextField label={t('fields.uan')} value={value.uan} onChange={(e) => update({ uan: e.target.value })} />
      <TextField label={t('fields.aadhaarMasked')} value={value.aadhaar} onChange={(e) => update({ aadhaar: e.target.value })} />
      <TextField label={t('fields.pan')} value={value.pan} onChange={(e) => update({ pan: e.target.value })} />
      <UploadField
        label={t('pages.addCandidate.photo')}
        fileName={value.photoFileName}
        onFileChange={(file) => update({ photoFileName: file?.name ?? '' })}
        helpText={t('pages.addCandidate.filesSupportedImage')}
        maxSizeText={t('pages.addCandidate.maxSize5Mb')}
      />

      <h3 className="form-section-title" style={{ gridColumn: '1 / -1' }}>{t('pages.addCandidate.sections.addressDetails')}</h3>
      <div className="address-block">
        <div className="address-block-header">
          <h3>{t('pages.addCandidate.presentAddress')}</h3>
        </div>
        <div className="address-block-fields">
          <TextField label={t('fields.addressLine1')} value={value.present.line1} onChange={(e) => updatePresent({ line1: e.target.value })} />
          <TextField label={t('fields.addressLine2')} value={value.present.line2} onChange={(e) => updatePresent({ line2: e.target.value })} />
          <TextField label={t('fields.city')} value={value.present.city} onChange={(e) => updatePresent({ city: e.target.value })} />
          <SelectField label={t('fields.country')} value={value.present.country} onChange={(e) => updatePresent({ country: e.target.value })}>
            <option value="">{t('common.selectOption')}</option>
            {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <SelectField label={t('fields.state')} value={value.present.state} onChange={(e) => updatePresent({ state: e.target.value })}>
            <option value="">{t('common.selectOption')}</option>
            {STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <TextField label={t('fields.postalCode')} value={value.present.postalCode} onChange={(e) => updatePresent({ postalCode: e.target.value })} />
        </div>
      </div>
      <div className="address-block">
        <div className="address-block-header">
          <h3>{t('pages.addCandidate.permanentAddress')}</h3>
          <label className="checkbox-option">
            <input type="checkbox" checked={value.sameAsPresent} onChange={(e) => toggleSameAsPresent(e.target.checked)} />
            {t('pages.addCandidate.sameAsPresentAddress')}
          </label>
        </div>
        <div className="address-block-fields">
          <TextField label={t('fields.addressLine1')} value={value.permanent.line1} disabled={value.sameAsPresent} onChange={(e) => updatePermanent({ line1: e.target.value })} />
          <TextField label={t('fields.addressLine2')} value={value.permanent.line2} disabled={value.sameAsPresent} onChange={(e) => updatePermanent({ line2: e.target.value })} />
          <TextField label={t('fields.city')} value={value.permanent.city} disabled={value.sameAsPresent} onChange={(e) => updatePermanent({ city: e.target.value })} />
          <SelectField label={t('fields.country')} value={value.permanent.country} disabled={value.sameAsPresent} onChange={(e) => updatePermanent({ country: e.target.value })}>
            <option value="">{t('common.selectOption')}</option>
            {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectField>
          <SelectField label={t('fields.state')} value={value.permanent.state} disabled={value.sameAsPresent} onChange={(e) => updatePermanent({ state: e.target.value })}>
            <option value="">{t('common.selectOption')}</option>
            {STATE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </SelectField>
          <TextField label={t('fields.postalCode')} value={value.permanent.postalCode} disabled={value.sameAsPresent} onChange={(e) => updatePermanent({ postalCode: e.target.value })} />
        </div>
      </div>

      <h3 className="form-section-title" style={{ gridColumn: '1 / -1' }}>{t('pages.addCandidate.sections.professionalDetails')}</h3>
      <TextField label={t('fields.totalExperience')} value={value.totalExperience} onChange={(e) => update({ totalExperience: e.target.value })} />
      <TextField label={t('fields.skillSet')} value={value.skillSet} onChange={(e) => update({ skillSet: e.target.value })} />
      <TextField label={t('fields.highestQualification')} value={value.highestQualification} onChange={(e) => update({ highestQualification: e.target.value })} />
      <div className="field" style={{ gridColumn: '1 / -1' }}>
        <label className="field-label" htmlFor="additional-information">{t('fields.additionalInformation')}</label>
        <textarea id="additional-information" className="input" value={value.additionalInformation} onChange={(e) => update({ additionalInformation: e.target.value })} />
      </div>
      <SelectField label={t('fields.location')} value={value.location} onChange={(e) => update({ location: e.target.value })}>
        <option value="">{t('common.selectOption')}</option>
        {LOCATION_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
      </SelectField>
      <SelectField label={t('fields.jobTitle')} value={value.jobTitle} onChange={(e) => update({ jobTitle: e.target.value })}>
        <option value="">{t('common.selectOption')}</option>
        {TITLE_OPTIONS.map((title) => <option key={title} value={title}>{title}</option>)}
      </SelectField>
      <TextField label={t('fields.currentSalary')} value={value.currentSalary} onChange={(e) => update({ currentSalary: e.target.value })} />
      <SelectField label={t('fields.department')} value={value.department} onChange={(e) => update({ department: e.target.value })}>
        <option value="">{t('common.selectOption')}</option>
        {DEPARTMENT_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
      </SelectField>
      <UploadField
        label={t('pages.addCandidate.offerLetter')}
        fileName={value.offerLetterFileName}
        onFileChange={(file) => update({ offerLetterFileName: file?.name ?? '' })}
        helpText=""
        maxSizeText={t('pages.addCandidate.maxSize5Mb')}
      />
      <div className="field">
        <label className="field-label" htmlFor="tentative-joining-date">{t('fields.tentativeJoiningDate')}</label>
        <input id="tentative-joining-date" type="date" className="input" value={value.tentativeJoiningDate} onChange={(e) => update({ tentativeJoiningDate: e.target.value })} />
        <span className="field-hint">dd-MMM-yyyy</span>
      </div>

      <div className="address-block-header" style={{ gridColumn: '1 / -1' }}>
        <h3 className="form-section-title" style={{ margin: 0 }}>{t('pages.addCandidate.sections.education')}</h3>
        <Button type="button" variant="secondary" onClick={addEducationRow}>{t('pages.addCandidate.addRow')}</Button>
      </div>
      {value.education.map((row, index) => (
        <div className="repeatable-row" key={row.id}>
          <div className="repeatable-row-header">
            <span>{t('pages.addCandidate.sections.education')} {index + 1}</span>
            {value.education.length > 1 && (
              <Button type="button" variant="danger" onClick={() => removeEducationRow(row.id)}>{t('pages.addCandidate.removeRow')}</Button>
            )}
          </div>
          <div className="repeatable-row-grid">
            <TextField label={t('fields.schoolName')} value={row.schoolName} onChange={(e) => updateEducationRow(row.id, { schoolName: e.target.value })} />
            <TextField label={t('fields.degreeDiploma')} value={row.degree} onChange={(e) => updateEducationRow(row.id, { degree: e.target.value })} />
            <TextField label={t('fields.fieldOfStudy')} value={row.fieldOfStudy} onChange={(e) => updateEducationRow(row.id, { fieldOfStudy: e.target.value })} />
            <div className="field">
              <label className="field-label">{t('fields.dateOfCompletion')}</label>
              <input type="date" className="input" value={row.dateOfCompletion} onChange={(e) => updateEducationRow(row.id, { dateOfCompletion: e.target.value })} />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.additionalNotes')}</label>
              <textarea className="input" value={row.notes} onChange={(e) => updateEducationRow(row.id, { notes: e.target.value })} />
            </div>
          </div>
        </div>
      ))}

      <div className="address-block-header" style={{ gridColumn: '1 / -1' }}>
        <h3 className="form-section-title" style={{ margin: 0 }}>{t('pages.addCandidate.sections.experience')}</h3>
        <Button type="button" variant="secondary" onClick={addExperienceRow}>{t('pages.addCandidate.addRow')}</Button>
      </div>
      {value.experience.map((row, index) => (
        <div className="repeatable-row" key={row.id}>
          <div className="repeatable-row-header">
            <span>{t('pages.addCandidate.sections.experience')} {index + 1}</span>
            {value.experience.length > 1 && (
              <Button type="button" variant="danger" onClick={() => removeExperienceRow(row.id)}>{t('pages.addCandidate.removeRow')}</Button>
            )}
          </div>
          <div className="repeatable-row-grid">
            <TextField label={t('fields.occupation')} value={row.occupation} onChange={(e) => updateExperienceRow(row.id, { occupation: e.target.value })} />
            <TextField label={t('fields.company')} value={row.company} onChange={(e) => updateExperienceRow(row.id, { company: e.target.value })} />
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="field-label">{t('fields.summary')}</label>
              <textarea className="input" value={row.summary} onChange={(e) => updateExperienceRow(row.id, { summary: e.target.value })} />
            </div>
            <TextField label={t('fields.duration')} value={row.duration} onChange={(e) => updateExperienceRow(row.id, { duration: e.target.value })} />
            <SelectField
              label={t('fields.currentlyWorkHere')}
              value={row.currentlyWorkHere}
              onChange={(e) => updateExperienceRow(row.id, { currentlyWorkHere: e.target.value as ExperienceRow['currentlyWorkHere'] })}
            >
              <option value="">{t('common.selectOption')}</option>
              <option value="YES">{t('common.yes')}</option>
              <option value="NO">{t('common.no')}</option>
            </SelectField>
          </div>
        </div>
      ))}
    </>
  );
}
