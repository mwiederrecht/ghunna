/**
 * Riwāyah/ṭarīq parameter sets. Ḥafṣ ʿan ʿĀṣim via al-Shāṭibiyyah is the
 * shipped default (ASSUMPTIONS A-001). Nothing riwāyah-specific may live in
 * engine logic: only here.
 */

export interface SaktSite {
  surah: number;
  ayah: number;
  /** sakt occurs after this word index (0-based) of the verse. */
  afterWord: number;
}

/** The four transmitted sakt sites of Ḥafṣ/Shāṭibiyyah (ASSUMPTIONS A-006). */
export const HAFS_SAKT_SITES: readonly SaktSite[] = [
  { surah: 18, ayah: 1, afterWord: 14 }, // عِوَجَا ۜ (verse-final; blocks nothing in-verse)
  { surah: 36, ayah: 52, afterWord: 5 }, // مَرْقَدِنَا ۜ هَٰذَا
  { surah: 75, ayah: 27, afterWord: 1 }, // مَنْ ۜ رَاقٍ
  { surah: 83, ayah: 14, afterWord: 1 }, // بَلْ ۜ رَانَ
];

export interface RiwayahParams {
  id: string;
  name: { arabic: string; english: string };
  /** madd lengths in counts (ḥarakāt) */
  maddMunfasil: number;
  maddMuttasil: number;
  maddLazim: number;
  saktSites: readonly SaktSite[];
}

export const HAFS_SHATIBIYYAH: RiwayahParams = {
  id: "hafs-shatibiyyah",
  name: { arabic: "حفص عن عاصم من طريق الشاطبية", english: "Ḥafṣ ʿan ʿĀṣim (al-Shāṭibiyyah)" },
  maddMunfasil: 4,
  maddMuttasil: 4,
  maddLazim: 6,
  saktSites: HAFS_SAKT_SITES,
};
