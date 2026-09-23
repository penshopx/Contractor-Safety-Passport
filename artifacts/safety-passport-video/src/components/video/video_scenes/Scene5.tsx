import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame } from '@/lib/video';
import { BrandLogo } from '../components/BrandLogo';

export function Scene5() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer - deep dark with subtle texture */}
        <div className="absolute inset-0 z-0 bg-[#0a0a0a]" />
        
        {/* Large abstract elements to fill space */}
        <motion.div 
          className="absolute left-[-10vw] top-[-10vw] w-[50vw] h-[50vw] rounded-full opacity-20 blur-[8vw] z-0"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ duration: 4, ease: "easeOut" }}
          style={{ background: "radial-gradient(circle, hsl(var(--color-primary)) 0%, transparent 70%)" }}
        />
        <motion.div 
          className="absolute right-[-10vw] bottom-[-10vw] w-[60vw] h-[60vw] rounded-full opacity-10 blur-[10vw] z-0"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1.2 }}
          transition={{ duration: 4.5, delay: 0.5, ease: "easeOut" }}
          style={{ background: "radial-gradient(circle, hsl(var(--color-accent)) 0%, transparent 70%)" }}
        />

        <div className="relative z-10 flex h-full w-full flex-col justify-center items-center text-center px-[8vw]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-[5vw]"
          >
            <BrandLogo scale={2.5} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex justify-center"
          >
            <div className="text-[5.5vw] font-bold text-white max-w-[85vw] leading-[1.1] mb-[3vw]">
              Lingkungan Kerja yang <br />
              <span className="text-gradient-primary">Lebih Terstruktur</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="text-[2.5vw] text-white/70 max-w-[70vw] leading-relaxed">
              Satukan manajemen dokumen persiapan proyek Anda dengan laporan operasional lapangan secara mulus.
            </div>
          </motion.div>
          
          <motion.div
            className="mt-[4vw] h-[0.4vw] w-[15vw] rounded-full bg-gradient-to-r from-transparent via-[hsl(var(--color-primary))] to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
          />

          {/* Abstract circular rings emerging from center */}
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5 pointer-events-none z-[-1]"
            initial={{ width: "20vw", height: "20vw", opacity: 1 }}
            animate={{ width: "120vw", height: "120vw", opacity: 0 }}
            transition={{ duration: 3, delay: 0.3, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[hsl(var(--color-primary))]/20 pointer-events-none z-[-1]"
            initial={{ width: "20vw", height: "20vw", opacity: 1 }}
            animate={{ width: "100vw", height: "100vw", opacity: 0 }}
            transition={{ duration: 3, delay: 0.6, ease: "easeOut" }}
          />
        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
