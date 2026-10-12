/** "Now", "4 min ago" or "2 hr ago". A no-break space keeps the number with its unit. */
export function ago(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.floor(minutes / 60)} hr ago`;
}

/** The first line of an address: "1 Ferry Building". */
export function street(address?: string | null): string | null {
  return address?.split(",")[0] ?? null;
}

/** A value written out as a TypeScript literal, for the Data tab. */
export function literal(value: unknown, indent = ""): string {
  if (value instanceof Date) return `new Date("${value.toISOString()}")`;
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  const inner = `${indent}  `;
  const entries = Object.entries(value).map(([key, entry]) => `${inner}${key}: ${literal(entry, inner)},`);
  return `{\n${entries.join("\n")}\n${indent}}`;
}
