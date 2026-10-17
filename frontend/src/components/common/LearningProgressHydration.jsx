'use client';

import { useEffect } from 'react';
import { useLearningStore } from '@/store';

export function LearningProgressHydration() {
  useEffect(() => {
    useLearningStore.persist.rehydrate();
  }, []);

  return null;
}
