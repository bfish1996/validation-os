import { useState } from "react";
import { composeConnectCommand } from "./connect.js";

/**
 * The "Connect Claude Code" page (OPS-1349). A person already signed into the
 * dashboard mints a personal token and gets one ready-to-paste command that
 * points their own Claude Code at this hosted register.
 *
 * Auth-vendor-free by construction: token minting is INJECTED (`mintToken`), so
 * this package never imports Clerk — the deployment wires a mint function that
 * creates the signed-in user's personal API key and hands back the token
 * (mirrors how the API's `authenticate` is injected). The command itself is the
 * pure `composeConnectCommand`; this component is only the chrome around it.
 */
export interface ConnectClaudeCodeProps {
  /** The hosted API root, baked into the emitted command. */
  apiBaseUrl: string;
  /** Override the token env-var name written into the config. */
  tokenEnv?: string;
  /**
   * Mint a personal bearer token for the signed-in user. Injected by the
   * deployment (e.g. create a Clerk API key whose subject is the user's ID).
   */
  mintToken: () => Promise<string>;
}

type State =
  | { phase: "idle" }
  | { phase: "minting" }
  | { phase: "ready"; command: string }
  | { phase: "error"; message: string };

export function ConnectClaudeCode({
  apiBaseUrl,
  tokenEnv,
  mintToken,
}: ConnectClaudeCodeProps) {
  const [state, setState] = useState<State>({ phase: "idle" });
  const [copied, setCopied] = useState(false);

  async function generate() {
    setState({ phase: "minting" });
    setCopied(false);
    try {
      const token = await mintToken();
      const command = composeConnectCommand({ token, apiBaseUrl, tokenEnv });
      setState({ phase: "ready", command });
    } catch (e) {
      setState({
        phase: "error",
        message:
          e instanceof Error
            ? e.message
            : "Couldn't generate your connection command.",
      });
    }
  }

  async function copy(command: string) {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
    } catch {
      // Clipboard blocked — the person can still select the text manually.
    }
  }

  return (
    <div>
      <div className="vos-head">
        <div>
          <h1>Connect Claude Code</h1>
          <p>
            Run the validation skills against this register from your own Claude
            Code — no repo, no keys to hunt down.
          </p>
        </div>
      </div>

      <ol className="vos-hint" style={{ lineHeight: 1.8 }}>
        <li>Generate your personal connection command below.</li>
        <li>Paste it into a terminal in the workspace you'll run the skills in.</li>
        <li>
          The command carries a token tied to <strong>you</strong> — anything you
          write lands under your name. Don't share it.
        </li>
      </ol>

      {state.phase !== "ready" ? (
        <button
          type="button"
          className="vos-btn"
          onClick={generate}
          disabled={state.phase === "minting"}
        >
          {state.phase === "minting"
            ? "Generating…"
            : "Generate connection command"}
        </button>
      ) : null}

      {state.phase === "error" ? (
        <p className="vos-hint" role="alert">
          {state.message}
        </p>
      ) : null}

      {state.phase === "ready" ? (
        <div>
          <pre className="vos-code" aria-label="Connection command">
            {state.command}
          </pre>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="vos-btn"
              onClick={() => copy(state.command)}
            >
              {copied ? "Copied" : "Copy command"}
            </button>
            <button type="button" className="vos-btn-ghost" onClick={generate}>
              Regenerate
            </button>
          </div>
          <p className="vos-hint" style={{ marginTop: 12 }}>
            Generating again revokes nothing on its own — remove old keys from
            your account settings when you rotate.
          </p>
        </div>
      ) : null}
    </div>
  );
}
