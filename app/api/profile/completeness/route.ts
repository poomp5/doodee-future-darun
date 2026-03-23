import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * Profile Completeness Calculator
 *
 * Scoring breakdown (100 points total):
 * - Basic Info (20 points): name, email, bio, profile_image
 * - Education (15 points): at least 1 education entry
 * - Achievements (10 points): at least 1 achievement
 * - Extracurricular (10 points): at least 1 activity
 * - Skills (15 points): at least 3 skills
 * - Interests (10 points): at least 3 interests
 * - Career Goals (10 points): at least 1 career goal
 * - Academic Data (10 points): GPAX and interested programs
 */

interface CompletenessDetails {
  percentage: number;
  breakdown: {
    basicInfo: { score: number; max: number; items: string[] };
    education: { score: number; max: number; count: number };
    achievements: { score: number; max: number; count: number };
    extracurricular: { score: number; max: number; count: number };
    skills: { score: number; max: number; count: number };
    interests: { score: number; max: number; count: number };
    careerGoals: { score: number; max: number; count: number };
    academic: { score: number; max: number; items: string[] };
  };
  missingItems: string[];
  recommendations: string[];
}

async function calculateProfileCompleteness(userId: string): Promise<CompletenessDetails> {
  // Fetch all user data
  const [
    user,
    education,
    achievements,
    extracurricular,
    skills,
    interests,
    careerGoals,
    gpaxEntries,
    interestedPrograms,
  ] = await Promise.all([
    prisma.users.findUnique({ where: { id: userId } }),
    prisma.user_education_history.count({ where: { user_id: userId } }),
    prisma.user_achievements.count({ where: { user_id: userId } }),
    prisma.user_extracurricular.count({ where: { user_id: userId } }),
    prisma.user_skills.count({ where: { user_id: userId } }),
    prisma.user_interests.count({ where: { user_id: userId } }),
    prisma.user_career_goals.count({ where: { user_id: userId } }),
    prisma.user_gpax_entries.count({ where: { user_id: userId } }),
    prisma.user_interested_programs.count({ where: { user_id: userId } }),
  ]);

  if (!user) {
    throw new Error('User not found');
  }

  const breakdown = {
    basicInfo: { score: 0, max: 20, items: [] as string[] },
    education: { score: 0, max: 15, count: education },
    achievements: { score: 0, max: 10, count: achievements },
    extracurricular: { score: 0, max: 10, count: extracurricular },
    skills: { score: 0, max: 15, count: skills },
    interests: { score: 0, max: 10, count: interests },
    careerGoals: { score: 0, max: 10, count: careerGoals },
    academic: { score: 0, max: 10, items: [] as string[] },
  };

  const missingItems: string[] = [];
  const recommendations: string[] = [];

  // Basic Info (20 points)
  if (user.full_name || (user.first_name && user.last_name)) {
    breakdown.basicInfo.score += 5;
    breakdown.basicInfo.items.push('name');
  } else {
    missingItems.push('Complete your name');
  }

  if (user.email) {
    breakdown.basicInfo.score += 5;
    breakdown.basicInfo.items.push('email');
  } else {
    missingItems.push('Add email address');
  }

  if (user.bio && user.bio.length > 20) {
    breakdown.basicInfo.score += 5;
    breakdown.basicInfo.items.push('bio');
  } else {
    missingItems.push('Write a bio (at least 20 characters)');
    recommendations.push('Add a compelling bio to introduce yourself');
  }

  if (user.profile_image_url) {
    breakdown.basicInfo.score += 5;
    breakdown.basicInfo.items.push('profile_image');
  } else {
    missingItems.push('Upload profile picture');
  }

  // Education (15 points)
  if (education >= 1) {
    breakdown.education.score = 15;
  } else {
    missingItems.push('Add at least 1 education entry');
    recommendations.push('Add your current or most recent school');
  }

  // Achievements (10 points)
  if (achievements >= 1) {
    breakdown.achievements.score = 10;
  } else {
    missingItems.push('Add at least 1 achievement');
    recommendations.push('Showcase your awards, competitions, or certifications');
  }

  // Extracurricular (10 points)
  if (extracurricular >= 1) {
    breakdown.extracurricular.score = 10;
  } else {
    missingItems.push('Add at least 1 extracurricular activity');
    recommendations.push('Add clubs, volunteer work, or leadership roles');
  }

  // Skills (15 points)
  if (skills >= 3) {
    breakdown.skills.score = 15;
  } else if (skills >= 1) {
    breakdown.skills.score = 7;
    missingItems.push(`Add ${3 - skills} more skill(s)`);
  } else {
    missingItems.push('Add at least 3 skills');
    recommendations.push('List your technical skills, languages, or soft skills');
  }

  // Interests (10 points)
  if (interests >= 3) {
    breakdown.interests.score = 10;
  } else if (interests >= 1) {
    breakdown.interests.score = 5;
    missingItems.push(`Add ${3 - interests} more interest(s)`);
  } else {
    missingItems.push('Add at least 3 interests');
    recommendations.push('Share your academic interests and career aspirations');
  }

  // Career Goals (10 points)
  if (careerGoals >= 1) {
    breakdown.careerGoals.score = 10;
  } else {
    missingItems.push('Add your career goals');
    recommendations.push('Define your career aspirations and target universities');
  }

  // Academic Data (10 points)
  if (user.gpax && Number(user.gpax) > 0) {
    breakdown.academic.score += 5;
    breakdown.academic.items.push('gpax');
  } else if (gpaxEntries > 0) {
    breakdown.academic.score += 5;
    breakdown.academic.items.push('gpax_entries');
  } else {
    missingItems.push('Add GPAX or GPA entries');
  }

  if (interestedPrograms >= 1) {
    breakdown.academic.score += 5;
    breakdown.academic.items.push('interested_programs');
  } else {
    missingItems.push('Select interested programs/faculties');
    recommendations.push('Browse faculties and add programs you\'re interested in');
  }

  // Calculate total percentage
  const totalScore = Object.values(breakdown).reduce((sum, section) => sum + section.score, 0);
  const percentage = Math.round(totalScore);

  // Add percentage-based recommendations
  if (percentage < 30) {
    recommendations.unshift('Your profile is just getting started. Complete basic info first!');
  } else if (percentage < 60) {
    recommendations.unshift('Good start! Add more details to make your profile stand out.');
  } else if (percentage < 90) {
    recommendations.unshift('Great progress! Just a few more sections to complete.');
  } else if (percentage < 100) {
    recommendations.unshift('Almost there! Complete the remaining items for a perfect profile.');
  }

  return {
    percentage,
    breakdown,
    missingItems,
    recommendations,
  };
}

// GET /api/profile/completeness?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const completeness = await calculateProfileCompleteness(userId);

    // Update user's profile_completeness_percentage
    await prisma.users.update({
      where: { id: userId },
      data: { profile_completeness_percentage: completeness.percentage },
    });

    return NextResponse.json({ data: completeness });
  } catch (error) {
    console.error('Error calculating profile completeness:', error);
    return NextResponse.json({ error: 'Failed to calculate profile completeness' }, { status: 500 });
  }
}

// POST /api/profile/completeness - Recalculate for current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const completeness = await calculateProfileCompleteness(session.user.id);

    // Update user's profile_completeness_percentage
    await prisma.users.update({
      where: { id: session.user.id },
      data: { profile_completeness_percentage: completeness.percentage },
    });

    return NextResponse.json({ data: completeness });
  } catch (error) {
    console.error('Error recalculating profile completeness:', error);
    return NextResponse.json({ error: 'Failed to recalculate profile completeness' }, { status: 500 });
  }
}
