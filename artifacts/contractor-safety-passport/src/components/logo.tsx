import { ShieldCheck } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 select-none ${className}`}>
      <div className="relative flex-shrink-0 flex items-center justify-center">
        {/* Deep, vibrant outer glow */}
        <div className="absolute -inset-1.5 rounded-full bg-cyan-400/45 blur-[10px] pointer-events-none dark:bg-cyan-300/55" />
        
        {/* Premium shield container with 3D gradients and sharp contrast */}
        <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-cyan-200 via-sky-400 to-blue-500 flex items-center justify-center shadow-md shadow-sky-500/30 ring-1 ring-slate-900/15 dark:ring-white/40 overflow-hidden">
          {/* Subtle inner highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          
          <ShieldCheck 
            className="h-8 w-8 sm:h-10 sm:w-10 text-slate-950 relative z-10" 
            strokeWidth={2.5} 
          />
        </div>
      </div>
      
      {/* Noticeably larger, uppercase typography */}
      <div className="font-extrabold text-xl sm:text-2xl tracking-[0.1em] uppercase flex items-center gap-1.5 sm:gap-2 drop-shadow-sm">
        <span className="text-foreground">SAFETY</span>
        <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent dark:from-sky-400 dark:to-cyan-300">
          PASSPORT
        </span>
      </div>
    </div>
  );
}
