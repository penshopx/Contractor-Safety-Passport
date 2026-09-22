export type ConstructionQualification = "KECIL" | "MENENGAH" | "BESAR";

const qualificationRank: Record<ConstructionQualification, number> = {
  KECIL: 1,
  MENENGAH: 2,
  BESAR: 3,
};

export const qualificationSatisfies = (
  actual: string | null,
  required: string | null,
) => {
  if (!required) return true;
  if (!actual) return false;
  if (!(actual in qualificationRank) || !(required in qualificationRank)) return false;
  return qualificationRank[actual as ConstructionQualification]
    >= qualificationRank[required as ConstructionQualification];
};