import { PermissionsAndroid, Platform } from 'react-native';

export async function ensureBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  const P = PermissionsAndroid.PERMISSIONS;
  if (Number(Platform.Version) >= 31) {
    const r = await PermissionsAndroid.requestMultiple([P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT]);
    return Object.values(r).every((v) => v === PermissionsAndroid.RESULTS.GRANTED);
  }
  // Android 11 and below: scanning needs location permission AND location switched on
  const r = await PermissionsAndroid.request(P.ACCESS_FINE_LOCATION);
  return r === PermissionsAndroid.RESULTS.GRANTED;
}