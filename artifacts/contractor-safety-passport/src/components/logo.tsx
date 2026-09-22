import { Check, Shield } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 select-none ${className}`}>
      <div className="relative flex-shrink-0 flex items-center justify-center">
        {/* Deep, vibrant outer glow */}
        <div className="absolute -inset-1.5 rounded-full bg-amber-400/50 blur-[10px] pointer-events-none dark:bg-yellow-300/60" />
        
        {/* Premium shield container with 3D gradients and sharp contrast */}
        <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/35 ring-1 ring-slate-900/20 dark:ring-yellow-100/50 overflow-hidden">
          {/* Subtle inner highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          
          <Shield
            className="relative z-10 h-8 w-8 text-slate-950 sm:h-10 sm:w-10"
            strokeWidth={2.5}
          />
          <span className="absolute z-20 flex h-4 w-4 items-center justify-center rounded-full bg-slate-950 shadow-sm ring-1 ring-white/35 sm:h-5 sm:w-5">
            <Check
              className="h-3 w-3 text-white sm:h-3.5 sm:w-3.5"
              strokeWidth={4}
            />
          </span>
        </div>
      </div>
      
      {/* Noticeably larger, uppercase typography */}
      <div className="font-extrabold text-xl sm:text-2xl tracking-[0.1em] uppercase flex items-center gap-1.5 sm:gap-2 drop-shadow-sm">
        <span className="text-foreground">SAFETY</span>
        <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent dark:from-yellow-300 dark:to-amber-400">
          PASSPORT
        </span>
      </div>
    </div>
  );
}
