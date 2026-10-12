import type { Device } from "findmy-sdk";
import { useState } from "react";
import { ago, literal, street } from "../lib/format";
import { project } from "../lib/map";
import { devices, owner } from "../lib/sample";
import { Battery } from "./Battery";
import { CodeBlock } from "./CodeBlock";
import { DeviceIcon } from "./DeviceIcon";
import styles from "./Explorer.module.css";
import { type MapPin, MapView } from "./MapView";
import { Tabs } from "./Tabs";

const views = [
  { value: "map", label: "Map" },
  { value: "data", label: "Data" },
] as const;

const pins: MapPin[] = devices.flatMap(({ id, name, deviceClass, location }) =>
  location
    ? [
        {
          id,
          label: name,
          icon: <DeviceIcon deviceClass={deviceClass} />,
          accuracy: location.horizontalAccuracy,
          old: location.isOld,
          ...project(location.latitude, location.longitude),
        },
      ]
    : [],
);

function subline({ ownerName, location }: Device): string {
  const parts = [ownerName === owner.name ? null : ownerName, street(location?.address), location ? ago(location.timestamp) : "No location"];
  return parts.filter(Boolean).join(" · ");
}

export function Explorer() {
  const [view, setView] = useState<(typeof views)[number]["value"]>("map");
  const [selected, setSelected] = useState(devices[0]!.id);
  const index = devices.findIndex((device) => device.id === selected);

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.head}>
        <span>Select a device</span>
        <Tabs label="View" options={views} value={view} onChange={setView} />
      </div>
      {view === "map" ? (
        <MapView pins={pins} selected={selected} onSelect={setSelected} />
      ) : (
        <CodeBlock className={styles.data} code={`// (await fm.devices())[${index}]\n${literal(devices[index])}`} />
      )}
      <ul className={styles.list}>
        {devices.map((device) => (
          <li key={device.id}>
            <button type="button" className={styles.row} aria-pressed={device.id === selected} onClick={() => setSelected(device.id)}>
              <span className={styles.icon}>
                <DeviceIcon deviceClass={device.deviceClass} />
              </span>
              <span className={styles.meta}>
                <span className={styles.name}>{device.name}</span>
                <span className={styles.sub}>{subline(device)}</span>
              </span>
              <Battery device={device} />
            </button>
          </li>
        ))}
      </ul>
      <p className={styles.note}>An imaginary account. findmy-sdk runs in Node, so this page never signs in to anything.</p>
    </div>
  );
}
