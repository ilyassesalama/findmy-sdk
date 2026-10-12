import { DeviceMobile, DeviceTablet, Headphones, Laptop, MapPin, Watch } from "@phosphor-icons/react";

const icons = { iPhone: DeviceMobile, iPad: DeviceTablet, Mac: Laptop, Watch, AirPods: Headphones };

export function DeviceIcon({ deviceClass, size = 18 }: { deviceClass: string; size?: number }) {
  const Icon = icons[deviceClass as keyof typeof icons] ?? MapPin;
  return <Icon size={size} weight="bold" />;
}
