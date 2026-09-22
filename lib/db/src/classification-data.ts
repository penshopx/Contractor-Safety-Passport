export type ConstructionClassificationSeed = {
  code: string;
  name: string;
  family: "BG" | "BS" | "IN" | "KK" | "KP" | "PA" | "PB" | "PL";
  nature: "UMUM" | "SPESIALIS";
  qualifications: Array<"KECIL" | "MENENGAH" | "BESAR">;
};

const general = (family: "BG" | "BS", rows: Array<[string, string, ConstructionClassificationSeed["qualifications"]]>) =>
  rows.map(([code, name, qualifications]) => ({ code, name, family, nature: "UMUM" as const, qualifications }));
const specialist = (family: "IN" | "KK" | "KP" | "PA" | "PB" | "PL", rows: Array<[string, string]>) =>
  rows.map(([code, name]) => ({ code, name, family, nature: "SPESIALIS" as const, qualifications: [] }));

export const constructionClassificationSeed: ConstructionClassificationSeed[] = [
  ...general("BG", [
    ["BG001", "Konstruksi Gedung Hunian", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG002", "Konstruksi Gedung Perkantoran", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG003", "Konstruksi Gedung Industri", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG004", "Konstruksi Gedung Perbelanjaan", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG005", "Konstruksi Gedung Kesehatan", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG006", "Konstruksi Gedung Pendidikan", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG007", "Konstruksi Gedung Penginapan", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG008", "Konstruksi Gedung Tempat Hiburan dan Olahraga", ["KECIL", "MENENGAH", "BESAR"]],
    ["BG009", "Konstruksi Gedung Lainnya", ["KECIL", "MENENGAH", "BESAR"]],
  ]),
  ...general("BS", [
    ["BS001", "Konstruksi Bangunan Sipil Jalan", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS002", "Bangunan Sipil Jembatan, Jalan Layang, Fly Over, dan Underpass", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS003", "Konstruksi Jalan Rel", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS004", "Konstruksi Jaringan Irigasi dan Drainase", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS005", "Konstruksi Bangunan Sipil Pengolahan Air Bersih", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS006", "Konstruksi Bangunan Sipil Prasarana dan Sarana Sistem Pengolahan Limbah Padat, Cair, dan Gas", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS007", "Konstruksi Bangunan Sipil Elektrikal", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS008", "Konstruksi Bangunan Sipil Telekomunikasi untuk Prasarana Transportasi", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS009", "Konstruksi Sentral Telekomunikasi", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS010", "Konstruksi Bangunan Prasarana Sumber Daya Air", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS011", "Konstruksi Bangunan Pelabuhan Bukan Perikanan", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS012", "Konstruksi Bangunan Pelabuhan Perikanan", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS013", "Konstruksi Bangunan Sipil Minyak dan Gas Bumi", ["MENENGAH", "BESAR"]],
    ["BS014", "Konstruksi Bangunan Sipil Pertambangan", ["MENENGAH", "BESAR"]],
    ["BS015", "Konstruksi Bangunan Sipil Panas Bumi", ["MENENGAH", "BESAR"]],
    ["BS016", "Konstruksi Bangunan Sipil Fasilitas Olah Raga", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS017", "Konstruksi Bangunan Sipil Lainnya Ytdl", ["KECIL", "MENENGAH", "BESAR"]],
    ["BS018", "Konstruksi Bangunan Sipil Fasilitas Pengolahan Produk Kimia, Petrokimia, Farmasi, dan Industri Lainnya", ["MENENGAH", "BESAR"]],
    ["BS019", "Konstruksi Bangunan Sipil Fasilitas Militer dan Peluncuran Satelit", ["MENENGAH", "BESAR"]],
    ["BS020", "Konstruksi Jaringan Irigasi, Komunikasi, dan Limbah Lainnya", ["KECIL", "MENENGAH", "BESAR"]],
  ]),
  ...specialist("IN", [["IN001", "Instalasi Mekanikal"], ["IN002", "Instalasi Telekomunikasi"], ["IN003", "Instalasi Peralatan Infrastruktur Pertambangan dan Manufaktur"], ["IN004", "Instalasi Minyak dan Gas"], ["IN005", "Instalasi Konstruksi Navigasi Laut, Sungai, dan Udara"], ["IN006", "Instalasi Elektronika"], ["IN007", "Instalasi Saluran Air (Plambing)"], ["IN008", "Instalasi Pendingin dan Ventilasi Udara"], ["IN010", "Instalasi Pengolahan Air untuk Pembangkit Listrik"]]),
  ...specialist("KK", [["KK001", "Pondasi Konstruksi"], ["KK002", "Konstruksi Reservoir Pembangkit Listrik Tenaga Air"], ["KK003", "Konstruksi Intake, Control Gate, Penstock dan Outflow Pembangkit Listrik Tenaga Air"], ["KK004", "Konstruksi Pelindung Pantai"], ["KK005", "Pekerjaan Lapis Perkerasan Beton (Rigid Pavement)"], ["KK006", "Pekerjaan Konstruksi Kedap Air, Minyak, dan Gas"], ["KK007", "Pekerjaan Konstruksi Kedap Suara"], ["KK008", "Perkerasan Aspal"], ["KK009", "Perkerasan Berbutir"], ["KK010", "Pengeboran dan Injeksi Semen Bertekanan (Drilling and Grouting)"], ["KK011", "Pemasangan Rangka dan Atap/Roofcovering"], ["KK012", "Pekerjaan Struktur Beton"], ["KK013", "Konstruksi Struktur Beton Pascatarik (Post Tensioned)"], ["KK014", "Konstruksi Terowongan"], ["KK015", "Pekerjaan Konstruksi Tahan Api (Tanur, Anneling, Flare, atau Incenerator)"], ["KK016", "Pemasangan Kerangka Baja"]]),
  ...specialist("KP", [["KP001", "Pekerjaan Konstruksi Prapabrikasi Bangunan Gedung"], ["KP002", "Pekerjaan Konstruksi Prapabrikasi Bangunan Sipil"]]),
  ...specialist("PA", [["PA001", "Penyewaan Peralatan Konstruksi"]]),
  ...specialist("PB", [["PB001", "Pengerjaan Pemasangan Kaca dan Alumunium"], ["PB003", "Pengerjaan Lantai, Dinding, Peralatan Saniter dan Plafon"], ["PB004", "Dekorasi Interior"], ["PB005", "Pemasangan Ornamen dan Pekerjaan Seni"], ["PB007", "Pengecatan"], ["PB009", "Pembersihan dan Perapihan Bangunan Gedung dan/atau Bangunan Sipil"], ["PB010", "Pekerjaan Lanskap, Pertamanan, dan Penanaman Vegetasi"], ["PB011", "Pemulihan Lahan Pekerjaan Konstruksi"]]),
  ...specialist("PL", [["PL001", "Pembongkaran Bangunan"], ["PL002", "Pengerukan"], ["PL003", "Penyiapan Lahan Konstruksi"], ["PL004", "Pekerjaan Tanah"], ["PL005", "Pembuatan/Pengeboran Sumur Air Tanah"], ["PL006", "Pelaksanaan Pekerjaan Utilitas"], ["PL007", "Survei Penyelidikan Lapangan"], ["PL008", "Pemasangan Perancah (Steiger)"]]),
];
