import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: React.ReactNode;
  pageName?: string;
}
interface State {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">
              {this.props.pageName ?? "Page"} failed to load
            </h2>
            <p className="text-sm text-slate-500 max-w-md">
              Something went wrong — possibly a Supabase connection issue or a temporary error.
              {this.state.errorMessage && (
                <span className="block mt-2 font-mono text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                  {this.state.errorMessage}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              this.setState({ hasError: false, errorMessage: "" });
              window.location.reload();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
