import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loads one async resource for the current `key` (e.g. a route param or coordinates).
 * Cancels the in-flight request when the key changes or the component unmounts.
 */
export function useAsyncResource(loader, key) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ requestKey: null, data: null, error: null });
  const loaderRef = useRef(loader);
  const requestKey = `${key}#${attempt}`;

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    const controller = new AbortController();
    loaderRef.current(controller.signal)
      .then((data) => setResult({ requestKey, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ requestKey, data: null, error });
      });
    return () => controller.abort();
  }, [requestKey]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  const setData = useCallback((data) => setResult((r) => ({ ...r, data })), []);

  const current = result.requestKey === requestKey;
  const status = !current ? 'loading' : result.error ? 'error' : 'success';
  return { status, data: current ? result.data : null, error: current ? result.error : null, retry, setData };
}
