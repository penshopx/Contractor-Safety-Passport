import { motion } from 'framer-motion';
import { SceneLayout, SafeFrame } from '@/lib/video';
import { Calculator, FileSpreadsheet, Plus } from 'lucide-react';

export function Scene3() {
  return (
    <SceneLayout>
      <SafeFrame>
        {/* Background Layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ opacity: 0.15, scale: 1.1 }}
          animate={{ opacity: 0.25, scale: 1 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 4.5, ease: "easeOut" }}
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/bg_data_abstract.jpg)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-[hsl(var(--color-bg-dark))] via-[hsl(var(--color-bg-dark))/85] to-[hsl(var(--color-bg-dark))/50]" />

        <div className="relative z-10 flex h-full w-full flex-col px-[8vw] pt-[6vw]">
          {/* Header Area */}
          <div className="flex flex-col mb-[4vw]">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-[1vw] rounded-full border border-[hsl(var(--color-accent))/40] bg-[hsl(var(--color-accent))/15] px-[2vw] py-[0.8vw] w-fit mb-[2vw]"
            >
              <Calculator className="h-[2vw] w-[2vw] text-[hsl(var(--color-accent))]" />
              <div className="text-[1.8vw] font-medium text-[hsl(var(--color-accent))]">
                Perencanaan Terpadu
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="text-[4.5vw] font-bold leading-[1.1] text-white">
                Penyusunan BOQ SMKK <br />
                <span className="text-gradient-primary">Kolaboratif</span>
              </div>
            </motion.div>
          </div>

          {/* Large BOQ Table UI abstraction */}
          <motion.div 
            className="w-full flex-1 mb-[4vw] rounded-[1.5vw] border border-white/10 bg-[#151515]/95 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col"
            initial={{ opacity: 0, y: 50, rotateX: -5 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-[3vw] py-[2vw] border-b-[2px] border-white/10 bg-white/5">
              <div className="flex items-center gap-[1vw]">
                <FileSpreadsheet className="w-[2vw] h-[2vw] text-white/50" />
                <div className="text-[2vw] font-bold text-white">RAB Keselamatan Kerja</div>
              </div>
              <motion.div 
                className="flex items-center gap-[0.5vw] bg-[hsl(var(--color-primary))] text-[#101010] px-[1.5vw] py-[0.8vw] rounded-lg text-[1.4vw] font-bold"
                whileHover={{ scale: 1.05 }}
              >
                <Plus className="w-[1.5vw] h-[1.5vw]" /> Tambah Item
              </motion.div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-[2vw] px-[3vw] py-[1.5vw] text-[1.4vw] font-medium text-white/50 border-b-[2px] border-white/10">
              <div className="col-span-5 text-left">Deskripsi Pekerjaan</div>
              <div className="col-span-2 text-center">Satuan</div>
              <div className="col-span-2 text-right">Volume</div>
              <div className="col-span-3 text-right">Status Estimasi</div>
            </div>
            
            {/* Table Rows */}
            <div className="flex-1 overflow-hidden px-[3vw]">
              {[
                { name: "Penyediaan Alat Pelindung Diri (APD)", unit: "Set", vol: "—", total: "Draf" },
                { name: "Fasilitas Kesehatan Lapangan", unit: "Ls", vol: "—", total: "Draf" },
                { name: "Pemasangan Rambu & Barikade", unit: "Ttk", vol: "—", total: "Draf" },
                { name: "Pelatihan K3 Pekerja", unit: "Org", vol: "—", total: "Draf" },
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  className="grid grid-cols-12 gap-[2vw] py-[2vw] border-b border-white/5 items-center"
                  initial={{ opacity: 0, x: -20, backgroundColor: "rgba(255,255,255,0)" }}
                  animate={{ opacity: 1, x: 0, backgroundColor: i === 1 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0)" }}
                  transition={{ duration: 0.6, delay: 0.4 + (i * 0.15) }}
                >
                  <div className="col-span-5 text-left flex items-center gap-[1vw]">
                    <div className="w-[1.2vw] h-[1.2vw] rounded-full bg-[hsl(var(--color-primary))] opacity-80"></div>
                    <span className="text-[1.8vw] text-white/90 font-medium truncate">{item.name}</span>
                  </div>
                  <div className="col-span-2 text-center text-[1.6vw] text-white/60">{item.unit}</div>
                  <div className="col-span-2 text-right text-[1.6vw] text-white/70">{item.vol}</div>
                  <div className="col-span-3 text-right flex justify-end">
                    <span className="bg-[hsl(var(--color-accent))/20] border border-[hsl(var(--color-accent))/40] text-[hsl(var(--color-accent))] px-[1.5vw] py-[0.5vw] rounded-md text-[1.4vw] font-bold">
                      {item.total}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              className="absolute top-0 right-0 bottom-0 w-[0.5vw] bg-gradient-to-b from-[hsl(var(--color-primary))] to-[hsl(var(--color-accent))]"
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ duration: 2, delay: 1.2, ease: "circOut" }}
            />
          </motion.div>

        </div>
      </SafeFrame>
    </SceneLayout>
  );
}
