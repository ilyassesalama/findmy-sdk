import { authenticate, AuthResult } from "./auth.js";
import { Session } from "./session.js";
import { BatteryStatus, Device, DeviceLocation, LostModeOptions } from "./types.js";

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
    return (data.content ?? []).map(toDevice);
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

function toDevice(raw: any): Device {
  return {
    id: raw.id,
    name: raw.name,
    deviceModel: raw.deviceDisplayName ?? raw.deviceModel ?? "Unknown",
    rawDeviceModel: raw.rawDeviceModel ?? "",
    batteryLevel: typeof raw.batteryLevel === "number" ? raw.batteryLevel : null,
    batteryStatus: (raw.batteryStatus as BatteryStatus) ?? "Unknown",
    location: toLocation(raw.location),
    isLocating: Boolean(raw.isLocating),
    lostModeEnabled: Boolean(raw.lostModeEnabled),
  };
}

function toLocation(raw: any): DeviceLocation | null {
  if (!raw || typeof raw.latitude !== "number") return null;
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    horizontalAccuracy: raw.horizontalAccuracy,
    timestamp: new Date(raw.timeStamp),
    isInaccurate: Boolean(raw.isInaccurate),
    positionType: raw.positionType ?? "Unknown",
  };
}
