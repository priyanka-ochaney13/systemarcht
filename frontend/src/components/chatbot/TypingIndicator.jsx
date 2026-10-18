'use client';

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-md shadow-primary/20">
        <span className="text-xs font-black text-foreground">A</span>
      </div>
      <div className="bg-muted/80 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5 h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
