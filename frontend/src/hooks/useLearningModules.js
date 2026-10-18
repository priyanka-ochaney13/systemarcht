'use client';

import { useEffect, useState } from 'react';
import { getLearningModules } from '@/api/client';

export function useLearningModules(enabled = true) {
  const [modules, setModules] = useState([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    getLearningModules({ signal: controller.signal })
      .then((result) => {
        if (!Array.isArray(result)) {
          throw new Error('The learning modules API returned an invalid response.');
        }
        setModules(result);
      })
      .catch((requestError) => {
        if (controller.signal.aborted) {
          return;
        }
        setError(
          requestError.response?.data?.detail ||
            requestError.message ||
            'Could not load learning modules.'
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [enabled, retryCount]);

  return {
    modules,
    isLoading,
    error,
    retry: () => setRetryCount((count) => count + 1),
  };
}
