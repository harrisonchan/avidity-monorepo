export function shuffleArray<T>(array: T[]): T[] {
  const arrCopy = array.map((_i) => _i);
  for (var i = arrCopy.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = arrCopy[i];
    arrCopy[i] = arrCopy[j];
    arrCopy[j] = temp;
  }
  return arrCopy;
}
