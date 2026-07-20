/**
 * Real-adapter contract test against the Firestore emulator.
 *
 * Opt in with the emulator running:
 *   RUN_EMULATOR_TESTS=1 FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 pnpm test
 *   (start it with: firebase emulators:start --only firestore — needs Java)
 *
 * Skipped by default so CI/dev without a Java runtime stays green; the API
 * and dashboard exercise the same contract through an in-memory fake.
 */
import {
  isStaleVersionError,
  type DataProvider,
} from "@validation-os/core";
import admin from "firebase-admin";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createFirestoreProvider } from "./index.js";

const RUN =
  process.env.RUN_EMULATOR_TESTS === "1" && !!process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!RUN)("FirestoreProvider (emulator)", () => {
  let provider: DataProvider;
  let app: admin.app.App;

  beforeAll(() => {
    app = admin.initializeApp({ projectId: "vos-emulator-test" }, "contract");
    provider = createFirestoreProvider(app.firestore());
  });

  afterAll(async () => {
    await app.delete();
  });

  it("create → get → list round-trips a record", async () => {
    const created = await provider.create("assumptions", {
      id: "ASM-TEST-1",
      Title: "Test belief",
      Impact: 50,
    });
    expect(created.version).toBe(0);

    const got = await provider.get("assumptions", "ASM-TEST-1");
    expect(got.Title).toBe("Test belief");

    const all = await provider.list("assumptions");
    expect(all.some((r) => r.id === "ASM-TEST-1")).toBe(true);
  });

  it("rejects a stale version on update (409 path)", async () => {
    await provider.create("assumptions", { id: "ASM-TEST-2", Impact: 10 });
    const v1 = await provider.update("assumptions", "ASM-TEST-2", { Impact: 20 }, 0);
    expect(v1.version).toBe(1);
    expect(v1.Impact).toBe(20);

    // A second writer still holding version 0 must be rejected.
    await expect(
      provider.update("assumptions", "ASM-TEST-2", { Impact: 99 }, 0),
    ).rejects.toSatisfy(isStaleVersionError);
  });

  it("link sets both ends of a two-ended relation", async () => {
    await provider.create("assumptions", { id: "ASM-A", dependsOnIds: [] });
    await provider.create("assumptions", { id: "ASM-B", enablesIds: [] });
    await provider.link(
      "assumption-depends-on",
      { register: "assumptions", id: "ASM-A" },
      { register: "assumptions", id: "ASM-B" },
    );
    const a = await provider.get("assumptions", "ASM-A");
    const b = await provider.get("assumptions", "ASM-B");
    expect(a.dependsOnIds).toContain("ASM-B");
    expect(b.enablesIds).toContain("ASM-A");
  });

  it("unlink removes the relation from both ends", async () => {
    await provider.create("assumptions", { id: "ASM-U1", dependsOnIds: [] });
    await provider.create("assumptions", { id: "ASM-U2", enablesIds: [] });
    const from = { register: "assumptions" as const, id: "ASM-U1" };
    const to = { register: "assumptions" as const, id: "ASM-U2" };
    await provider.link("assumption-depends-on", from, to);
    await provider.unlink("assumption-depends-on", from, to);
    const a = await provider.get("assumptions", "ASM-U1");
    const b = await provider.get("assumptions", "ASM-U2");
    expect(a.dependsOnIds ?? []).not.toContain("ASM-U2");
    expect(b.enablesIds ?? []).not.toContain("ASM-U1");
  });
});
