import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame, VideoText } from '@/lib/video';
import { BrandLogo } from '../components/BrandLogo';

export function Scene1() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.4, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 3.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_intro.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/80] to-transparent" />

        {/* Foreground Content */}
        <div className="relative z-10 flex h-full w-full flex-col justify-center px-[8vw]">
          <div className="max-w-[70vw]">
            <BrandLogo className="mb-[3vw]" scale={1.2} />
            
            <div className="space-y-[1.5vw]">
              <motion.div
                initial={{ opacity: 0, x: -50, clipPath: "inset(0 100% 0 0)" }}
                animate={{ opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="inline-block rounded-full border border-[hsl(var(--color-primary))/30] bg-[hsl(var(--color-primary))/10] px-[1.5vw] py-[0.5vw]"
              >
                <VideoText className="text-[1.8vw] font-medium text-[hsl(var(--color-primary))]">
                  Kesiapan Operasional Kontraktor
                </VideoText>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 1, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <VideoText className="text-[4vw] font-bold leading-[1.1] text-white">
                  Kelola Kesiapan Keselamatan <br />
                  <span className="text-gradient-primary">Tanpa Kehilangan Konteks</span>
                </VideoText>
              </motion.div>
            </div>
          </div>
        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
