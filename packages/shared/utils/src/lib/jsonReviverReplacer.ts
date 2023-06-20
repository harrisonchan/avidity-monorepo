export function mapSetStorageReviver(key: string, item: any) {
  if (typeof item === 'object' && item !== null) {
    if (item.dataType === 'Set') {
      return new Set(item.value);
    } else if (item.dataType === 'Map') {
      return new Map(item.value);
    }
  }
  return item;
}

export function mapSetStorageReplacer(key: string, item: any) {
  if (item instanceof Set) {
    return {
      dataType: 'Set',
      value: [...item], // or with spread: value: [...value]
    };
  } else if (item instanceof Map) {
    return {
      dataType: 'Map',
      value: Array.from(item.entries()),
    };
  } else {
    return item;
  }
}
