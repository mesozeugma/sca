import { distinctUntilChanged } from 'rxjs';

export function distinctUntilChangedArray<T extends unknown[]>() {
  return distinctUntilChanged<T>(
    (a, b) => JSON.stringify(a) === JSON.stringify(b)
  );
}

export function distinctUntilChangedJSON<T extends Record<string, unknown>>() {
  return distinctUntilChanged<T>((a, b) => {
    const aJSON = JSON.stringify(a, Object.keys(a).sort());
    const bJSON = JSON.stringify(b, Object.keys(b).sort());
    return aJSON === bJSON;
  });
}
