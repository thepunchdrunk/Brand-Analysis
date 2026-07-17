
import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
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

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReload = (): void => {
        window.location.reload();
    };

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-xl">
                        {/* Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#E2000F]/10 flex items-center justify-center border border-[#E2000F]/20">
                            <AlertTriangle className="h-8 w-8 text-[#E2000F]" />
                        </div>

                        {/* Title */}
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                            Something went wrong
                        </h2>

                        {/* Description */}
                        <p className="text-slate-500 text-sm mb-6">
                            An unexpected error occurred. This may be due to a connection issue or a temporary problem.
                        </p>

                        {/* Error Details (collapsed) */}
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 transition-colors">
                                    Technical details
                                </summary>
                                <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-[10px] text-red-600 overflow-auto max-h-32 font-mono border border-slate-200">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}

                        {/* Reload Button */}
                        <button
                            onClick={this.handleReload}
                            className="px-6 py-3 bg-[#E2000F] text-white rounded-xl font-bold text-sm hover:bg-[#c2000d] transition-colors flex items-center justify-center gap-2 mx-auto shadow-lg shadow-red-500/20"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
