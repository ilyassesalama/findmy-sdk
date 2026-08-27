/** The Apple Account holder. */
export interface Owner {
  /** Full name, e.g. "Alex Rivera". */
  name: string;
  firstName: string;
  lastName: string;
  /** The Apple ID (usually an email). */
  appleId: string;
  /** Primary email on the account. */
  email: string;
  /** Two-letter country code, e.g. "US". */
  countryCode: string;
}

/** Geographic location of a device, as reported by the Find My network. */
export interface DeviceLocation {
  latitude: number;
  longitude: number;
  /** Altitude in meters (often 0 when unavailable). */
  altitude: number;
  /** Horizontal accuracy in meters. */
  horizontalAccuracy: number;
  /** Vertical accuracy in meters (often 0 when unavailable). */
  verticalAccuracy: number;
  /** When this location was recorded. */
  timestamp: Date;
  /** True if this is a stale last-known fix rather than a fresh one. */
  isOld: boolean;
  /** True while the position is still being refined by Apple. */
  isInaccurate: boolean;
  /** How the position was obtained, e.g. "Wifi" or "GPS". */
  positionType: string;
  /** Reverse-geocoded street address, when Apple provides one. */
  address: string | null;
}

/** Battery status of a device. */
export type BatteryStatus = "Charging" | "NotCharging" | "Full" | "Unknown";

/** Which Find My actions a device supports. */
export interface DeviceCapabilities {
  canPlaySound: boolean;
  canMessage: boolean;
  canMarkLost: boolean;
  canLock: boolean;
  canErase: boolean;
}

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
  /** Device category, e.g. "iPhone", "iPad", "Mac", "Watch", "AirPods". */
  deviceClass: string;
  /** Name of the person who owns the device (the account holder or a family member). */
  ownerName: string;
  /** Battery level from 0 to 1, or null if unknown. */
  batteryLevel: number | null;
  batteryStatus: BatteryStatus;
  /** True if the device is in Low Power Mode. */
  lowPowerMode: boolean;
  /** True if Activation Lock is enabled on the device. */
  activationLocked: boolean;
  /** Last known location, or null if the device has never reported one. */
  location: DeviceLocation | null;
  /** True if the device currently shares its location. */
  locationEnabled: boolean;
  /** True if the device can currently receive commands. */
  isLocating: boolean;
  /** True if Lost Mode is active. */
  lostModeEnabled: boolean;
  /** Which actions this device supports. */
  capabilities: DeviceCapabilities;
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
