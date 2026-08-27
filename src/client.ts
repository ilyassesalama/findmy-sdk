import { authenticate, AuthResult } from "./auth.js";
import { Session } from "./session.js";
import {
  BatteryStatus,
  Device,
  DeviceCapabilities,
  DeviceLocation,
  LostModeOptions,
  Owner,
} from "./types.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:103.0) Gecko/20100101 Firefox/103.0";

const SERVICE_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "application/json",
  "Content-Type": "application/json",
  Origin: "https://www.icloud.com",
  Referer: "https://www.icloud.com/",
};

/**
 * Client for Apple's Find My network. Sign in with {@link FindMy.login}, then
 * list devices and issue actions.
 *
 * ```ts
 * const fm = await FindMy.login("me@icloud.com", "password");
 * const devices = await fm.devices();
 * await fm.ring(devices[0].id);
 * ```
 */
export class FindMy {
  private readonly session: Session;
  private serverContext: unknown = null;

  private constructor(private readonly auth: AuthResult) {
    this.session = auth.session;
  }

  /** Signs in and returns a ready-to-use client (no two-factor code needed). */
  static async login(email: string, password: string): Promise<FindMy> {
    return new FindMy(await authenticate(email, password));
  }

  /** The Apple Account holder (name, Apple ID, email, country). */
  get owner(): Owner {
    return this.auth.owner;
  }

  /** Lists all devices in the account with their latest known locations. */
  async devices(): Promise<Device[]> {
    // First call bootstraps the Find My session (initClient); later calls refresh.
    const clientContext: Record<string, unknown> = {
      appName: "iCloud Find (Web)",
      appVersion: "2.0",
      apiVersion: "3.0",
      deviceListVersion: 1,
      fmly: true,
      timezone: "US/Pacific",
      inactiveTime: 0,
    };
    const body: Record<string, unknown> = { clientContext };
    if (this.serverContext) {
      body.serverContext = this.serverContext;
      body.isUpdatingAllLocations = true;
      clientContext.shouldLocate = true;
      clientContext.selectedDevice = "all";
    }

    const data = await this.fmip(this.serverContext ? "refreshClient" : "initClient", body);
    this.serverContext = data.serverContext ?? this.serverContext;
    const members = (data.userInfo?.membersInfo ?? {}) as Record<string, any>;
    return (data.content ?? []).map((raw: any) => toDevice(raw, members, this.auth.owner.name));
  }

  /**
   * Continuously yields fresh device snapshots on an interval (default 15s).
   * The first snapshot is yielded immediately. Stop by `break`ing out of the
   * loop.
   *
   * ```ts
   * for await (const devices of fm.watch()) {
   *   console.log(devices[0].location);
   * }
   * ```
   */
  async *watch(intervalMs = 15_000): AsyncGenerator<Device[]> {
    while (true) {
      yield await this.devices();
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  /** Plays a sound on the device to help locate it. */
  async ring(deviceId: string): Promise<void> {
    await this.fmip("playSound", {
      device: deviceId,
      subject: "Find My iPhone Alert",
      clientContext: { fmly: true },
    });
  }

  /** Displays a message on the device, optionally with a sound. */
  async message(deviceId: string, text: string, sound = false): Promise<void> {
    await this.fmip("sendMessage", {
      device: deviceId,
      subject: "Find My iPhone Alert",
      text,
      sound,
      userText: true,
    });
  }

  /** Puts the device into Lost Mode. */
  async markAsLost(deviceId: string, options: LostModeOptions = {}): Promise<void> {
    await this.fmip("lostDevice", {
      device: deviceId,
      lostModeEnabled: true,
      trackingEnabled: true,
      userText: options.message !== undefined,
      text: options.message ?? "This device has been lost. Please call me.",
      ownerNbr: options.phoneNumber ?? "",
      passcode: options.passcode ?? "",
    });
  }

  /**
   * Erases the device. Irreversible — the device is wiped and removed from the
   * account. Requires a fresh erase token authorized by the account.
   */
  async erase(deviceId: string, message = "This device has been lost. Please call me."): Promise<void> {
    const tokenRes = await this.session.fetch(`${this.auth.setupUrl}/fmipWebAuthenticate`, {
      method: "POST",
      headers: SERVICE_HEADERS,
      body: JSON.stringify({ dsWebAuthToken: this.auth.dsWebAuthToken }),
    });
    if (!tokenRes.ok) throw new Error(`Failed to get erase token (${tokenRes.status})`);
    const authToken = (await tokenRes.json())?.tokens?.mmeFMIPWebEraseDeviceToken;
    if (!authToken) throw new Error("Erase token not available");

    await this.fmip("remoteWipeWithUserAuth", {
      authToken,
      device: deviceId,
      text: message,
      passcode: "",
    });
  }

  private async fmip(path: string, body: unknown): Promise<any> {
    const url = `${this.auth.findMeUrl}/fmipservice/client/web/${path}?${this.auth.params}`;
    const res = await this.session.fetch(url, {
      method: "POST",
      headers: SERVICE_HEADERS,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Find My request "${path}" failed (${res.status})`);
    return res.status === 204 ? {} : res.json();
  }
}

function toDevice(raw: any, members: Record<string, any>, accountOwnerName: string): Device {
  const member = raw.prsId != null ? members[String(raw.prsId)] : undefined;
  const memberName = member ? `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() : "";

  return {
    id: raw.id,
    name: raw.name,
    deviceModel: raw.deviceDisplayName ?? raw.deviceModel ?? "Unknown",
    rawDeviceModel: raw.rawDeviceModel ?? "",
    deviceClass: raw.deviceClass ?? "Unknown",
    ownerName: memberName || accountOwnerName,
    batteryLevel: typeof raw.batteryLevel === "number" ? raw.batteryLevel : null,
    batteryStatus: (raw.batteryStatus as BatteryStatus) ?? "Unknown",
    lowPowerMode: Boolean(raw.lowPowerMode),
    activationLocked: Boolean(raw.activationLocked),
    location: toLocation(raw.location),
    locationEnabled: Boolean(raw.locationEnabled),
    isLocating: Boolean(raw.isLocating),
    lostModeEnabled: Boolean(raw.lostModeEnabled),
    capabilities: toCapabilities(raw.features),
  };
}

function toLocation(raw: any): DeviceLocation | null {
  if (!raw || typeof raw.latitude !== "number") return null;
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    altitude: raw.altitude ?? 0,
    horizontalAccuracy: raw.horizontalAccuracy,
    verticalAccuracy: raw.verticalAccuracy ?? 0,
    timestamp: new Date(raw.timeStamp),
    isOld: Boolean(raw.isOld),
    isInaccurate: Boolean(raw.isInaccurate),
    positionType: raw.positionType ?? "Unknown",
    address: toAddress(raw.addresses),
  };
}

function toAddress(addresses: any): string | null {
  if (!Array.isArray(addresses) || addresses.length === 0) return null;
  const a = addresses[0];
  if (a?.mapItemFullAddress) return a.mapItemFullAddress;
  if (Array.isArray(a?.formattedAddressLines)) return a.formattedAddressLines.join(", ");
  return null;
}

function toCapabilities(features: any): DeviceCapabilities {
  const f = features ?? {};
  return {
    canPlaySound: Boolean(f.SND),
    canMessage: Boolean(f.MSG),
    canMarkLost: Boolean(f.LST),
    canLock: Boolean(f.LCK),
    canErase: Boolean(f.WIP),
  };
}
