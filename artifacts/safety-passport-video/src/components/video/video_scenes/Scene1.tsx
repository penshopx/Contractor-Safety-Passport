import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame } from '@/lib/video';
import { BrandLogo } from '../components/BrandLogo';
import { Shield, FileCheck, HardHat, FileText } from 'lucide-react';

export function Scene1() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0.15, scale: 1.05 }}
          animate={{ opacity: 0.35, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 3.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_intro.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/90] to-transparent" />

        {/* Foreground Content */}
        <div className="relative z-10 flex h-full w-full items-center px-[6vw]">
          {/* Left Text */}
          <div className="w-[55%] flex flex-col justify-center">
            <BrandLogo className="mb-[4vw]" scale={1.3} />
            
            <div className="space-y-[2vw]">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block rounded-full border border-[hsl(var(--color-primary))/40] bg-[hsl(var(--color-primary))/15] px-[2vw] py-[0.8vw]"
              >
                <div className="text-[2vw] font-medium text-[hsl(var(--color-primary))] flex items-center gap-[1vw]">
                  <Shield className="w-[2vw] h-[2vw]" />
                  Kesiapan Operasional Kontraktor
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="text-[4.8vw] font-bold leading-[1.1] text-white">
                  Kelola Kesiapan Keselamatan <br />
                  <span className="text-gradient-primary">Tanpa Kehilangan Konteks</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Right Floating Elements to fill space */}
          <div className="w-[45%] h-full relative perspective-1000 flex items-center justify-center">
            <motion.div 
              className="absolute w-[35vw] h-[35vw] rounded-full border-[2px] border-[hsl(var(--color-primary))/20]"
              initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 180, opacity: 1 }}
              transition={{ duration: 10, ease: "linear", repeat: Infinity }}
            />
            <motion.div 
              className="absolute w-[25vw] h-[25vw] rounded-full border-[1px] border-[hsl(var(--color-accent))/30] border-dashed"
              initial={{ scale: 0.5, rotate: 20, opacity: 0 }}
              animate={{ scale: 1, rotate: -180, opacity: 1 }}
              transition={{ duration: 12, ease: "linear", repeat: Infinity }}
            />

            {/* Document Card 1 */}
            <motion.div 
              className="absolute z-20 w-[24vw] rounded-xl border border-white/10 bg-[#151515]/90 backdrop-blur-md p-[2vw] shadow-2xl"
              initial={{ opacity: 0, x: 30, y: -30, rotateY: 10, rotateZ: 5 }}
              animate={{ opacity: 1, x: "10%", y: "-35%", rotateY: -10, rotateZ: 2 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-[1vw] mb-[1.5vw]">
                <div className="w-[3vw] h-[3vw] rounded-full bg-[hsl(var(--color-primary))/20] flex items-center justify-center text-[hsl(var(--color-primary))]">
                  <FileCheck className="w-[1.5vw] h-[1.5vw]" />
                </div>
                <div>
                  <div className="text-[1.5vw] font-bold text-white">Dokumen RKK</div>
                  <div className="text-[1vw] text-white/50">Telah Diunggah</div>
                </div>
              </div>
              <div className="space-y-[0.8vw]">
                <div className="h-[0.5vw] w-full bg-white/10 rounded-full" />
                <div className="h-[0.5vw] w-4/5 bg-white/10 rounded-full" />
              </div>
            </motion.div>

            {/* Document Card 2 */}
            <motion.div 
              className="absolute z-10 w-[22vw] rounded-xl border border-white/10 bg-[#151515]/90 backdrop-blur-md p-[1.5vw] shadow-2xl"
              initial={{ opacity: 0, x: 30, y: 30, rotateY: -10, rotateZ: -5 }}
              animate={{ opacity: 1, x: "-10%", y: "40%", rotateY: 10, rotateZ: -3 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-[1vw] mb-[1vw]">
                <div className="w-[2.5vw] h-[2.5vw] rounded-full bg-[hsl(var(--color-accent))/20] flex items-center justify-center text-[hsl(var(--color-accent))]">
                  <HardHat className="w-[1.2vw] h-[1.2vw]" />
                </div>
                <div>
                  <div className="text-[1.3vw] font-bold text-white">Bukti personel</div>
                  <div className="text-[0.9vw] text-white/50">Untuk ditinjau</div>
                </div>
              </div>
              <div className="space-y-[0.6vw]">
                <div className="h-[0.4vw] w-full bg-white/10 rounded-full" />
                <div className="h-[0.4vw] w-2/3 bg-white/10 rounded-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
