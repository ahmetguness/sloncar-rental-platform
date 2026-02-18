import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './ui/Button';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-dark-bg/50 backdrop-blur-md rounded-3xl border border-white/10 m-6">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Bir Bileşen Hatası Oluştu</h2>
                    <p className="text-gray-400 max-w-md mb-8">
                        Görüntülenmeye çalışılan bir bileşende teknik bir sorun yaşandı.
                    </p>
                    <div className="bg-black/40 p-4 rounded-xl text-left font-mono text-xs text-red-400 mb-8 max-w-full overflow-auto border border-red-500/20">
                        {this.state.error?.toString()}
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Sayfayı Yenile
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
