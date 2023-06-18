import { Dayjs } from 'dayjs';

export type Color = string | undefined;
export type DateParam = string | Date | Dayjs | undefined;
export type TimeFormat = 'utc' | 'local';
export type LatLng = { lat: string | number; lng: string | number };
