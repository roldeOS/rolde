/**
 * The letter lexicon — which feed entry types ARE letters, and their proper
 * titles. Shared by the PDF builder, the Courier send engine and the feed UI;
 * kept dependency-free so server actions never drag the PDF renderer along.
 */
export const LETTER_TITLES: Record<string, string> = {
  referral_letter: "Referral Letter",
  discharge_summary: "Discharge Summary",
  sick_note: "Sick Note",
  gp_letter: "GP Letter",
};

export const isLetterKind = (entryType: string): boolean => entryType in LETTER_TITLES;
