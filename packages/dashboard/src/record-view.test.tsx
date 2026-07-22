// @vitest-environment jsdom
/**
 * Integration test for the single record body — mounts RecordView against a
 * mocked API (the real useList fetch path) and confirms it renders the right
 * body for an id and that links navigate by id alone. This is the component-
 * level lock on the reported bug: the earlier regression shipped because the
 * package had no test that actually rendered and clicked.
 */
import { render, screen, waitFor, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import type { AnyRecord } from "@validation-os/core";
import { RecordView } from "./record-view.js";

const DB: Record<string, AnyRecord[]> = {
  assumptions: [
    {
      id: "A-1",
      Title: "Users want one-command setup",
      Status: "Live",
      moot: false,
      dependsOnIds: [],
      enablesIds: [],
      derived: { derivedImpact: 60, risk: 60, confidence: 0, completeness: 100, assumptionType: "ProblemExists" },
    } as unknown as AnyRecord,
    {
      id: "A-2",
      Title: "New users reach activation within a week",
      Status: "Live",
      moot: false,
      dependsOnIds: [],
      enablesIds: [],
      derived: { derivedImpact: 40, risk: 40, confidence: 0, completeness: 100, assumptionType: "ProblemExists" },
    } as unknown as AnyRecord,
  ],
  experiments: [
    {
      id: "E-1",
      Title: "Fake-door the installer",
      Status: "Running",
      barLines: [{ assumptionId: "A-1", rightIf: "install rate > 30%", plannedRung: "Talk", barVerdict: null }],
    } as unknown as AnyRecord,
  ],
  readings: [],
  decisions: [],
  glossary: [
    {
      id: "G-1",
      Title: "activation",
      Status: "Active",
      Definition: "The point a new user first reaches the product's core value.",
    } as unknown as AnyRecord,
  ],
};

function mockApi() {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      const register = url.split("?")[0]!.split("/").pop()!;
      return { ok: true, json: async () => ({ data: DB[register] ?? [] }) } as Response;
    }),
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("resolves an assumption id to the belief body", async () => {
  mockApi();
  render(<RecordView recordId="A-1" onNavigate={() => {}} />);
  await waitFor(() => expect(screen.getByText("Users want one-command setup")).toBeDefined());
  // The belief body's signature sections render.
  expect(screen.getByText("Evidence rungs")).toBeDefined();
  expect(screen.getByText("Grilling gate")).toBeDefined();
});

test("resolves an experiment id to the experiment body, and its criterion link navigates by id", async () => {
  const onNavigate = vi.fn();
  mockApi();
  render(<RecordView recordId="E-1" onNavigate={onNavigate} />);
  await waitFor(() => expect(screen.getByText("Fake-door the installer")).toBeDefined());
  expect(screen.getByText("Acceptance criteria")).toBeDefined();

  // Clicking the criterion's assumption navigates by id alone — never a
  // register-typed route. This is the bug fix: the link can't route to the
  // wrong detail type because it carries no register.
  fireEvent.click(screen.getByRole("button", { name: "A-1" }));
  expect(onNavigate).toHaveBeenCalledWith({ name: "record", id: "A-1" });
});

test("auto-links a glossary term in the belief statement and navigates to its record", async () => {
  const onNavigate = vi.fn();
  mockApi();
  render(<RecordView recordId="A-2" onNavigate={onNavigate} />);
  // The statement's "activation" is linked to glossary term G-1 and is clickable
  // (the old detail page left onOpenTerm unwired, so the chip did nothing).
  const term = await screen.findByRole("button", { name: "activation" });
  fireEvent.click(term);
  expect(onNavigate).toHaveBeenCalledWith({ name: "record", id: "G-1" });
});
