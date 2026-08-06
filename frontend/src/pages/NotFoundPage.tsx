import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Container } from "../components/ui/Container";
import { Icon } from "../components/ui/Icon";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Container className="flex min-h-[70dvh] items-center justify-center py-20">
      <div className="animate-fade-in-up text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-600 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-400">
          Error 404
        </span>
        <h1 className="mt-6 text-6xl font-extrabold tracking-tight text-slate-900 sm:text-7xl dark:text-white">
          Page not found
        </h1>
        <p className="mx-auto mt-4 max-w-md text-lg text-slate-600 dark:text-slate-300">
          This page doesn't exist in your study library. Let's get you back to
          learning.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => navigate("/")}>
            <Icon name="home" size={18} />
            Back to home
          </Button>
          <Button size="lg" variant="secondary" onClick={() => navigate("/chat")}>
            Open Study Chat
          </Button>
        </div>
      </div>
    </Container>
  );
}