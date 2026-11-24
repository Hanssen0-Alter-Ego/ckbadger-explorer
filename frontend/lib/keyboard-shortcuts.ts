// Native modal inertness protects pointer/focus, not handlers installed on
// document or window. Keep page-level shortcuts out of any active modal.
const ACTIVE_MODAL =
  'dialog[open][aria-modal="true"], [role="dialog"][aria-modal="true"]:not([hidden])';

export function isBackgroundShortcutBlocked(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing) return true;

  if (event.target instanceof Element && event.target.closest('dialog[open]')) {
    return true;
  }

  return document.querySelector(ACTIVE_MODAL) !== null;
}
