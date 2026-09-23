import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame, VideoText } from '@/lib/video';
import { Calculator } from 'lucide-react';

export function Scene3() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0, scale: 1.2 }}
          animate={{ opacity: 0.25, scale: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_intro.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/70] to-transparent" />

        <div className="relative z-10 flex h-full w-full flex-col justify-center px-[10vw]">
          <div className="max-w-[80vw] mx-auto text-center flex flex-col items-center">
            
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-[0.5vw] rounded-full border border-[hsl(var(--color-accent))/30] bg-[hsl(var(--color-accent))/10] px-[2vw] py-[1vw] mb-[3vw]"
            >
              <Calculator className="h-[2.5vw] w-[2.5vw] text-[hsl(var(--color-accent))]" />
              <VideoText className="text-[1.8vw] font-medium text-[hsl(var(--color-accent))]">
                Perencanaan Terpadu
              </VideoText>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <VideoText className="text-[4.5vw] font-bold leading-tight text-white mb-[4vw]">
                Penyusunan BOQ SMKK <br />
                <span className="text-gradient-primary">Kolaboratif</span>
              </VideoText>
            </motion.div>

            {/* BOQ Table UI abstraction */}
            <motion.div 
              className="w-[60vw] rounded-2xl border border-white/10 bg-[#101010]/80 p-[2vw] backdrop-blur-md shadow-2xl relative overflow-hidden"
              initial={{ opacity: 0, y: 50, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              exit={{ opacity: 0, y: 50 }}
              transition={{ duration: 1.2, delay: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="grid grid-cols-4 gap-[1vw] text-[1.2vw] font-medium text-white/50 pb-[1vw] border-b border-white/10">
                <div className="col-span-2 text-left">Item Pekerjaan</div>
                <div className="text-right">Volume</div>
                <div className="text-right">Estimasi</div>
              </div>
              
              {[
                { name: "Alat Pelindung Diri (APD)", vol: "—", total: "Draf" },
                { name: "Fasilitas Kesehatan", vol: "—", total: "Draf" },
                { name: "Rambu & Barikade", vol: "—", total: "Draf" },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  className="grid grid-cols-4 gap-[1vw] text-[1.4vw] py-[1vw] border-b border-white/5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.5 + (i * 0.2) }}
                >
                  <div className="col-span-2 text-left flex items-center gap-[0.5vw]">
                    <div className="w-[1vw] h-[1vw] rounded-full bg-[hsl(var(--color-primary))]"></div>
                    <span className="text-white/90">{item.name}</span>
                  </div>
                  <div className="text-right text-white/70">{item.vol}</div>
                  <div className="text-right font-medium text-[hsl(var(--color-accent))]">{item.total}</div>
                </motion.div>
              ))}

              <motion.div 
                className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-[hsl(var(--color-primary))] to-[hsl(var(--color-accent))]"
                initial={{ height: 0 }}
                animate={{ height: "100%" }}
                transition={{ duration: 2, delay: 1.2 }}
              />
            </motion.div>

          </div>
        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
