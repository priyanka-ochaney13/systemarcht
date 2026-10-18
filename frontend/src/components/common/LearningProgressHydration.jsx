'use client';

import { useCallback, useEffect, useState } from 'react';
import { getLearningProgress, saveLearningProgress } from '@/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useLearningStore } from '@/store';

export function LearningProgressHydration({ children }) {
  const { user, loading: authLoading } = useAuth();
  return (
    <UserLearningProgress
      key={user?.id || 'signed-out'}
      userId={user?.id}
      authLoading={authLoading}
    >
      {children}
    </UserLearningProgress>
  );
}

function UserLearningProgress({ children, userId, authLoading }) {
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [progressError, setProgressError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const ready = Boolean(userId && loadedUserId === userId);
  const error =
    progressError && progressError.userId === userId
      ? progressError.message
      : '';

  useEffect(() => {
    if (authLoading) return undefined;
    useLearningStore.getState().resetLearning();
    if (!userId) {
      return undefined;
    }

    let active = true;
    const controller = new AbortController();
    let unsubscribe;
    let saveTimer;
    let saveQueue = Promise.resolve();

    const loadProgress = async () => {
      try {
        const progress = await getLearningProgress({ signal: controller.signal });
        if (!active) return;

        useLearningStore.setState((state) => ({
          activeModuleId: progress.active_module_id || null,
          modules: { ...state.modules, ...(progress.modules || {}) },
        }));
        setProgressError(null);
        setLoadedUserId(userId);

        unsubscribe = useLearningStore.subscribe((state, previousState) => {
          if (
            state.activeModuleId === previousState.activeModuleId &&
            state.modules === previousState.modules
          ) {
            return;
          }

          const snapshot = {
            active_module_id: state.activeModuleId,
            modules: state.modules,
          };
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => {
            saveQueue = saveQueue
              .then(() => {
                if (active) {
                  return saveLearningProgress(snapshot, {
                    signal: controller.signal,
                  });
                }
                return undefined;
              })
              .then(() => {
                if (active) setProgressError(null);
              })
              .catch((saveError) => {
                if (active && saveError.name !== 'CanceledError') {
                  setProgressError({
                    userId,
                    message:
                      saveError.response?.data?.detail ||
                      'Could not save your learning progress. Please retry.',
                  });
                }
              });
          }, 300);
        });
      } catch (loadError) {
        if (active && loadError.name !== 'CanceledError') {
          setProgressError({
            userId,
            message:
              loadError.response?.data?.detail ||
              'Could not load your learning progress. Please retry.',
          });
        }
      }
    };

    loadProgress();

    return () => {
      active = false;
      clearTimeout(saveTimer);
      unsubscribe?.();
      controller.abort();
    };
  }, [authLoading, retryCount, userId]);

  const retry = useCallback(async () => {
    setProgressError(null);
    if (!ready || !userId) {
      setRetryCount((count) => count + 1);
      return;
    }

    const state = useLearningStore.getState();
    try {
      await saveLearningProgress({
        active_module_id: state.activeModuleId,
        modules: state.modules,
      });
    } catch (saveError) {
      setProgressError({
        userId,
        message:
          saveError.response?.data?.detail ||
          'Could not save your learning progress. Please retry.',
      });
    }
  }, [ready, userId]);

  if (authLoading) return children;
  if (!userId) return children;
  if (!ready) {
    return error ? (
      <main className="mx-auto max-w-lg px-4 py-16 text-center" role="alert">
        <h1 className="text-xl font-semibold">Learning progress is unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        <button className="sa-btn-primary mt-6" onClick={retry} type="button">
          Try again
        </button>
      </main>
    ) : (
      <main className="px-4 py-16 text-center text-muted-foreground" role="status">
        Loading your learning progress…
      </main>
    );
  }

  return (
    <>
      {error ? (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive" role="alert">
          {error}{' '}
          <button className="underline" onClick={retry} type="button">
            Retry
          </button>
        </div>
      ) : null}
      {children}
    </>
  );
}
