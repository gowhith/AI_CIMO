import { LucideIcon } from "lucide-react";

interface Props {
  Icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}

export function EmptyState({ Icon, title, body, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="h-12 w-12 rounded-full bg-surface-3 flex items-center justify-center mb-3">
        <Icon className="h-5 w-5 text-fg-muted" />
      </div>
      <div className="text-fg font-semibold text-base">{title}</div>
      {body && (
        <div className="text-sm text-fg-muted mt-1.5 max-w-sm leading-relaxed">
          {body}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
