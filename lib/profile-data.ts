import { prisma } from '@/lib/prisma';
import { cache } from 'react';

// Utility to convert BigInt/Decimal fields so JSON serialization works
export function serializeData(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object' && typeof value.toJSON === 'function') {
    const jsonValue = value.toJSON();
    return serializeData(jsonValue);
  }
  if (Array.isArray(value)) return value.map(serializeData);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeData(val)])
    );
  }
  return value;
}

// Cached data fetching functions using React cache()
// These are automatically deduplicated within a single request

export const getUser = cache(async (userId: string) => {
  const user = await prisma.users.findUnique({
    where: { id: userId }
  });
  return serializeData(user);
});

export const getTodos = cache(async (userId: string) => {
  const todos = await prisma.user_todos.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return serializeData(todos);
});

export const getPurchases = cache(async (userId: string) => {
  const purchases = await prisma.portfolio_purchases.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return serializeData(purchases);
});

export const getInterestedFaculties = cache(async (userId: string) => {
  const faculties = await prisma.$queryRaw`
    SELECT
      uip.id,
      uip.user_id,
      uip.program_id,
      uip.priority,
      uip.created_at,
      p.university_id,
      p.university_name_th,
      p.university_name_en,
      p.faculty_name_th,
      p.faculty_name_en,
      p.field_name_th,
      p.field_name_en,
      p.program_name_th,
      p.program_name_en,
      p.logo_url,
      p.major_acceptance_number as program_total_seats,
      p.number_acceptance_mko2 as r1_admission_quota,
      u.file_path_1,
      u.file_path_2,
      u.file_path_3,
      u.file_path_4
    FROM user_interested_programs uip
    LEFT JOIN programs p ON uip.program_id = p.id
    LEFT JOIN universities u ON p.university_id = u.university_id
    WHERE uip.user_id = ${userId}
    ORDER BY uip.priority ASC
  `;
  return serializeData(faculties);
});

export const getPortfolioUploads = cache(async (userId: string) => {
  const uploads = await prisma.portfolio_uploads.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return serializeData(uploads);
});

export const getGpaxEntries = cache(async (userId: string) => {
  const entries = await prisma.user_gpax_entries.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'asc' },
  });
  return serializeData(entries);
});

export const calculateGpax = (gpaxEntries: any[]): number | null => {
  let totalPoints = 0;
  let totalCredits = 0;

  gpaxEntries.forEach((entry) => {
    const gpa = Number(entry.gpa) || 0;
    const credits = Number(entry.credits) || 0;
    totalPoints += gpa * credits;
    totalCredits += credits;
  });

  return totalCredits > 0 ? totalPoints / totalCredits : null;
};

// Enhanced Profile Data Fetchers
export const getEducationHistory = cache(async (userId: string) => {
  const education = await prisma.user_education_history.findMany({
    where: { user_id: userId },
    orderBy: [
      { is_current: 'desc' },
      { end_year: 'desc' },
      { start_year: 'desc' },
    ],
  });
  return serializeData(education);
});

export const getAchievements = cache(async (userId: string) => {
  const achievements = await prisma.user_achievements.findMany({
    where: { user_id: userId },
    orderBy: { date_achieved: 'desc' },
  });
  return serializeData(achievements);
});

export const getSkills = cache(async (userId: string) => {
  const skills = await prisma.user_skills.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return serializeData(skills);
});

export const getInterests = cache(async (userId: string) => {
  const interests = await prisma.user_interests.findMany({
    where: { user_id: userId },
    orderBy: { intensity_level: 'desc' },
  });
  return serializeData(interests);
});

export const getExtracurricular = cache(async (userId: string) => {
  const extracurricular = await prisma.user_extracurricular.findMany({
    where: { user_id: userId },
    orderBy: [
      { is_ongoing: 'desc' },
      { start_date: 'desc' },
    ],
  });
  return serializeData(extracurricular);
});

export const getCareerGoals = cache(async (userId: string) => {
  const careerGoals = await prisma.user_career_goals.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  return serializeData(careerGoals);
});

// Parallel fetch all profile data
export const getProfileData = cache(async (userId: string) => {
  const [
    user,
    todos,
    purchases,
    interestedFaculties,
    portfolioUploads,
    gpaxEntries,
    educationHistory,
    achievements,
    skills,
    interests,
    extracurricular,
    careerGoals,
  ] = await Promise.all([
    getUser(userId),
    getTodos(userId),
    getPurchases(userId),
    getInterestedFaculties(userId),
    getPortfolioUploads(userId),
    getGpaxEntries(userId),
    getEducationHistory(userId),
    getAchievements(userId),
    getSkills(userId),
    getInterests(userId),
    getExtracurricular(userId),
    getCareerGoals(userId),
  ]);

  const gpax = calculateGpax(gpaxEntries);

  return {
    user,
    todos,
    purchases,
    interestedFaculties: Array.isArray(interestedFaculties) ? interestedFaculties : [],
    portfolioUploads,
    gpax,
    educationHistory,
    achievements,
    skills,
    interests,
    extracurricular,
    careerGoals,
  };
});

export type ProfileData = Awaited<ReturnType<typeof getProfileData>>;
