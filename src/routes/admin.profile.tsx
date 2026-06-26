import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { changeAdminPassword } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/profile")({
  head: () => ({
    meta: [{ title: "Profile — Admin" }],
  }),
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const newPasswordIsLongEnough = newPassword.length >= 12;
  const passwordsMatch =
    confirmation.length > 0 && newPassword === confirmation;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!currentPassword) {
      setError("Enter your current password.");
      return;
    }

    if (!newPasswordIsLongEnough) {
      setError("The new password must contain at least 12 characters.");
      return;
    }

    if (newPassword !== confirmation) {
      setError("The new password confirmation does not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("The new password must be different from the current password.");
      return;
    }

    try {
      setIsSaving(true);

      await changeAdminPassword(currentPassword, newPassword);

      navigate({
        to: "/login",
        search: {
          reason: "password_changed",
        },
      });
    } catch (changeError) {
      console.error(changeError);
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Could not change password"
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminLayout title="Profile">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-2xl border border-primary/20 bg-primary-soft/25 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ShieldCheck className="h-5 w-5" />
            </span>

            <div>
              <h2 className="font-display text-lg">Admin account security</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Change the password used to access the Elamora back office.
                After the change, this session will be closed and you will
                need to sign in again.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-surface/80 p-5 shadow-soft md:p-6">
          <div className="mb-6 flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-display text-xl">Change password</h2>
              <p className="text-sm text-muted-foreground">
                Your new password must contain at least 12 characters.
              </p>
            </div>
          </div>

          {error ? (
            <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              visible={showCurrentPassword}
              onToggleVisibility={() =>
                setShowCurrentPassword((current) => !current)
              }
              autoComplete="current-password"
            />

            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              visible={showNewPassword}
              onToggleVisibility={() =>
                setShowNewPassword((current) => !current)
              }
              autoComplete="new-password"
            />

            <PasswordField
              label="Confirm new password"
              value={confirmation}
              onChange={setConfirmation}
              visible={showNewPassword}
              onToggleVisibility={() =>
                setShowNewPassword((current) => !current)
              }
              autoComplete="new-password"
            />

            <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-sm">
              <p
                className={
                  newPassword.length === 0
                    ? "text-muted-foreground"
                    : newPasswordIsLongEnough
                      ? "text-emerald-700"
                      : "text-destructive"
                }
              >
                At least 12 characters
              </p>

              <p
                className={
                  confirmation.length === 0
                    ? "mt-1 text-muted-foreground"
                    : passwordsMatch
                      ? "mt-1 text-emerald-700"
                      : "mt-1 text-destructive"
                }
              >
                Password confirmation matches
              </p>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? "Changing password..." : "Change password"}
            </button>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisibility: () => void;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>

      <div className="mt-2 flex items-center rounded-xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required
          className="h-12 min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          className="flex h-12 w-12 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </label>
  );
}
