import { useEffect, useState } from 'react';

// Returns `value` after it has stopped changing for `delay` ms (keeps search from firing per keystroke).
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
