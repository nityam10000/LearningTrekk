import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    minHeight: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#f8f9fa',
                    margin: '20px',
                    borderRadius: '8px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ 
                        fontSize: '64px', 
                        color: '#dc3545', 
                        marginBottom: '20px' 
                    }}>
                        ⚠️
                    </div>
                    <h2 style={{ color: '#dc3545', marginBottom: '16px' }}>
                        Oops! Something went wrong
                    </h2>
                    <p style={{ 
                        color: '#6c757d', 
                        marginBottom: '24px',
                        maxWidth: '500px'
                    }}>
                        We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                        Refresh Page
                    </button>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <details style={{ 
                            marginTop: '24px', 
                            textAlign: 'left',
                            maxWidth: '600px',
                            backgroundColor: '#f8f9fa',
                            padding: '16px',
                            borderRadius: '4px',
                            border: '1px solid #dee2e6'
                        }}>
                            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                                Error Details (Development Mode)
                            </summary>
                            <pre style={{ 
                                marginTop: '10px', 
                                fontSize: '12px',
                                color: '#dc3545',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {this.state.error.toString()}
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;