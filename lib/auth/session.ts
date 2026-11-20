import { cookies } from "next/headers";

import { isAuthEnabled } from "./env";
import { createAuthClient, logAuthError } from "./supabase";

/**
 * The signed-in public user for the account page (M5-02, DECISIONS §2.18
 * decisions 8 and 13): email and verification state from Supabase Auth
 * (getUser(), verified by the Auth server), nothing else. Null without a
 * valid session; the page then shows its "session ended" state.
 *
 * Read-only: a server component cannot set cookies, so the jar drops what
 * Supabase would set. proxy.ts refreshes the session on the account route
 * before the page renders (lib/auth/proxy-session.ts).
 */
export type AccountUser = { email: string; emailConfirmed: boolean };

export async function getAccountUser(): Promise<AccountUser | null> {
  if (!isAuthEnabled()) return null;
  const store = await cookies();
  const client = createAuthClient(
    { getAll: () => store.getAll().map(({ name, value }) => ({ name, value })), setAll: () => { } },
    { secure: false },
  );
  try {
    const { data, error } = await client.getUser();
    if (error) {
      if (error.name !== "AuthSessionMissingError") logAuthError("account", error);
      return null;
    }
    const email = data.user?.email;
    if (!email) return null;
    return { email, emailConfirmed: Boolean(data.user.email_confirmed_at) };
  } catch (error) {
    logAuthError("account", error);
    return null;
  }
}
