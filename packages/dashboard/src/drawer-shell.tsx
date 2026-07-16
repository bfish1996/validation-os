import { useEffect, useRef, type ReactNode } from "react";

export interface DrawerShellProps {
  /** Whether the drawer is mounted/visible. */
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  ariaLabel: string;
  /**
   * When true the whole panel scrolls (the read drawer); when false the panel
   * clips and an inner element scrolls, so a sticky footer stays put (the
   * create form). Defaults to true.
   */
  scroll?: boolean;
  children: ReactNode;
}

/**
 * The right-hand slide-over chrome shared by the record drawer and the create
 * drawer: a click-to-dismiss overlay, an `aria-modal` panel, Escape-to-close,
 * and focus moved into the panel on open so keyboard users aren't stranded
 * behind the modal. Everything inside is the caller's content.
 */
export function DrawerShell({
  open,
  onClose,
  ariaLabel,
  scroll = true,
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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay — click to dismiss. */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/30 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`relative flex h-full w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl outline-none dark:border-neutral-800 dark:bg-neutral-950 ${
          scroll ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
