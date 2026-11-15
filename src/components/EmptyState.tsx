import React from 'react';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  testId?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  testId,
}) => {
  return (
    <div
      data-testid={testId}
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#0B5226]/20 bg-white px-5 py-10 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E3F6EA] text-[#178A3F]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-3.5 font-display text-base font-bold text-[#0B5226]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-[#526058] leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#178A3F] px-4 py-2 text-sm font-semibold text-white hover:bg-[#137334] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
