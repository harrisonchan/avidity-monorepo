import { icons } from '@phosphor-icons/core';

const iconNames = icons.map((entry) => entry.pascal_name);
export type PhosphorIconNames = (typeof iconNames)[number];
export const supportedPhosphorIconNames = ['Acorn', 'AirplaneTakeoff'] as const;
export type SupportedPhosphorIconNames = (typeof iconNames)[number] extends infer T
  ? T extends (typeof supportedPhosphorIconNames)[number]
    ? T
    : never
  : never;
