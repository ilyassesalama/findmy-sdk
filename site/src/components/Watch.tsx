import { Pause, Play } from "@phosphor-icons/react";
import { useEffect, useMemo, useState } from "react";
import { MARKET, NORTH_GRID, onMarket, type Point, UNITS_PER_METER, unproject } from "../lib/map";
import { useInView } from "../lib/useInView";
import { CodeBlock } from "./CodeBlock";
import { DeviceIcon } from "./DeviceIcon";
import { IconSwap } from "./IconSwap";
import { MapView } from "./MapView";
import { Section } from "./Section";
import { Tabs } from "./Tabs";
import styles from "./Watch.module.css";

const intervals = [
  { value: "15000", label: "15s" },
  { value: "30000", label: "30s" },
  { value: "60000", label: "60s" },
] as const;

type Interval = (typeof intervals)[number]["value"];

// A walk from the foot of Market Street up into the grid north of it, along streets the map draws.
const column = (index: number) => NORTH_GRID.x + index * NORTH_GRID.dx;
const row = (index: number) => NORTH_GRID.y + index * NORTH_GRID.dy;
const turn = (MARKET.from.x - column(6)) / (MARKET.from.x - MARKET.to.x);
const ROUTE: Point[] = [onMarket(0.05), onMarket(turn), { x: column(6), y: row(3) }, { x: column(4), y: row(3) }, { x: column(4), y: row(1) }];

const segments = ROUTE.slice(1).map((to, index) => {
  const from = ROUTE[index]!;
  return { from, to, length: Math.hypot(to.x - from.x, to.y - from.y) };
});
const routeLength = segments.reduce((sum, { length }) => sum + length, 0);

/** The point `distance` map units along the route. */
function along(distance: number): Point {
  for (const { from, to, length } of segments) {
    if (distance <= length) {
      const t = distance / length;
      return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
    }
    distance -= length;
  }
  return ROUTE[ROUTE.length - 1]!;
}

const WALKING_SPEED = 1.4; // meters per second
const SPEED_UP = 10;
const SHOWN_LINES = 4;

const start = new Date();
start.setHours(9, 41, 0, 0);

export function Watch() {
  const [period, setPeriod] = useState<Interval>("15000");
  // The walk plays by itself only for readers who haven't asked for less motion.
  const [playing, setPlaying] = useState(() => !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [fix, setFix] = useState(0);
  const [ref, inView] = useInView<HTMLDivElement>();
  const ms = Number(period);

  const fixes = useMemo(() => {
    const step = WALKING_SPEED * (ms / 1000) * UNITS_PER_METER;
    return Array.from({ length: Math.floor(routeLength / step) + 1 }, (_, index) => along(index * step));
  }, [ms]);

  useEffect(() => {
    if (!playing || !inView) return;
    const timer = window.setInterval(() => setFix((current) => (current + 1) % fixes.length), ms / SPEED_UP);
    return () => window.clearInterval(timer);
  }, [playing, inView, ms, fixes.length]);

  const changePeriod = (next: Interval) => {
    setPeriod(next);
    setFix(0);
  };

  const trail = fixes.slice(0, fix + 1);
  const first = Math.max(0, trail.length - SHOWN_LINES);
  const lines = trail.slice(first).map((point, offset) => {
    const { latitude, longitude } = unproject(point);
    const time = new Date(start.getTime() + (first + offset) * ms).toLocaleTimeString("en-US");
    return { index: first + offset, text: `${time} ${latitude.toFixed(5)} ${longitude.toFixed(5)}` };
  });

  return (
    <Section
      title="Follow it with watch()"
      lede="watch() signs in once, then yields a fresh snapshot of every device on an interval. Break out of the loop to stop."
    >
      <div ref={ref} className={`card ${styles.card}`}>
        <div className={styles.side}>
          <div className={styles.bar}>
            <div className={styles.interval}>
              Every
              <Tabs label="Snapshot interval" options={intervals} value={period} onChange={changePeriod} />
            </div>
            <button type="button" className={styles.toggle} onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}>
              <IconSwap on={playing} onIcon={<Pause size={18} weight="fill" />} offIcon={<Play className={styles.play} size={18} weight="fill" />} />
            </button>
          </div>
          <CodeBlock
            code={`for await (const [iphone] of fm.watch(${ms / 1000}_000)) {
  const { timestamp, latitude, longitude } = iphone.location!;
  const time = timestamp.toLocaleTimeString();
  console.log(time, latitude, longitude);
}`}
          />
          <div className={styles.output}>
            {lines.map((line) => (
              <span key={line.index}>{line.text}</span>
            ))}
          </div>
          <p className={styles.note}>
            Each snapshot asks your devices for a new fix, which costs them battery, so poll no faster than you need. Sped up ten times here.
          </p>
        </div>
        <MapView
          pins={[{ id: "iphone", label: "Alex’s iPhone", icon: <DeviceIcon deviceClass="iPhone" />, accuracy: 8, ...fixes[fix]! }]}
          selected="iphone"
          trail={trail}
        />
      </div>
    </Section>
  );
}
