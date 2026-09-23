import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame, VideoText } from '@/lib/video';
import { BrandLogo } from '../components/BrandLogo';

export function Scene5() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer - clean and dark for closing */}
        <div className="absolute inset-0 z-0 bg-[hsl(var(--color-bg-dark))]" />
        
        {/* Subtle glowing center */}
        <motion.div 
          className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] rounded-full blur-[100px] z-0"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{
            background: "radial-gradient(circle, hsl(var(--color-primary)) 0%, transparent 70%)"
          }}
        />

        <div className="relative z-10 flex h-full w-full flex-col justify-center items-center text-center px-[10vw]">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-[3vw]"
          >
            <BrandLogo scale={1.5} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
          >
            <VideoText className="text-[3vw] font-bold text-white max-w-[70vw] leading-tight mb-[2vw]">
              Lingkungan Kerja yang <br />
              <span className="text-gradient-primary">Lebih Terstruktur</span>
            </VideoText>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 1.4, ease: "easeOut" }}
          >
            <VideoText className="text-[1.8vw] text-white/60 max-w-[60vw] leading-relaxed">
              Satukan manajemen dokumen persiapan proyek Anda dengan laporan operasional lapangan.
            </VideoText>
          </motion.div>
          
          <motion.div
            className="mt-10 h-1 w-[10vw] bg-gradient-to-r from-transparent via-[hsl(var(--color-primary))] to-transparent"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 1.8, ease: "easeInOut" }}
          />
        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
