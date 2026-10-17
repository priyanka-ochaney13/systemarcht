'use client';

import React from 'react';
import { Zap } from 'lucide-react';

export const CustomLoader = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5">
        <div className="flex size-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Zap className="size-7" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-foreground">SystemArcht</p>
          <p className="mt-1 text-sm text-muted-foreground">Loading your architecture playground...</p>
        </div>
      </div>
    </div>
  );
};
