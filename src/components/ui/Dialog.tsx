"use client";

import { useEffect, useRef } from "react";

/** Native modal <dialog>: focus trapping, Esc and inert background come from the browser. */
export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-110 rounded-card border-2 border-ink bg-paper p-0 text-ink backdrop:bg-ink/50"
    >
      {open && <div className="p-6">{children}</div>}
    </dialog>
  );
}
