import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { AlertTriangle, RefreshCw, Home, ChevronDown } from 'lucide-react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  /** Changing this clears a caught error. Pass the route to recover on navigation. */
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
  showDetails?: boolean;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[70vh] w-full flex items-center justify-center p-6" dir="rtl">
      <div className="max-w-md w-full text-center rounded-[32px] border border-[#DEE6E0] bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <AlertTriangle className="size-7" />
        </div>

        <h2 className="font-display text-2xl font-bold text-foreground">
          حدث خطأ غير متوقع
        </h2>
        <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
          نعتذر بشدة عن هذا الإزعاج، تم تسجيل الخطأ ويمكنكِ المحاولة مجدداً أو العودة للتسوق.
        </p>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={resetError}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#4E7A5A] px-5 py-3 text-xs font-bold text-white shadow-md shadow-[#4E7A5A]/20 transition hover:bg-[#3F6649] active:scale-95"
          >
            <RefreshCw className="size-3.5" /> إعادة المحاولة
          </button>
          <a
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full border border-[#DEE6E0] bg-[#FAFBF9] px-5 py-3 text-xs font-bold text-foreground transition hover:bg-white"
          >
            <Home className="size-3.5" /> الصفحة الرئيسية
          </a>
        </div>

        {/* Technical Details Collapsible */}
        <details className="mt-6 text-right group">
          <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground flex items-center justify-between py-1 border-t border-border pt-3">
            <span>تفاصيل تقنية للمطورين</span>
            <ChevronDown className="size-3 transition group-open:rotate-180" />
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-xl bg-gray-50 p-3 text-left text-[10px] text-gray-700 font-mono border border-gray-200 max-h-36">
            {error.message || String(error)}
          </pre>
        </details>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
