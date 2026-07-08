"use client";

import { useEffect, useRef } from "react";

const PRESS_WINDOW_MS = 600; // max gap allowed between consecutive presses
const REQUIRED_PRESSES = 3;

/**
 * Listens for the visitor pressing the spacebar 3 times in quick succession
 * anywhere on the page (but not while typing in a form field) and fires
 * `onTrigger`. This is the hidden gesture that opens the admin login modal.
 */
export function useTripleSpacePress(onTrigger: () => void) {
  const pressTimestamps = useRef<number[]>([]);

  useEffect(() => {
    function isTypingContext(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.code !== "Space") return;
      if (isTypingContext(event.target)) return;

      // Prevent the page from scrolling every time space is pressed on the body
      if (event.target === document.body) {
        event.preventDefault();
      }

      const now = Date.now();
      const recent = pressTimestamps.current.filter(
        (t) => now - t <= PRESS_WINDOW_MS
      );
      recent.push(now);
      pressTimestamps.current = recent;

      if (recent.length >= REQUIRED_PRESSES) {
        pressTimestamps.current = [];
        onTrigger();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTrigger]);
}
