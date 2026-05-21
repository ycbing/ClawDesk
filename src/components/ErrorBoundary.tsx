import { Component, ReactNode } from "react";
import { t } from "../lib/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in">
          <div className="text-4xl mb-4">💀</div>
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {t("error.title")}
          </h2>
          <p
            className="text-sm mb-6 max-w-md"
            style={{ color: "var(--text-muted)" }}
          >
            {this.state.error?.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110 active:scale-95"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            {t("error.retry")}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
