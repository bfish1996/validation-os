// @vitest-environment jsdom
/**
 * Smoke test that proves the jsdom + @testing-library/react harness works, so
 * later phases can lock click→route→render behaviour with real DOM tests. This
 * is the safety net the package lacked (the link regression shipped because no
 * test ever rendered a component). It also asserts StatusPill's toned markup.
 */
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { StatusPill } from "./primitives-view.js";

test("jsdom harness renders a React component", () => {
  render(<StatusPill status="Live" />);
  const pill = screen.getByText("Live");
  expect(pill.className).toContain("vos-pill");
});

test("StatusPill renders an em dash for an empty status", () => {
  render(<StatusPill status={null} />);
  expect(screen.getByText("—")).toBeDefined();
});
