/**
 * The "Connect Claude Code" command composer (the Connect Claude Code page). A person signed into
 * the dashboard mints a personal token and gets back ONE ready-to-paste command
 * that points their own Claude Code at this hosted register through the
 * `remote-api` connector. Everything environmental — the API URL, the env-var
 * name — is baked in here; the person supplies only their minted token.
 *
 * Pure and deterministic so it can be unit-tested exactly (prior art:
 * `route.ts`). The config keys it writes (`api_base_url`, `token_env`) are the
 * `remote-api` connector's contract, fixed by the spec — so this does not
 * depend on the connector doc or the setup wizard shipping first.
 */

/** The env var the `remote-api` connector reads the bearer token from. */
export const DEFAULT_TOKEN_ENV = "VALIDATION_OS_TOKEN";

export interface ConnectCommandInput {
  /** The personal bearer token the deployment minted for the signed-in user. */
  token: string;
  /** The hosted API root, baked in by the deployment. */
  apiBaseUrl: string;
  /** Override the token env-var name; defaults to {@link DEFAULT_TOKEN_ENV}. */
  tokenEnv?: string;
}

// A single quote, backslash, or any whitespace would break the single-quoted
// shell literal (or let a crafted value inject shell) — reject rather than
// silently emit a broken/unsafe command. Minted tokens and real URLs never
// contain these.
const SHELL_UNSAFE = /['"\\\s]/;

/**
 * Build the paste command: export the token into its env var, then write a
 * `remote-api` `validation-os.config.yaml` at the workspace root. Running it
 * leaves the workspace ready for `/setup-validation-os` to confirm, or for the
 * skills to use directly.
 */
export function composeConnectCommand(input: ConnectCommandInput): string {
  const tokenEnv = input.tokenEnv ?? DEFAULT_TOKEN_ENV;
  const guarded: [string, string][] = [
    ["Token", input.token],
    ["API base URL", input.apiBaseUrl],
  ];
  for (const [label, value] of guarded) {
    if (SHELL_UNSAFE.test(value)) {
      throw new Error(`${label} contains characters that can't be safely pasted.`);
    }
  }
  return [
    `export ${tokenEnv}='${input.token}'`,
    `cat > validation-os.config.yaml <<'EOF'`,
    `connector: remote-api`,
    `remote_api:`,
    `  api_base_url: ${input.apiBaseUrl}`,
    `  token_env: ${tokenEnv}`,
    `EOF`,
  ].join("\n");
}
