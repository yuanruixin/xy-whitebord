export function throttle(
  func: (...args: any[]) => void,
  wait: number = 20
) {
  let timeout: NodeJS.Timeout | null;
  return function (...args: unknown[]) {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func(...args);
      }, wait);
    }
  };
}
