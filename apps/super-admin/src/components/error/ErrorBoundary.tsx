import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Super Admin error boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-surface-2 p-6 text-center">
          <section className="max-w-md rounded-2xl border border-surface-4 bg-white p-8 shadow-lg" role="alert">
            <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
            <p className="mt-2 text-sm text-ink-muted">
              The Super Admin dashboard encountered an unexpected error. Please refresh the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Refresh page
            </button>
          </section>
        </main>
      )
    }

    return this.props.children
  }
}
