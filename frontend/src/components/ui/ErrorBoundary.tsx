import React from 'react';
import { Container } from '../ui/Container';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface State {
  hasError: boolean;
}

type ErrorBoundaryProps = { children?: React.ReactNode };

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('Unhandled error', error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <Container className="py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600">
              <Icon name="sparkles" size={14} />
              Error
            </span>
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Something went wrong
            </h1>
            <p className="mt-4 text-slate-600 dark:text-slate-300">
              An unexpected error occurred. Try refreshing the page or come back later.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button onClick={() => window.location.reload()}>Reload</Button>
              <Button variant="secondary" onClick={this.reset}>Dismiss</Button>
            </div>
          </div>
        </Container>
      );
    }

    return this.props.children;
  }
}
