/** A point in map units. The map is drawn in a 600 by 400 box. */
export interface Point {
  x: number;
  y: number;
}

export const WIDTH = 600;
export const HEIGHT = 400;

// About 1.4 by 0.94 km around the foot of Market Street in San Francisco, so the box is 3:2.
const WEST = -122.404;
const EAST = -122.388;
const NORTH = 37.799;
const SOUTH = 37.7905;

export function project(latitude: number, longitude: number): Point {
  return {
    x: ((longitude - WEST) / (EAST - WEST)) * WIDTH,
    y: ((NORTH - latitude) / (NORTH - SOUTH)) * HEIGHT,
  };
}

export function unproject({ x, y }: Point): { latitude: number; longitude: number } {
  return {
    latitude: NORTH - (y / HEIGHT) * (NORTH - SOUTH),
    longitude: WEST + (x / WIDTH) * (EAST - WEST),
  };
}

export const UNITS_PER_METER = WIDTH / ((EAST - WEST) * 111_320 * Math.cos((((NORTH + SOUTH) / 2) * Math.PI) / 180));

/** Where the shoreline crosses height y. The Bay is to its right. */
export const shoreX = (y: number) => 270 + (y + 10) * 0.8564;

export const embarcaderoX = (y: number) => shoreX(y) - 13;

/** Market Street, from The Embarcadero to the bottom edge. */
export const MARKET = { from: { x: embarcaderoX(176), y: 176 }, to: { x: 170, y: 410 } };

/** The point a fraction t of the way down Market Street. */
export function onMarket(t: number): Point {
  return { x: MARKET.from.x + t * (MARKET.to.x - MARKET.from.x), y: MARKET.from.y + t * (MARKET.to.y - MARKET.from.y) };
}

/** North of Market the grid runs square to the map: streets every dx across and dy down, from x and y. */
export const NORTH_GRID = { x: 20, dx: 46, y: 30, dy: 40 };

/** South of Market the grid runs along it: streets parallel to it are `along` apart, streets crossing it `across` apart. */
export const SOUTH_GRID = { along: 52, across: 36 };
