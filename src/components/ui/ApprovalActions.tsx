import { useLocale } from '../../context/LocaleContext';
import { Badge, statusTone } from './Badge';
import { Button } from './Button';
import './ui.css';

interface ApprovalActionsProps {
  status: string;
  onApprove: () => void;
  onReject: () => void;
  /** Whether the current user is allowed to act (e.g. holds the module's .write permission) -
   * when false, only the status badge renders, same as a resolved PENDING. */
  canManage: boolean;
}

/** Leave applications, loans/advances, and reimbursements all share the exact same
 * PENDING -> APPROVED/REJECTED shape - one component renders the status + action buttons for
 * all three instead of three near-identical implementations. */
export function ApprovalActions({ status, onApprove, onReject, canManage }: ApprovalActionsProps) {
  const { t } = useLocale();

  if (status !== 'PENDING' || !canManage) {
    return <Badge tone={statusTone(status)}>{status}</Badge>;
  }

  return (
    <div className="row-actions">
      <Badge tone={statusTone(status)}>{status}</Badge>
      <Button variant="secondary" onClick={onApprove}>{t('common.approve')}</Button>
      <Button variant="danger" onClick={onReject}>{t('common.reject')}</Button>
    </div>
  );
}
