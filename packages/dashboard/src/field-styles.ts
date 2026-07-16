/**
 * Shared Tailwind class strings for form controls, so the create form and the
 * relation editor render identical inputs (and any restyle happens in one
 * place). The host app supplies the Tailwind utilities these name.
 */

export const FIELD_LABEL_CLASS =
  "block text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400";

export const FIELD_CONTROL_CLASS =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100";
