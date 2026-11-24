import { AUTH_FIELDS } from "@/lib/auth/routes";
import { EMAIL_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/lib/auth/validation";

/**
 * Form fields of the account pages (M5-02). Plain server-rendered inputs
 * with a permanent label; the browser's own checks only help, the form
 * handlers check everything again (lib/auth/validation.ts). Field names
 * come from lib/auth/routes.ts so pages and handlers cannot drift apart.
 */
const INPUT_CLASS =
  "mt-2 block min-h-11 w-full rounded-sm border border-dark-silver bg-white px-3 py-2 text-base text-ink";

export function EmailField({ label, id }: { label: string; id: string }) {
  return (
    <div className="mt-6">
      <label className="block text-sm font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      <input
        autoCapitalize="none"
        autoComplete="email"
        className={INPUT_CLASS}
        id={id}
        maxLength={EMAIL_MAX_LENGTH}
        name={AUTH_FIELDS.email}
        required
        spellCheck={false}
        type="email"
      />
    </div>
  );
}

type PasswordKind = "current" | "login" | "new" | "confirm";

const PASSWORD_NAMES: Record<PasswordKind, string> = {
  current: AUTH_FIELDS.currentPassword,
  login: AUTH_FIELDS.password,
  new: AUTH_FIELDS.password,
  confirm: AUTH_FIELDS.passwordConfirm,
};

export function PasswordField({
  kind,
  label,
  id,
  hint,
}: {
  kind: PasswordKind;
  label: string;
  id: string;
  /** Rule shown under a new-password field; read with the field. */
  hint?: string;
}) {
  const isNew = kind === "new" || kind === "confirm";
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="mt-6">
      <label className="block text-sm font-semibold text-ink" htmlFor={id}>
        {label}
      </label>
      <input
        aria-describedby={hintId}
        autoComplete={isNew ? "new-password" : "current-password"}
        className={INPUT_CLASS}
        id={id}
        maxLength={PASSWORD_MAX_LENGTH}
        minLength={isNew ? PASSWORD_MIN_LENGTH : undefined}
        name={PASSWORD_NAMES[kind]}
        required
        type="password"
      />
      {hint ? (
        <p className="mt-1.5 text-sm text-muted" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function SubmitButton({ children, tone = "primary" }: { children: string; tone?: "primary" | "outline" }) {
  return (
    <button className={`btn ${tone === "primary" ? "btn-primary" : "btn-outline-dark"} mt-8`} type="submit">
      {children}
    </button>
  );
}
