import { Badge, type BadgeTone } from './Badge';
import './ui.css';

interface PillListProps {
  items: string[];
  /** A fixed tone for every pill, or a function to pick one per item (e.g. statusTone). */
  tone?: BadgeTone | ((item: string) => BadgeTone);
  emptyText?: string;
}

/** Renders a list of short labels (roles, permissions, tags, ...) as independent pills instead
 * of a single comma-joined string - reused anywhere a page currently does `list.join(', ')`. */
export function PillList({ items, tone = 'neutral', emptyText = '-' }: PillListProps) {
  if (items.length === 0) {
    return <span className="pill-list-empty">{emptyText}</span>;
  }
  return (
    <span className="pill-list">
      {items.map((item) => (
        <Badge key={item} tone={typeof tone === 'function' ? tone(item) : tone}>
          {item}
        </Badge>
      ))}
    </span>
  );
}
