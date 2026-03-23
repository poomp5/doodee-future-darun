import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * Recommendation Engine for Doodee Future
 *
 * Scoring Algorithm:
 * - Interest Match: High intensity interests (8-10) = 10 points, Medium (5-7) = 7 points, Low (1-4) = 3 points
 * - Skill Match: Expert/Advanced = 8 points, Intermediate = 5 points, Beginner = 3 points
 * - Career Goal Match: Primary goal = 15 points, Backup goal = 10 points, Industry match = 7 points
 * - Achievement Type Match: Same category = 5 points
 * - Viewed History: Previously viewed = -20 points (to show new content)
 * - Recency Boost: Upcoming events get +5 points
 * - Price Preference: Free activities = +3 points if user prefers free
 */

interface ScoredItem {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  subcategory: string | null;
  price: any;
  start_date?: any;
  deadline?: any;
  link_url: string | null;
  score: number;
  matchReasons: string[];
  type: 'activity' | 'course';
}

// Helper to serialize Decimal and Date fields
function serializeItem(item: any): any {
  return {
    ...item,
    price: item.price ? Number(item.price) : 0,
    start_date: item.start_date ? item.start_date.toISOString() : null,
    end_date: item.end_date ? item.end_date.toISOString() : null,
    deadline: item.deadline ? item.deadline.toISOString() : null,
  };
}

async function calculateRecommendationScore(
  item: any,
  itemTags: string[],
  userProfile: any,
  type: 'activity' | 'course'
): Promise<{ score: number; reasons: string[] }> {
  let score = 0;
  const reasons: string[] = [];

  // Normalize tags to lowercase for case-insensitive matching
  const normalizedItemTags = itemTags.map(t => t.toLowerCase().trim());

  // 1. Interest Match (0-10 points per match)
  if (userProfile.interests && userProfile.interests.length > 0) {
    userProfile.interests.forEach((interest: any) => {
      const interestName = interest.interest_name.toLowerCase();
      const matchingTags = normalizedItemTags.filter(tag =>
        tag.includes(interestName) || interestName.includes(tag)
      );

      if (matchingTags.length > 0) {
        const intensityLevel = interest.intensity_level || 5;
        if (intensityLevel >= 8) {
          score += 10;
          reasons.push(`ตรงกับความสนใจสูง: ${interest.interest_name}`);
        } else if (intensityLevel >= 5) {
          score += 7;
          reasons.push(`ตรงกับความสนใจ: ${interest.interest_name}`);
        } else {
          score += 3;
          reasons.push(`เกี่ยวข้องกับความสนใจ: ${interest.interest_name}`);
        }
      }
    });
  }

  // 2. Skill Match (0-8 points per match)
  if (userProfile.skills && userProfile.skills.length > 0) {
    userProfile.skills.forEach((skill: any) => {
      const skillName = skill.skill_name.toLowerCase();
      const matchingTags = normalizedItemTags.filter(tag =>
        tag.includes(skillName) || skillName.includes(tag)
      );

      if (matchingTags.length > 0) {
        const proficiency = skill.proficiency_level;
        if (proficiency === 'expert' || proficiency === 'advanced') {
          score += 8;
          reasons.push(`เหมาะกับทักษะขั้นสูง: ${skill.skill_name}`);
        } else if (proficiency === 'intermediate') {
          score += 5;
          reasons.push(`ต่อยอดทักษะ: ${skill.skill_name}`);
        } else {
          score += 3;
          reasons.push(`เรียนรู้ทักษะ: ${skill.skill_name}`);
        }
      }
    });
  }

  // 3. Career Goal Match (0-15 points)
  if (userProfile.careerGoals && userProfile.careerGoals.length > 0) {
    userProfile.careerGoals.forEach((goal: any) => {
      const primaryGoal = goal.primary_goal?.toLowerCase() || '';
      const backupGoals = goal.backup_goals || [];
      const targetIndustry = goal.target_industry?.toLowerCase() || '';

      // Check primary goal
      if (primaryGoal && normalizedItemTags.some(tag =>
        primaryGoal.includes(tag) || tag.includes(primaryGoal.split(' ')[0])
      )) {
        score += 15;
        reasons.push(`สอดคล้องกับเป้าหมายหลัก`);
      }

      // Check backup goals
      else if (Array.isArray(backupGoals)) {
        const matchingBackup = backupGoals.find((bg: string) =>
          normalizedItemTags.some(tag =>
            bg.toLowerCase().includes(tag) || tag.includes(bg.toLowerCase().split(' ')[0])
          )
        );
        if (matchingBackup) {
          score += 10;
          reasons.push(`สอดคล้องกับเป้าหมายสำรอง`);
        }
      }

      // Check industry
      if (targetIndustry && normalizedItemTags.some(tag =>
        targetIndustry.includes(tag) || tag.includes(targetIndustry)
      )) {
        score += 7;
        reasons.push(`ตรงกับอุตสาหกรรมเป้าหมาย`);
      }
    });
  }

  // 4. Achievement Type Match (0-5 points)
  if (userProfile.achievements && userProfile.achievements.length > 0) {
    const achievementTypes = userProfile.achievements.map((a: any) =>
      a.achievement_type?.toLowerCase()
    );
    const matchingTypes = normalizedItemTags.filter(tag =>
      achievementTypes.includes(tag)
    );
    if (matchingTypes.length > 0) {
      score += 5;
      reasons.push(`ตรงกับประเภทผลงานที่มี`);
    }
  }

  // 5. Viewed History Penalty (-20 points)
  const viewedTable = type === 'activity' ? 'user_viewed_activities' : 'user_viewed_courses';
  const idField = type === 'activity' ? 'activity_id' : 'course_id';
  const viewed = await (prisma as any)[viewedTable].findFirst({
    where: {
      user_id: userProfile.userId,
      [idField]: item.id,
    },
  });
  if (viewed) {
    score -= 20;
    reasons.push(`เคยดูแล้ว (แสดงเนื้อหาใหม่)`);
  }

  // 6. Recency Boost (+5 points)
  if (item.start_date || item.deadline) {
    const targetDate = item.start_date || item.deadline;
    const now = new Date();
    const daysUntil = Math.floor((new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= 60) {
      score += 5;
      reasons.push(`กำลังจะเริ่มเร็วๆ นี้`);
    }
  }

  // 7. Price Preference (+3 points)
  if (userProfile.preferences?.prefer_free && (!item.price || Number(item.price) === 0)) {
    score += 3;
    reasons.push(`ฟรี`);
  }

  // Category Match (general category alignment)
  if (item.category) {
    const categoryLower = item.category.toLowerCase();
    if (userProfile.interests?.some((i: any) =>
      i.interest_category && categoryLower.includes(i.interest_category.toLowerCase())
    )) {
      score += 4;
      reasons.push(`หมวดหมู่ตรงกับความสนใจ`);
    }
  }

  return { score, reasons };
}

// GET /api/recommendations?limit=10&type=both
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'both'; // 'activity', 'course', or 'both'

    // Fetch user profile data
    const [interests, skills, achievements, careerGoals, preferences] = await Promise.all([
      prisma.user_interests.findMany({
        where: { user_id: session.user.id },
        orderBy: { intensity_level: 'desc' },
      }),
      prisma.user_skills.findMany({
        where: { user_id: session.user.id },
      }),
      prisma.user_achievements.findMany({
        where: { user_id: session.user.id },
      }),
      prisma.user_career_goals.findMany({
        where: { user_id: session.user.id },
      }),
      prisma.user_recommendation_preferences.findUnique({
        where: { user_id: session.user.id },
      }),
    ]);

    const userProfile = {
      userId: session.user.id,
      interests,
      skills,
      achievements,
      careerGoals,
      preferences,
    };

    const scoredItems: ScoredItem[] = [];

    // Fetch and score activities
    if (type === 'activity' || type === 'both') {
      const activities = await prisma.activities.findMany({
        where: { is_active: true },
        include: {
          activity_tags: true,
        },
        take: 100, // Fetch more to score and then filter
      });

      for (const activity of activities) {
        const tags = activity.activity_tags.map(t => t.tag_name);
        const { score, reasons } = await calculateRecommendationScore(
          activity,
          tags,
          userProfile,
          'activity'
        );

        if (score > 0) {
          scoredItems.push({
            id: activity.id,
            title: activity.title,
            description: activity.description,
            image_url: activity.image_url,
            category: activity.category,
            subcategory: activity.subcategory,
            price: activity.price,
            start_date: activity.start_date,
            deadline: activity.deadline,
            link_url: activity.link_url,
            score,
            matchReasons: reasons,
            type: 'activity',
          });
        }
      }
    }

    // Fetch and score courses
    if (type === 'course' || type === 'both') {
      const courses = await prisma.courses.findMany({
        where: { is_active: true },
        include: {
          course_tags: true,
        },
        take: 100,
      });

      for (const course of courses) {
        const tags = course.course_tags.map(t => t.tag_name);
        const { score, reasons } = await calculateRecommendationScore(
          course,
          tags,
          userProfile,
          'course'
        );

        if (score > 0) {
          scoredItems.push({
            id: course.id,
            title: course.title,
            description: course.description,
            image_url: course.image_url,
            category: course.category,
            subcategory: course.subcategory,
            price: course.price,
            deadline: course.deadline,
            link_url: course.link_url,
            score,
            matchReasons: reasons,
            type: 'course',
          });
        }
      }
    }

    // Sort by score descending and take top N
    scoredItems.sort((a, b) => b.score - a.score);
    const topRecommendations = scoredItems.slice(0, limit);

    return NextResponse.json({
      data: topRecommendations.map(serializeItem),
      meta: {
        total: scoredItems.length,
        returned: topRecommendations.length,
        hasProfileData: {
          interests: interests.length > 0,
          skills: skills.length > 0,
          achievements: achievements.length > 0,
          careerGoals: careerGoals.length > 0,
        },
      },
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
