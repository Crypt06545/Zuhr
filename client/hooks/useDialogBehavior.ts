"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

type Options = {
  ready: boolean; // client-এ mount হয়েছে কিনা
  open: boolean;
  onClose: () => void;
  rootRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  initialFocusRef: RefObject<HTMLElement | null>;
};

/**
 * পাশের drawer/dialog-এর সব সাধারণ আচরণ এক জায়গায়:
 * - বন্ধ থাকলে inert (keyboard ও screen reader থেকে লুকানো)
 * - খুললে ভেতরে ফোকাস, বন্ধ হলে আগের জায়গায় ফেরত
 * - খোলা অবস্থায় পেছনের স্ক্রল বন্ধ (scrollbar-এর জায়গা ধরে রেখে, যেন পেজ নড়ে না)
 * - Escape চাপলে বন্ধ, Tab ভেতরেই ঘোরে
 */
export const useDialogBehavior = ({
  ready,
  open,
  onClose,
  rootRef,
  panelRef,
  initialFocusRef,
}: Options) => {
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!ready || !root) return;

    if (open) {
      root.removeAttribute("inert");
      lastFocused.current = document.activeElement as HTMLElement | null;
      initialFocusRef.current?.focus();
    } else {
      root.setAttribute("inert", "");
      lastFocused.current?.focus?.();
      lastFocused.current = null;
    }
  }, [ready, open, rootRef, initialFocusRef]);

  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, panelRef]);
};
