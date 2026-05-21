import { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  hint?: string;
};

export function EmptyState({ title, description, action, hint }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-mark" aria-hidden="true">+</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {hint && <small>{hint}</small>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
