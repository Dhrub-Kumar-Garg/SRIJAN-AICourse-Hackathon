import { useEffect } from "react";
/** Keep keyboard focus in the active dialog and restore it to its trigger. */
export function useModal(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const selector =
      "button:not(:disabled), input:not(:disabled), select, textarea, a[href]";
    const focusable = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(selector));
    focusable()[0]?.focus();
    const handle = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key !== "Tab") return;
      const elements = focusable(),
        first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, [open]);
}
