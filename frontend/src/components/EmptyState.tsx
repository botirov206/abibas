import { HugeiconsIconProps } from '@hugeicons/react';

type HugeIcon = (props: Omit<HugeiconsIconProps, 'icon'>) => React.JSX.Element;

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: HugeIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gray-100 flex items-center justify-center mb-4">
        <Icon size={36} primaryColor="#788596" />
      </div>
      <p className="text-lg font-semibold text-brand-muted">{title}</p>
      {description && <p className="text-sm text-brand-muted mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
