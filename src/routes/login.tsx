import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { Flower2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login — Elamora" },
      { name: "description", content: "Sign in to your Elamora workspace." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement real authentication.
    // For now, redirect to the admin dashboard.
    navigate({ to: "/admin" });
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-surface/80 border border-border/60 rounded-3xl p-8 shadow-bloom">
          <div className="flex items-center justify-center mb-6">
            <span className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Flower2 className="h-5 w-5" />
            </span>
          </div>
          <h1 className="font-display text-2xl text-center">Login</h1>
          <p className="text-sm text-muted-foreground text-center mt-1">
            Access your admin workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Sign in
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-4 italic">
            TODO: connect real authentication.
          </p>

          <Link to="/" className="block text-center text-xs text-muted-foreground hover:text-foreground mt-6">
            ← Back to site
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
