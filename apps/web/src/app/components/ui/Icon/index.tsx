import { Acorn, AirplaneTakeoff } from '@phosphor-icons/react/dist/ssr';
import { IconProps as BaseIconProps, Icon as BaseIcon } from '@phosphor-icons/react';
import { SupportedPhosphorIconNames } from '@shared/types';

// ONLY THE ONES I'M GOING TO USE
const supportedPhosphorIcons: { [key in SupportedPhosphorIconNames]?: BaseIcon } = {
  Acorn: Acorn,
  AirplaneTakeoff: AirplaneTakeoff,
};

export type IconProps = BaseIconProps & {
  name: SupportedPhosphorIconNames;
};

export function Icon(props: IconProps) {
  const IconComponent = supportedPhosphorIcons[props.name];
  if (IconComponent) return <IconComponent {...props} />;
  else {
    console.debug(`Couldn't find icon: ${props.name}`);
    return <Acorn {...props} />;
  }
}
