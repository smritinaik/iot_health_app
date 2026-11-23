import { BleManager, Device, State, Subscription } from 'react-native-ble-plx';
import { Platform } from 'react-native';
import { Buffer } from 'buffer';

export const SERVICE_UUID = '6f3a0001-8c1e-4f4b-9a57-2b1c5d7e9f10';
const CMD_UUID = '6f3a0002-8c1e-4f4b-9a57-2b1c5d7e9f10';
const DATA_UUID = '6f3a0003-8c1e-4f4b-9a57-2b1c5d7e9f10';

let _manager: BleManager | null = null;

// created on first use, so the app doesn't crash where Bluetooth doesn't exist
function getManager(): BleManager {
  if (!_manager) {
    try {
      _manager = new BleManager();
    } catch {
      throw new Error('Bluetooth needs the development build on a real Android phone (not a browser or Expo Go).');
    }
  }
  return _manager;
}

export type ScanEvent =
  | { type: 'progress'; sec: number }
  | { type: 'beat'; ibi: number }
  | { type: 'nofinger' };

export async function connectToPulseDevice(timeoutMs = 12000): Promise<Device> {
  const manager = getManager();

  if ((await manager.state()) !== State.PoweredOn) {
    if (Platform.OS === 'android') await manager.enable();
    else throw new Error('Please turn on Bluetooth');
  }

  return new Promise((resolve, reject) => {
    let found = false;
    const timer = setTimeout(() => {
      manager.stopDeviceScan();
      reject(new Error('Sensor not found. Is it powered on and close by?'));
    }, timeoutMs);

    manager.startDeviceScan([SERVICE_UUID], { allowDuplicates: false }, async (err, dev) => {
      if (err) { clearTimeout(timer); reject(err); return; }
      if (!dev || found) return;
      found = true;
      clearTimeout(timer);
      manager.stopDeviceScan();
      try {
        const c = await dev.connect({ timeout: 10000 });
        await c.discoverAllServicesAndCharacteristics();
        resolve(c);
      } catch (e) { reject(e); }
    });
  });
}

export function runScan(device: Device, on: (e: ScanEvent) => void): Promise<number[]> {
  const ibis: number[] = [];
  let sub: Subscription | null = null;

  return new Promise<number[]>((resolve, reject) => {
    sub = device.monitorCharacteristicForService(SERVICE_UUID, DATA_UUID, (err, ch) => {
      if (err) { reject(err); return; }
      if (!ch?.value) return;
      const [t, arg] = Buffer.from(ch.value, 'base64').toString('utf8').split(',');
      switch (t) {
        case 'B': { const v = Number(arg); ibis.push(v); on({ type: 'beat', ibi: v }); break; }
        case 'P': on({ type: 'progress', sec: Number(arg) }); break;
        case 'F': on({ type: 'nofinger' }); break;
        case 'D': resolve(ibis); break;
        case 'E': reject(new Error(arg === 'nofinger' ? 'Finger lost for too long. Try again.' : 'Sensor error')); break;
      }
    });
    device
      .writeCharacteristicWithResponseForService(SERVICE_UUID, CMD_UUID, Buffer.from('S').toString('base64'))
      .catch(reject);
  }).finally(() => sub?.remove());
}