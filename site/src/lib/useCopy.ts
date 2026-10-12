import { useEffect, useRef, useState } from "react";

/** Copies text to the clipboard. `copied` stays true for a moment afterwards. */
export function useCopy(text: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access can be denied; the text is still on screen to copy by hand.
    }
  };

  return [copied, copy] as const;
}
