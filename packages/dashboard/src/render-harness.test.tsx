// @vitest-environment jsdom
/**
 * Smoke test that proves the jsdom + @testing-library/react harness works, so
 * later phases can lock click→route→render behaviour with real DOM tests. This
 * is the safety net the package lacked (the link regression shipped because no
 * test ever rendered a component). It also asserts StatusPill's toned markup.
 */
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { ListRow, Pill, StatusPill } from "./primitives-view.js";

test("jsdom harness renders a React component", () => {
  render(<StatusPill status="Live" />);
  const pill = screen.getByText("Live");
  expect(pill.className).toContain("vos-pill");
});

test("StatusPill renders an em dash for an empty status", () => {
  render(<StatusPill status={null} />);
  expect(screen.getByText("—")).toBeDefined();
});

test("Pill paints the tone it's given", () => {
  render(<Pill tone="crit">Invalidated</Pill>);
  expect(screen.getByText("Invalidated").className).toContain("vos-pill-crit");
});

test("ListRow renders leading/body/trailing in order and fires onClick", () => {
  const onClick = vi.fn();
  render(
    <ListRow
      onClick={onClick}
      leading={<span>lead</span>}
      trailing={<span>trail</span>}
    >
      <span>body</span>
    </ListRow>,
  );
  const row = screen.getByRole("button");
  expect(row.textContent).toBe("leadbodytrail");
  row.click();
  expect(onClick).toHaveBeenCalledOnce();
});

test("ListRow picks the row size's CSS class", () => {
  const { container, rerender } = render(<ListRow onClick={() => {}}>x</ListRow>);
  expect(container.querySelector("button")!.className).toBe("vos-list-row");
  rerender(
    <ListRow onClick={() => {}} size="lg">
      x
    </ListRow>,
  );
  expect(container.querySelector("button")!.className).toBe("vos-exp-row");
});
