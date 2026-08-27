# findmy-sdk

A minimal, production-ready TypeScript SDK for Apple's **Find My** network. Sign
in with an Apple ID and password to locate your devices, ring them, put them in
Lost Mode, or erase them — using Apple's own Find My web endpoints.

- **No two-factor code required.** Uses Apple's lost-device carve-out: device
  locations are reachable with just your Apple ID and password, because the
  device holding your 2FA code might be the one you've lost. This is the same
  mechanism the App Store "tracker" apps rely on.
- **Zero runtime dependencies.** SRP-6a auth and all HTTP calls are implemented
  directly on Node's built-in `crypto` and `fetch`.
- **Small and typed.** A handful of focused files, fully typed.

Requires **Node.js 18+**.

## Install

```bash
npm install findmy-sdk
```

## Usage

```ts
import { FindMy } from "findmy-sdk";

const fm = await FindMy.login("you@icloud.com", "your-password");

// List devices with their latest locations.
const devices = await fm.devices();
for (const d of devices) {
  console.log(d.name, d.deviceModel, d.batteryLevel);
  if (d.location) {
    console.log(`  ${d.location.latitude}, ${d.location.longitude} (±${d.location.horizontalAccuracy}m)`);
  }
}

// Track locations continuously (fresh fix every 15s by default).
for await (const snapshot of fm.watch()) {
  console.log(snapshot[0].location);
  // break; to stop
}

// Play a sound to find a device.
await fm.ring(devices[0].id);

// Show a message on the lock screen.
await fm.message(devices[0].id, "Please call me!");

// Put a device into Lost Mode.
await fm.markAsLost(devices[0].id, {
  phoneNumber: "+15551234567",
  message: "This device is lost.",
});

// Erase a device — IRREVERSIBLE.
await fm.erase(devices[0].id);
```

Call `devices()` again to get fresh locations — the first call bootstraps the
session and later calls request an updated fix.

## API

### `FindMy.login(email, password): Promise<FindMy>`

Signs in and returns a client. Throws `AuthError` if the credentials are
rejected or Find My isn't available on the account.

### `fm.devices(): Promise<Device[]>`

Returns all devices in the account with their latest known locations.

### `fm.watch(intervalMs?): AsyncGenerator<Device[]>`

Continuously yields fresh device snapshots on an interval (default `15000` ms).
The first snapshot is yielded immediately; reuses the same session, so only one
sign-in happens. Stop by `break`ing out of the `for await` loop.

### `fm.ring(deviceId): Promise<void>`

Plays a sound on the device.

### `fm.message(deviceId, text, sound?): Promise<void>`

Displays a message on the device's screen, optionally with a sound.

### `fm.markAsLost(deviceId, options?): Promise<void>`

Puts the device into Lost Mode. Options: `phoneNumber`, `message`, `passcode`.

### `fm.erase(deviceId, message?): Promise<void>`

Erases the device. **This is irreversible** — the device is wiped and removed
from the account.

### Types

```ts
interface Device {
  id: string;
  name: string;
  deviceModel: string;      // e.g. "iPhone 15 Pro"
  rawDeviceModel: string;   // e.g. "iPhone16,1"
  batteryLevel: number | null; // 0..1
  batteryStatus: "Charging" | "NotCharging" | "Full" | "Unknown";
  location: DeviceLocation | null;
  isLocating: boolean;
  lostModeEnabled: boolean;
}

interface DeviceLocation {
  latitude: number;
  longitude: number;
  horizontalAccuracy: number; // meters
  timestamp: Date;
  isInaccurate: boolean;
  positionType: string;       // e.g. "Wifi" or "GPS"
}
```

## Notes & limitations

- **Your own account only.** Locating anyone else's Apple ID without consent is
  illegal in most jurisdictions.
- **Unofficial.** This uses Apple's private, undocumented endpoints. It is
  against Apple's Terms of Service, and Apple can change the flow at any time,
  which will break this SDK until it's updated.
- **App-specific passwords do not work** — Find My needs the real account
  password.
- **Signing in may notify your trusted devices** ("your Apple ID was used to
  sign in"), even though no code is required.
- **Poll gently.** Each `devices()` call actively pings your devices and drains
  their batteries. Don't refresh more often than every ~30–60 seconds.

## License

MIT
