import { describe, expect, it } from "vitest";
import { composeConnectCommand, DEFAULT_TOKEN_ENV } from "./connect.js";

describe("composeConnectCommand", () => {
  it("bakes the token and API URL into one ready-to-paste command", () => {
    const cmd = composeConnectCommand({
      token: "sk_live_abc123",
      apiBaseUrl: "https://doshi.example/api",
    });
    expect(cmd).toBe(
      [
        `export ${DEFAULT_TOKEN_ENV}='sk_live_abc123'`,
        `cat > validation-os.config.yaml <<'EOF'`,
        `connector: remote-api`,
        `remote_api:`,
        `  api_base_url: https://doshi.example/api`,
        `  token_env: ${DEFAULT_TOKEN_ENV}`,
        `EOF`,
      ].join("\n"),
    );
  });

  it("honours a custom token env-var name", () => {
    const cmd = composeConnectCommand({
      token: "tok",
      apiBaseUrl: "https://x/api",
      tokenEnv: "DOSHI_TOKEN",
    });
    expect(cmd).toContain("export DOSHI_TOKEN='tok'");
    expect(cmd).toContain("token_env: DOSHI_TOKEN");
  });

  it("refuses a token that would break the shell quoting", () => {
    expect(() =>
      composeConnectCommand({
        token: "tok'; rm -rf /",
        apiBaseUrl: "https://x/api",
      }),
    ).toThrow();
  });
});
