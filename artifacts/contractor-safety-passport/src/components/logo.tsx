import { ShieldCheck } from "lucide-react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 sm:gap-4 select-none ${className}`}>
      <div className="relative flex-shrink-0 flex items-center justify-center">
        {/* Deep, vibrant outer glow */}
        <div className="absolute -inset-1.5 bg-primary/40 blur-[10px] rounded-full pointer-events-none" />
        
        {/* Premium shield container with 3D gradients and sharp contrast */}
        <div className="relative h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br from-cyan-400 via-primary to-blue-700 flex items-center justify-center shadow-md ring-1 ring-white/30 overflow-hidden">
          {/* Subtle inner highlight */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
          
          <ShieldCheck 
            className="h-5 w-5 sm:h-6 sm:w-6 text-[#05101a] relative z-10" 
            strokeWidth={3} 
          />
        </div>
      </div>
      
      {/* Noticeably larger, uppercase typography */}
      <div className="font-extrabold text-xl sm:text-2xl tracking-[0.1em] uppercase flex items-center gap-1.5 sm:gap-2 drop-shadow-sm">
        <span className="text-white">SAFETY</span>
        <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-cyan-400">
          PASSPORT
        </span>
      </div>
    </div>
  );
}
