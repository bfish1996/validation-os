import { useEffect, useRef, type ReactNode } from "react";

export interface DrawerShellProps {
  /** Whether the drawer is mounted/visible. */
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  ariaLabel: string;
  children: ReactNode;
}

/**
 * The right-hand slide-over chrome shared by the record drawer and the create
 * drawer: a click-to-dismiss scrim, an `aria-modal` panel, Escape-to-close, and
 * focus moved into the panel on open so keyboard users aren't stranded behind
 * the modal. Everything inside is the caller's content. Styled with the
 * package's own token sheet — no host Tailwind.
 */
export function DrawerShell({
  open,
  onClose,
  ariaLabel,
  children,
}: DrawerShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Scrim — click to dismiss. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="vos-scrim"
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className="vos-drawer"
      >
        {children}
      </aside>
    </>
  );
}
