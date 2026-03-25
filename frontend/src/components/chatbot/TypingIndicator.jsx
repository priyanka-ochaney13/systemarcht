'use client';

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-md shadow-amber-500/20">
        <span className="text-xs font-black text-zinc-900">A</span>
      </div>
      <div className="bg-zinc-800/80 border border-zinc-700/40 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5 h-5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '900ms' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
