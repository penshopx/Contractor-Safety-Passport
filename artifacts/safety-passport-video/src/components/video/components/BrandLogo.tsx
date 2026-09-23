import { motion } from "framer-motion";
import { Shield, Check } from "lucide-react";

export function BrandLogo({ className = "", scale = 1 }: { className?: string, scale?: number }) {
  return (
    <motion.div 
      className={`flex items-center gap-[1vw] select-none ${className}`}
      style={{ scale }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative flex-shrink-0 flex items-center justify-center">
        {/* Outer glow */}
        <motion.div 
          className="absolute -inset-[0.5vw] rounded-full bg-amber-400/30 blur-[1vw]"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Shield container */}
        <div className="relative h-[3.5vw] w-[3.5vw] rounded-[0.8vw] bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 ring-[0.15vw] ring-[#101010]/20 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-[1px] bg-white/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
          
          <Shield
            className="relative z-10 h-[2.2vw] w-[2.2vw] text-[#101010]"
            strokeWidth={2.5}
          />
          <span className="absolute z-20 flex h-[1.2vw] w-[1.2vw] items-center justify-center rounded-full bg-[#101010] shadow-sm ring-[0.1vw] ring-white/35">
            <Check
              className="h-[0.8vw] w-[0.8vw] text-white"
              strokeWidth={4}
            />
          </span>
        </div>
      </div>
      
      {/* Typography */}
      <div className="font-extrabold text-[2.2vw] tracking-[0.1em] uppercase flex items-center gap-[0.5vw] drop-shadow-sm font-display">
        <span className="text-white">SAFETY</span>
        <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
          PASSPORT
        </span>
      </div>
    </motion.div>
  );
}
