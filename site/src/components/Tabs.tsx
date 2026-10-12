import { type KeyboardEvent, useRef } from "react";
import styles from "./Tabs.module.css";

interface TabsProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Tabs<T extends string>({ label, options, value, onChange }: TabsProps<T>) {
  const list = useRef<HTMLDivElement>(null);

  const onKeyDown = (event: KeyboardEvent) => {
    const index = options.findIndex((option) => option.value === value);
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = options[(index + step + options.length) % options.length]!;
    onChange(next.value);
    list.current?.querySelector<HTMLElement>(`[data-value="${next.value}"]`)?.focus();
  };

  return (
    <div ref={list} role="tablist" aria-label={label} className={styles.tabs} onKeyDown={onKeyDown}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          data-value={option.value}
          aria-selected={option.value === value}
          tabIndex={option.value === value ? 0 : -1}
          className={styles.tab}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
