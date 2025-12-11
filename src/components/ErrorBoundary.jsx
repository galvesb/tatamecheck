import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="app-shell">
                    <div className="app-body">
                        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <h2 style={{ color: '#f87171' }}>Ops! Algo deu errado</h2>
                            <p style={{ color: 'rgba(226, 232, 240, 0.7)', marginTop: '1rem' }}>
                                Ocorreu um erro ao carregar a página. Por favor, recarregue a página.
                            </p>
                            <button 
                                className="btn primary" 
                                style={{ marginTop: '1.5rem' }}
                                onClick={() => window.location.reload()}
                            >
                                Recarregar Página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

