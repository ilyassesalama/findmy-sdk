import { Lightning } from "@phosphor-icons/react";
import type { Device } from "findmy-sdk";
import type { CSSProperties } from "react";
import styles from "./Battery.module.css";

export function Battery({ device }: { device: Device }) {
  const { batteryLevel, batteryStatus } = device;
  if (batteryLevel === null)
    return (
      <span className={styles.unknown}>
        <span aria-hidden="true">—</span>
        <span className="visually-hidden">Battery level unknown</span>
      </span>
    );

  const charging = batteryStatus === "Charging";
  const state = charging ? "charging" : batteryLevel <= 0.2 ? "low" : "normal";
  return (
    <span className={styles.battery} data-state={state}>
      {Math.round(batteryLevel * 100)}%{charging && <span className="visually-hidden"> and charging</span>}
      <span className={styles.cell} style={{ "--level": batteryLevel } as CSSProperties} aria-hidden="true">
        {charging && <Lightning className={styles.bolt} size={9} weight="fill" />}
      </span>
    </span>
  );
}
