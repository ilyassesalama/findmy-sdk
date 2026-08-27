/** Geographic location of a device, as reported by the Find My network. */
export interface DeviceLocation {
  latitude: number;
  longitude: number;
  /** Horizontal accuracy in meters. */
  horizontalAccuracy: number;
  /** When this location was recorded. */
  timestamp: Date;
  /** True while the position is still being refined by Apple. */
  isInaccurate: boolean;
  /** How the position was obtained, e.g. "Wifi" or "GPS". */
  positionType: string;
}

/** Battery status of a device. */
export type BatteryStatus = "Charging" | "NotCharging" | "Full" | "Unknown";

/** A single device visible in the account's Find My network. */
export interface Device {
  /** Opaque device identifier used for all actions. */
  id: string;
  /** User-facing name, e.g. "Alex's iPhone". */
  name: string;
  /** Marketing model name, e.g. "iPhone 15 Pro". */
  deviceModel: string;
  /** Raw model code, e.g. "iPhone16,1". */
  rawDeviceModel: string;
  /** Battery level from 0 to 1, or null if unknown. */
  batteryLevel: number | null;
  batteryStatus: BatteryStatus;
  /** Last known location, or null if the device has never reported one. */
  location: DeviceLocation | null;
  /** True if the device can currently receive commands. */
  isLocating: boolean;
  /** True if Lost Mode is active. */
  lostModeEnabled: boolean;
}

/** Options for putting a device into Lost Mode. */
export interface LostModeOptions {
  /** Phone number shown on the device's lock screen. */
  phoneNumber?: string;
  /** Message shown on the device's lock screen. */
  message?: string;
  /** Owner passcode to lock the device with (only used if it has none). */
  passcode?: string;
}
