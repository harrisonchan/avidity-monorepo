export function convertMapToKeyedArray(mapObj: Map<any, any>): any[] {
  const array = Array.from(mapObj).map(([key, value]) => ({ key, value }));
  return array;
}
export function convertMapToArray(mapObj: Map<any, any>): any[] {
  const array = Array.from(mapObj).map(([_, value]) => value);
  return array;
}
