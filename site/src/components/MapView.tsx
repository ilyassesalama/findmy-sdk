import { type CSSProperties, memo, type ReactNode, useId } from "react";
import { embarcaderoX, HEIGHT, MARKET, NORTH_GRID, type Point, SOUTH_GRID, shoreX, UNITS_PER_METER, WIDTH } from "../lib/map";
import styles from "./MapView.module.css";

export interface MapPin extends Point {
  id: string;
  label: string;
  icon: ReactNode;
  /** Horizontal accuracy in meters. */
  accuracy: number;
  old?: boolean;
}

interface MapViewProps {
  pins: MapPin[];
  selected?: string;
  onSelect?: (id: string) => void;
  trail?: Point[];
}

const percent = (value: number, of: number) => `${(value / of) * 100}%`;

export function MapView({ pins, selected, onSelect, trail }: MapViewProps) {
  return (
    <div className={styles.map}>
      <Streets />
      {trail && trail.length > 1 && (
        <svg className={styles.layer} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
          <polyline className={styles.trail} points={trail.map(({ x, y }) => `${x},${y}`).join(" ")} />
          {trail.slice(0, -1).map(({ x, y }, index) => (
            <circle key={index} className={styles.fix} cx={x} cy={y} r={3.2} />
          ))}
        </svg>
      )}
      {pins.map((pin) => {
        const position: CSSProperties = { left: percent(pin.x, WIDTH), top: percent(pin.y, HEIGHT) };
        const isSelected = pin.id === selected;
        const content = <span className={styles.badge}>{pin.icon}</span>;
        return (
          <div key={pin.id} className={styles.spot} style={position} data-selected={isSelected} data-old={pin.old ?? false}>
            <span className={styles.halo} style={{ "--halo": (pin.accuracy * 2 * UNITS_PER_METER * 100) / WIDTH } as CSSProperties} />
            {onSelect ? (
              <button type="button" className={styles.pin} aria-label={pin.label} aria-pressed={isSelected} onClick={() => onSelect(pin.id)}>
                {content}
              </button>
            ) : (
              <span className={styles.pin} role="img" aria-label={pin.label}>
                {content}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

const PIERS = [30, 85, 140, 205, 265, 320];
// Into the Bay, square to the shore.
const OUT = { x: 0.7597, y: -0.6506 };
const MARKET_ANGLE = (Math.atan2(MARKET.to.y - MARKET.from.y, MARKET.to.x - MARKET.from.x) * 180) / Math.PI - 180;

const north = `M-10 -10 L${embarcaderoX(-10)} -10 L${MARKET.from.x} ${MARKET.from.y} L${MARKET.to.x} ${MARKET.to.y} L-10 410 Z`;
const south = `M${MARKET.from.x} ${MARKET.from.y} L${embarcaderoX(410)} 410 L${MARKET.to.x} ${MARKET.to.y} Z`;
const bay = `M${shoreX(-10)} -10 L${shoreX(410)} 410 L700 410 L700 -10 Z`;

const range = (count: number) => Array.from({ length: count }, (_, index) => index);

const Streets = memo(function Streets() {
  // The page shows more than one map, so the ids inside each must differ.
  const id = useId();
  const { x: fx, y: fy } = MARKET.from;
  return (
    <svg className={styles.streets} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} aria-hidden="true">
      <defs>
        <clipPath id={`${id}north`}>
          <path d={north} />
        </clipPath>
        <clipPath id={`${id}south`}>
          <path d={south} />
        </clipPath>
        <path id={`${id}market`} d={`M${MARKET.to.x} ${MARKET.to.y} L${fx} ${fy}`} />
        <path id={`${id}embarcadero`} d={`M${embarcaderoX(-10)} -10 L${embarcaderoX(410)} 410`} />
      </defs>

      <g className={styles.road} clipPath={`url(#${id}north)`}>
        {range(13).map((index) => {
          const x = NORTH_GRID.x + index * NORTH_GRID.dx;
          return <line key={`v${index}`} x1={x} y1={-10} x2={x} y2={410} />;
        })}
        {range(10).map((index) => {
          const y = NORTH_GRID.y + index * NORTH_GRID.dy;
          return <line key={`h${index}`} x1={-10} y1={y} x2={610} y2={y} />;
        })}
      </g>
      <g className={styles.road} clipPath={`url(#${id}south)`}>
        <g transform={`rotate(${MARKET_ANGLE} ${fx} ${fy})`}>
          {range(9).map((index) => {
            const y = fy + (index + 1) * SOUTH_GRID.along;
            return <line key={`a${index}`} x1={fx - 700} y1={y} x2={fx + 700} y2={y} />;
          })}
          {range(30).map((index) => {
            const x = fx + (index - 20) * SOUTH_GRID.across;
            return <line key={`c${index}`} x1={x} y1={fy} x2={x} y2={fy + 700} />;
          })}
        </g>
      </g>

      <rect className={styles.park} x={300} y={118} width={62} height={38} rx={8} />
      <rect className={styles.park} x={82} y={38} width={62} height={44} rx={8} />

      <path className={styles.water} d={bay} />
      <g className={styles.pier}>
        {PIERS.map((y) => {
          const x = shoreX(y);
          return <line key={y} x1={x - 4 * OUT.x} y1={y - 4 * OUT.y} x2={x + 30 * OUT.x} y2={y + 30 * OUT.y} />;
        })}
      </g>

      <g className={styles.major}>
        <use href={`#${id}embarcadero`} />
        <use href={`#${id}market`} />
      </g>
      <text className={styles.label}>
        <textPath href={`#${id}market`} startOffset="22%">
          Market St
        </textPath>
      </text>
      <text className={styles.label}>
        <textPath href={`#${id}embarcadero`} startOffset="12%">
          The Embarcadero
        </textPath>
      </text>
      <text className={styles.bay} x={540} y={92} textAnchor="middle">
        San Francisco Bay
      </text>
    </svg>
  );
});
