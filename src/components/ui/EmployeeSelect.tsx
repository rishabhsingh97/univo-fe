import { useQuery } from '@tanstack/react-query';
import { employeeApi } from '../../api/hr/employeeApi';
import { useLocale } from '../../context/LocaleContext';
import { SelectField } from './Field';

interface EmployeeSelectProps {
  value: number | '';
  onChange: (employeeId: number) => void;
  label?: string;
  required?: boolean;
}

/** One fetch-and-render implementation of "pick an employee" instead of every form (Attendance,
 * Leave, Salary Structures, Loans, Reimbursements) duplicating the same query + <option> list. */
export function EmployeeSelect({ value, onChange, label, required }: EmployeeSelectProps) {
  const { t } = useLocale();
  const { data } = useQuery({ queryKey: ['employees', 'select'], queryFn: () => employeeApi.list(0, 200) });

  return (
    <SelectField
      label={label ?? t('common.selectEmployee')}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      required={required}
    >
      <option value="">{t('common.selectEmployee')}</option>
      {data?.content.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.employeeCode} - {employee.firstName} {employee.lastName}
        </option>
      ))}
    </SelectField>
  );
}
