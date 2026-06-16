import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  pageName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <div className="size-14 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="size-7 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Terjadi Kesalahan</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {this.state.error?.message || "Something went wrong"}
              </p>
            </div>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/50 border border-border text-xs text-foreground hover:bg-accent transition-colors"
            >
              <RefreshCw className="size-3.5" /> Coba Lagi
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
