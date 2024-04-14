export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((_w) => _w.charAt(0).toUpperCase() + _w.slice(1))
    .join(' ');
}
