/**
 * Deduplication Utilities for AI-Extracted Profile Data
 *
 * Handles duplicate detection when extracting profile data from multiple portfolios.
 * Uses fuzzy matching to detect similar entries and prevents duplicate database records.
 */

// ============================================================================
// Text Normalization & Fuzzy Matching
// ============================================================================

/**
 * Normalize text for comparison
 * - Lowercase
 * - Trim whitespace
 * - Normalize multiple spaces to single space
 * - Remove special characters
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\u0E00-\u0E7F]/g, ''); // Keep alphanumeric + Thai characters
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  // Levenshtein distance implementation
  const matrix: number[][] = [];

  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

/**
 * Check if two strings are fuzzy matches based on threshold
 */
export function fuzzyMatch(str1: string, str2: string, threshold: number = 0.85): boolean {
  return stringSimilarity(str1, str2) >= threshold;
}

/**
 * Compare dates (year and month only, ignore day)
 */
export function datesMatch(date1: Date | string | null, date2: Date | string | null): boolean {
  if (!date1 || !date2) return false;

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth();
}

// ============================================================================
// Education Deduplication
// ============================================================================

export interface EducationEntry {
  school_name: string;
  school_type?: string | null;
  start_year?: number | null;
  end_year?: number | null;
  is_current?: boolean;
  location?: string | null;
  major?: string | null;
  honors_awards?: string[];
}

export function educationMatch(e1: EducationEntry, e2: EducationEntry): boolean {
  // Must have similar school name
  if (!fuzzyMatch(e1.school_name, e2.school_name, 0.85)) {
    return false;
  }

  // If both have years, compare them
  if (e1.start_year && e2.start_year && e1.end_year && e2.end_year) {
    return e1.start_year === e2.start_year && e1.end_year === e2.end_year;
  }

  // If years missing, consider similar school names as duplicate
  return true;
}

export function deduplicateEducation(entries: EducationEntry[]): EducationEntry[] {
  const unique: EducationEntry[] = [];

  for (const entry of entries) {
    const isDuplicate = unique.some(existing => educationMatch(existing, entry));
    if (!isDuplicate) {
      unique.push(entry);
    }
  }

  return unique;
}

// ============================================================================
// Achievement Deduplication
// ============================================================================

export interface AchievementEntry {
  title: string;
  achievement_type?: string;
  description?: string | null;
  organization?: string | null;
  date_achieved?: Date | string | null;
  achievement_level?: string | null;
  evidence_urls?: string[];
  skills_gained?: string[];
}

export function achievementMatch(a1: AchievementEntry, a2: AchievementEntry): boolean {
  // Must have similar title
  if (!fuzzyMatch(a1.title, a2.title, 0.85)) {
    return false;
  }

  // If both have organization and date, use stricter matching
  if (a1.organization && a2.organization && a1.date_achieved && a2.date_achieved) {
    return fuzzyMatch(a1.organization, a2.organization, 0.85) &&
           datesMatch(a1.date_achieved, a2.date_achieved);
  }

  // If organization matches but no date
  if (a1.organization && a2.organization) {
    return fuzzyMatch(a1.organization, a2.organization, 0.85);
  }

  // Same achievement type with similar title = likely duplicate
  if (a1.achievement_type && a2.achievement_type) {
    return a1.achievement_type === a2.achievement_type;
  }

  return true; // Similar titles without other info = duplicate
}

export function deduplicateAchievements(entries: AchievementEntry[]): AchievementEntry[] {
  const unique: AchievementEntry[] = [];

  for (const entry of entries) {
    const isDuplicate = unique.some(existing => achievementMatch(existing, entry));
    if (!isDuplicate) {
      unique.push(entry);
    }
  }

  return unique;
}

// ============================================================================
// Skill Deduplication
// ============================================================================

export interface SkillEntry {
  skill_name: string;
  skill_category?: string | null;
  proficiency_level?: string;
  verified_by?: string;
  years_of_experience?: number | null;
}

const PROFICIENCY_RANK: Record<string, number> = {
  'beginner': 1,
  'intermediate': 2,
  'advanced': 3,
  'expert': 4,
};

export function skillMatch(s1: SkillEntry, s2: SkillEntry): boolean {
  return fuzzyMatch(s1.skill_name, s2.skill_name, 0.90);
}

export function deduplicateSkills(entries: SkillEntry[]): SkillEntry[] {
  const skillMap = new Map<string, SkillEntry>();

  for (const entry of entries) {
    const normalizedName = normalizeText(entry.skill_name);
    const existing = skillMap.get(normalizedName);

    if (!existing) {
      skillMap.set(normalizedName, entry);
    } else {
      // Keep the one with higher proficiency level
      const existingRank = PROFICIENCY_RANK[existing.proficiency_level || 'intermediate'] || 2;
      const entryRank = PROFICIENCY_RANK[entry.proficiency_level || 'intermediate'] || 2;

      if (entryRank > existingRank) {
        skillMap.set(normalizedName, entry);
      }
    }
  }

  return Array.from(skillMap.values());
}

// ============================================================================
// Interest Deduplication
// ============================================================================

export interface InterestEntry {
  interest_name: string;
  interest_category?: string;
  intensity_level?: number;
  description?: string | null;
}

export function interestMatch(i1: InterestEntry, i2: InterestEntry): boolean {
  return fuzzyMatch(i1.interest_name, i2.interest_name, 0.90);
}

export function deduplicateInterests(entries: InterestEntry[]): InterestEntry[] {
  const interestMap = new Map<string, InterestEntry>();

  for (const entry of entries) {
    const normalizedName = normalizeText(entry.interest_name);
    const existing = interestMap.get(normalizedName);

    if (!existing) {
      interestMap.set(normalizedName, entry);
    } else {
      // Keep the one with higher intensity level
      const existingIntensity = existing.intensity_level || 5;
      const entryIntensity = entry.intensity_level || 5;

      if (entryIntensity > existingIntensity) {
        interestMap.set(normalizedName, entry);
      }
    }
  }

  return Array.from(interestMap.values());
}

// ============================================================================
// Extracurricular Deduplication
// ============================================================================

export interface ExtracurricularEntry {
  activity_name: string;
  activity_type?: string | null;
  role?: string | null;
  organization?: string | null;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
  is_ongoing?: boolean;
  description?: string | null;
  achievements?: string[];
}

export function extracurricularMatch(e1: ExtracurricularEntry, e2: ExtracurricularEntry): boolean {
  // Must have similar activity name
  if (!fuzzyMatch(e1.activity_name, e2.activity_name, 0.85)) {
    return false;
  }

  // If both have organization and start date
  if (e1.organization && e2.organization && e1.start_date && e2.start_date) {
    return fuzzyMatch(e1.organization, e2.organization, 0.85) &&
           datesMatch(e1.start_date, e2.start_date);
  }

  // If organization matches
  if (e1.organization && e2.organization) {
    return fuzzyMatch(e1.organization, e2.organization, 0.85);
  }

  // Similar activity names without other info = duplicate
  return true;
}

export function deduplicateExtracurricular(entries: ExtracurricularEntry[]): ExtracurricularEntry[] {
  const unique: ExtracurricularEntry[] = [];

  for (const entry of entries) {
    const isDuplicate = unique.some(existing => extracurricularMatch(existing, entry));
    if (!isDuplicate) {
      unique.push(entry);
    }
  }

  return unique;
}

// ============================================================================
// Career Goals Deduplication
// ============================================================================

export interface CareerGoalEntry {
  primary_goal: string;
  backup_goals?: string[] | null;
  target_universities?: string[] | null;
  target_programs?: string[] | null;
  target_industry?: string | null;
  motivation?: string | null;
}

export function careerGoalMatch(c1: CareerGoalEntry, c2: CareerGoalEntry): boolean {
  return fuzzyMatch(c1.primary_goal, c2.primary_goal, 0.85);
}

export function deduplicateCareerGoals(entries: CareerGoalEntry[]): CareerGoalEntry[] {
  const unique: CareerGoalEntry[] = [];

  for (const entry of entries) {
    const existing = unique.find(e => careerGoalMatch(e, entry));

    if (!existing) {
      unique.push(entry);
    } else {
      // Merge backup_goals and target_universities arrays
      if (entry.backup_goals && existing.backup_goals) {
        existing.backup_goals = Array.from(new Set([...existing.backup_goals, ...entry.backup_goals]));
      }
      if (entry.target_universities && existing.target_universities) {
        existing.target_universities = Array.from(new Set([...existing.target_universities, ...entry.target_universities]));
      }
      if (entry.target_programs && existing.target_programs) {
        existing.target_programs = Array.from(new Set([...existing.target_programs, ...entry.target_programs]));
      }
    }
  }

  return unique;
}

// ============================================================================
// Database Comparison Functions
// ============================================================================

/**
 * Filter out education entries that already exist in the database
 */
export function filterExistingEducation(
  newEntries: EducationEntry[],
  existingEntries: EducationEntry[]
): EducationEntry[] {
  return newEntries.filter(newEntry => {
    return !existingEntries.some(existing => educationMatch(existing, newEntry));
  });
}

/**
 * Filter out achievement entries that already exist in the database
 */
export function filterExistingAchievements(
  newEntries: AchievementEntry[],
  existingEntries: AchievementEntry[]
): AchievementEntry[] {
  return newEntries.filter(newEntry => {
    return !existingEntries.some(existing => achievementMatch(existing, newEntry));
  });
}

/**
 * Filter out skill entries that already exist in the database
 */
export function filterExistingSkills(
  newEntries: SkillEntry[],
  existingEntries: SkillEntry[]
): SkillEntry[] {
  return newEntries.filter(newEntry => {
    return !existingEntries.some(existing => skillMatch(existing, newEntry));
  });
}

/**
 * Filter out interest entries that already exist in the database
 */
export function filterExistingInterests(
  newEntries: InterestEntry[],
  existingEntries: InterestEntry[]
): InterestEntry[] {
  return newEntries.filter(newEntry => {
    return !existingEntries.some(existing => interestMatch(existing, newEntry));
  });
}

/**
 * Filter out extracurricular entries that already exist in the database
 */
export function filterExistingExtracurricular(
  newEntries: ExtracurricularEntry[],
  existingEntries: ExtracurricularEntry[]
): ExtracurricularEntry[] {
  return newEntries.filter(newEntry => {
    return !existingEntries.some(existing => extracurricularMatch(existing, newEntry));
  });
}

/**
 * Filter out career goal entries that already exist in the database
 */
export function filterExistingCareerGoals(
  newEntries: CareerGoalEntry[],
  existingEntries: CareerGoalEntry[]
): CareerGoalEntry[] {
  return newEntries.filter(newEntry => {
    return !existingEntries.some(existing => careerGoalMatch(existing, newEntry));
  });
}
