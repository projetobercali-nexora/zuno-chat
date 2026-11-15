import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export const PageSkeleton: React.FC = () => {
  return (
    <div
      data-testid="page-skeleton"
      aria-busy="true"
      aria-label="A carregar módulo"
      className="space-y-5 animate-pulse"
    >
      <div className="rounded-2xl border border-[#E2E7E3] bg-white p-5 sm:p-6 space-y-3">
        <div className="h-5 w-44 rounded-lg bg-[#E3F6EA]" />
        <div className="h-7 w-72 max-w-full rounded-lg bg-[#F4F4F2]" />
        <div className="h-4 w-96 max-w-full rounded-lg bg-[#F4F4F2]" />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-[#E2E7E3] bg-white p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-[#F4F4F2]" />
              <div className="h-9 w-9 rounded-xl bg-[#E3F6EA]" />
            </div>
            <div className="h-7 w-16 rounded bg-[#F4F4F2]" />
            <div className="h-3.5 w-32 rounded bg-[#F4F4F2]" />
          </div>
        ))}
      </div>
    </div>
  );
};

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({ message, onRetry }) => {
  return (
    <div
      role="alert"
      data-testid="error-state-banner"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#D63B3A]/35 bg-[#FCEBEB] p-4 sm:p-5 text-[#791F1F]"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-[#D63B3A] shrink-0 mt-0.5" />
        <div>
          <p className="font-display text-sm sm:text-base font-bold">
            Ocorreu um problema ao carregar os dados
          </p>
          <p className="mt-0.5 text-sm text-[#791F1F]/90">{message}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#D63B3A] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b92f2e] transition-colors shrink-0"
      >
        <RefreshCw className="h-4 w-4" />
        Tentar novamente
      </button>
    </div>
  );
};

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  AppErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      message:
        error?.message ||
        'Não foi possível apresentar esta secção corretamente.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBanner
          message={this.state.message}
          onRetry={() => {
            this.setState({ hasError: false, message: '' });
            this.props.onReset?.();
          }}
        />
      );
    }
    return this.props.children;
  }
}
