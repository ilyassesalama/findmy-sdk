import { GpsFix, LockSimple, Phone as PhoneIcon } from "@phosphor-icons/react";
import styles from "./Phone.module.css";

export type PhoneAction = "ring" | "message" | "lost" | "erase";

const descriptions: Record<PhoneAction | "idle", string> = {
  idle: "An iPhone on its lock screen",
  ring: "The iPhone shakes and plays a sound, with a Find My alert on the lock screen",
  message: "The lock screen shows a Find My alert that says: Please call me!",
  lost: "The lock screen shows the lost message, the phone number and a Call button",
  erase: "The screen goes black, a progress bar fills, and the iPhone restarts to its hello screen",
};

const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

/** Remount it to replay the action. */
export function Phone({ action }: { action: PhoneAction | null }) {
  return (
    <div className={styles.wrap} data-action={action ?? "idle"}>
      {action === "ring" && (
        <div className={styles.waves} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}
      <div className={styles.phone} role="img" aria-label={descriptions[action ?? "idle"]}>
        <div className={styles.screen}>
          <span className={styles.island} />
          <div className={styles.status}>
            <span>9:41</span>
            <span className={styles.battery} />
          </div>
          {action === "lost" ? (
            <div className={styles.lost}>
              <span className={styles.smallClock}>9:41</span>
              <LockSimple size={26} weight="fill" />
              <p>This iPhone is lost. Please call me.</p>
              <span className={styles.number}>+1 (555) 123-4567</span>
              <span className={styles.call}>
                <PhoneIcon size={15} weight="fill" />
                Call
              </span>
            </div>
          ) : (
            <div className={styles.clock}>
              <span className={styles.date}>{today}</span>
              <span className={styles.time}>9:41</span>
            </div>
          )}
          {(action === "ring" || action === "message") && (
            <div className={styles.banner}>
              <span className={styles.app}>
                <GpsFix size={15} weight="bold" />
              </span>
              <span className={styles.text}>
                <strong>Find My iPhone Alert</strong>
                <span>{action === "ring" ? "Playing a sound" : "Please call me!"}</span>
              </span>
              <span className={styles.when}>now</span>
            </div>
          )}
          {action === "erase" && (
            <div className={styles.wipe}>
              <span className={styles.progress} />
              <span className={styles.hello}>hello</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
