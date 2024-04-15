import { icons } from '@phosphor-icons/core';

const iconNames = icons.map((entry) => entry.pascal_name);
export type PhosphorIconNames = (typeof iconNames)[number];
