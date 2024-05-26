export function throttle(func: Function, wait: number = 20) {
  let timeout: NodeJS.Timeout | null;
  return function (this: unknown) {
    const args = arguments;
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null;
        func.apply(this, args);
      }, wait);
    }
  };
}
