import type { ReactNode } from "react";
import styles from "./IconSwap.module.css";

/** Both icons stay mounted so they can cross-fade. */
export function IconSwap({ on, onIcon, offIcon }: { on: boolean; onIcon: ReactNode; offIcon: ReactNode }) {
  return (
    <span className={styles.swap} aria-hidden="true">
      <span className={styles.icon} data-shown={!on}>
        {offIcon}
      </span>
      <span className={styles.icon} data-shown={on}>
        {onIcon}
      </span>
    </span>
  );
}
