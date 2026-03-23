import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  deduplicateEducation,
  deduplicateAchievements,
  deduplicateSkills,
  deduplicateInterests,
  deduplicateExtracurricular,
  deduplicateCareerGoals,
  filterExistingEducation,
  filterExistingAchievements,
  filterExistingSkills,
  filterExistingInterests,
  filterExistingExtracurricular,
  filterExistingCareerGoals,
} from '@/lib/deduplication';

/**
 * AI Portfolio Data Extraction
 * POST /api/profile/ai-extract
 *
 * Extracts profile data from uploaded portfolio files using AI
 * Uses OCR + Typhoon/DeepSeek AI (via /api/deepseek endpoint)
 * Labels extracted data as 'ai_extracted' for user verification
 */

// Helper to serialize BigInt
function serializeData(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(serializeData);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeData(val)])
    );
  }
  return value;
}

interface ExtractedData {
  education: any[];
  achievements: any[];
  skills: any[];
  interests: any[];
  extracurricular: any[];
  careerGoals: any[];
}

async function extractDataFromPortfolio(
  fileUrl: string,
  fileName: string,
  extractedText: string
): Promise<ExtractedData> {
  try {
    // If no OCR text extracted, return empty
    if (!extractedText || extractedText.trim().length < 10) {
      console.log('No sufficient text extracted from:', fileName);
      return {
        education: [],
        achievements: [],
        skills: [],
        interests: [],
        extracurricular: [],
        careerGoals: [],
      };
    }

    // Create detailed prompt for AI to extract structured data
    const prompt = `
คุณเป็นผู้เชี่ยวชาญในการแยกข้อมูลโปรไฟล์จากพอร์ตโฟลิโอของนักเรียน

กรุณาอ่านข้อความต่อไปนี้และสกัดข้อมูลที่เป็นโครงสร้าง:

ข้อความจากพอร์ตโฟลิโอ:
"""
${extractedText.substring(0, 4000)}
"""

กรุณาสกัดข้อมูลต่อไปนี้และตอบในรูปแบบ JSON เท่านั้น (ไม่ต้องมี markdown, ไม่ต้องมี code blocks):

{
  "education": [
    {
      "school_name": "ชื่อโรงเรียน/มหาวิทยาลัย",
      "school_type": "primary|secondary|high_school|university",
      "start_year": 2020,
      "end_year": 2024,
      "major": "สาขาวิชา (ถ้ามี)",
      "location": "จังหวัด/ประเทศ"
    }
  ],
  "achievements": [
    {
      "title": "ชื่อรางวัล/ผลงาน",
      "achievement_type": "academic|competition|sports|arts|leadership|community_service|certification",
      "description": "รายละเอียด",
      "organization": "หน่วยงานที่จัด",
      "achievement_level": "school|regional|national|international",
      "date_achieved": "2024-01-15"
    }
  ],
  "skills": [
    {
      "skill_name": "ชื่อทักษะ",
      "skill_category": "technical|language|soft_skill|creative|research",
      "proficiency_level": "beginner|intermediate|advanced|expert"
    }
  ],
  "interests": [
    {
      "interest_name": "ความสนใจ",
      "interest_category": "subject_area|career_field|hobby|industry",
      "intensity_level": 7,
      "description": "เหตุผลที่สนใจ"
    }
  ],
  "extracurricular": [
    {
      "activity_name": "ชื่อกิจกรรม",
      "activity_type": "club|volunteer|sports|arts|leadership|research",
      "role": "บทบาท เช่น สมาชิก, หัวหน้า",
      "organization": "สถาบัน/องค์กร",
      "description": "รายละเอียด",
      "is_ongoing": false
    }
  ],
  "careerGoals": [
    {
      "primary_goal": "เป้าหมายหลัก",
      "backup_goals": ["เป้าหมายสำรอง 1", "เป้าหมายสำรอง 2"],
      "target_universities": ["มหาวิทยาลัยเป้าหมาย 1", "มหาวิทยาลัยเป้าหมาย 2"],
      "target_programs": ["สาขาที่สนใจ 1", "สาขาที่สนใจ 2"],
      "target_industry": "อุตสาหกรรมเป้าหมาย",
      "motivation": "แรงบันดาลใจ"
    }
  ]
}

หมายเหตุ:
- ถ้าไม่พบข้อมูลในหมวดใด ให้ใส่ [] (array ว่าง)
- ถ้าข้อมูลไม่ครบ ให้ใส่ null
- intensity_level ให้คะแนนจาก 1-10
- ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม
`;

    // Call the AI API endpoint (Typhoon/DeepSeek)
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/deepseek`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData?.result?.choices?.[0]?.message?.content || '{}';

    // Clean the response - remove markdown code blocks if present
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/```\n?/g, '');
    }

    // Parse JSON
    const extracted = JSON.parse(cleanContent);

    return {
      education: extracted.education || [],
      achievements: extracted.achievements || [],
      skills: extracted.skills || [],
      interests: extracted.interests || [],
      extracurricular: extracted.extracurricular || [],
      careerGoals: extracted.careerGoals || [],
    };
  } catch (error) {
    console.error('Error extracting data from portfolio:', error);
    // Return empty data on error
    return {
      education: [],
      achievements: [],
      skills: [],
      interests: [],
      extracurricular: [],
      careerGoals: [],
    };
  }
}

/**
 * Deduplicate extracted data from multiple portfolios
 * 1. Remove duplicates within newly extracted data
 * 2. Filter out entries that already exist in the database
 */
async function deduplicateExtractedData(
  userId: string,
  extractedData: ExtractedData
): Promise<{
  deduplicated: ExtractedData;
  stats: {
    totalExtracted: number;
    duplicatesRemoved: number;
    breakdown: {
      education: { extracted: number; duplicates: number; new: number };
      achievements: { extracted: number; duplicates: number; new: number };
      skills: { extracted: number; duplicates: number; new: number };
      interests: { extracted: number; duplicates: number; new: number };
      extracurricular: { extracted: number; duplicates: number; new: number };
      careerGoals: { extracted: number; duplicates: number; new: number };
    };
  };
}> {
  // Step 1: Deduplicate within extracted data (from multiple portfolios)
  const internallyDeduplicated = {
    education: deduplicateEducation(extractedData.education),
    achievements: deduplicateAchievements(extractedData.achievements),
    skills: deduplicateSkills(extractedData.skills),
    interests: deduplicateInterests(extractedData.interests),
    extracurricular: deduplicateExtracurricular(extractedData.extracurricular),
    careerGoals: deduplicateCareerGoals(extractedData.careerGoals),
  };

  // Step 2: Fetch existing user data from database
  const [
    existingEducationRaw,
    existingAchievementsRaw,
    existingSkillsRaw,
    existingInterestsRaw,
    existingExtracurricularRaw,
    existingCareerGoalsRaw,
  ] = await Promise.all([
    prisma.user_education_history.findMany({ where: { user_id: userId } }),
    prisma.user_achievements.findMany({ where: { user_id: userId } }),
    prisma.user_skills.findMany({ where: { user_id: userId } }),
    prisma.user_interests.findMany({ where: { user_id: userId } }),
    prisma.user_extracurricular.findMany({ where: { user_id: userId } }),
    prisma.user_career_goals.findMany({ where: { user_id: userId } }),
  ]);

  // Map Prisma data to deduplication interfaces (only include fields needed for matching)
  const existingEducation = existingEducationRaw.map(e => ({
    school_name: e.school_name,
    school_type: e.school_type,
    start_year: e.start_year,
    end_year: e.end_year,
    is_current: e.is_current,
    location: e.location,
    major: e.major,
    honors_awards: Array.isArray(e.honors_awards) ? (e.honors_awards as string[]) : [],
  }));

  const existingAchievements = existingAchievementsRaw.map(a => ({
    title: a.title,
    achievement_type: a.achievement_type,
    description: a.description,
    organization: a.organization,
    date_achieved: a.date_achieved,
    achievement_level: a.achievement_level,
    evidence_urls: Array.isArray(a.evidence_urls) ? (a.evidence_urls as string[]) : [],
    skills_gained: Array.isArray(a.skills_gained) ? (a.skills_gained as string[]) : [],
  }));

  const existingSkills = existingSkillsRaw.map(s => ({
    skill_name: s.skill_name,
    skill_category: s.skill_category,
    proficiency_level: s.proficiency_level || 'intermediate',
    verified_by: s.verified_by || 'self',
    years_of_experience: s.years_of_experience,
  }));

  const existingInterests = existingInterestsRaw.map(i => ({
    interest_name: i.interest_name,
    interest_category: i.interest_category || 'general',
    intensity_level: i.intensity_level || 5,
    description: i.description,
  }));

  const existingExtracurricular = existingExtracurricularRaw.map(e => ({
    activity_name: e.activity_name,
    activity_type: e.activity_type,
    role: e.role,
    organization: e.organization,
    start_date: e.start_date,
    end_date: e.end_date,
    is_ongoing: e.is_ongoing,
    description: e.description,
    achievements: Array.isArray(e.achievements) ? (e.achievements as string[]) : [],
  }));

  const existingCareerGoals = existingCareerGoalsRaw.map(c => ({
    primary_goal: c.primary_goal,
    backup_goals: c.backup_goals as string[] | null,
    target_universities: c.target_universities as string[] | null,
    target_programs: c.target_programs as string[] | null,
    target_industry: c.target_industry,
    motivation: c.motivation,
  }));

  // Step 3: Filter out entries that already exist in database
  const finalDeduplicated = {
    education: filterExistingEducation(internallyDeduplicated.education, existingEducation),
    achievements: filterExistingAchievements(internallyDeduplicated.achievements, existingAchievements),
    skills: filterExistingSkills(internallyDeduplicated.skills, existingSkills),
    interests: filterExistingInterests(internallyDeduplicated.interests, existingInterests),
    extracurricular: filterExistingExtracurricular(internallyDeduplicated.extracurricular, existingExtracurricular),
    careerGoals: filterExistingCareerGoals(internallyDeduplicated.careerGoals, existingCareerGoals),
  };

  // Calculate statistics
  const totalExtracted =
    extractedData.education.length +
    extractedData.achievements.length +
    extractedData.skills.length +
    extractedData.interests.length +
    extractedData.extracurricular.length +
    extractedData.careerGoals.length;

  const totalNew =
    finalDeduplicated.education.length +
    finalDeduplicated.achievements.length +
    finalDeduplicated.skills.length +
    finalDeduplicated.interests.length +
    finalDeduplicated.extracurricular.length +
    finalDeduplicated.careerGoals.length;

  const duplicatesRemoved = totalExtracted - totalNew;

  return {
    deduplicated: finalDeduplicated,
    stats: {
      totalExtracted,
      duplicatesRemoved,
      breakdown: {
        education: {
          extracted: extractedData.education.length,
          duplicates: extractedData.education.length - finalDeduplicated.education.length,
          new: finalDeduplicated.education.length,
        },
        achievements: {
          extracted: extractedData.achievements.length,
          duplicates: extractedData.achievements.length - finalDeduplicated.achievements.length,
          new: finalDeduplicated.achievements.length,
        },
        skills: {
          extracted: extractedData.skills.length,
          duplicates: extractedData.skills.length - finalDeduplicated.skills.length,
          new: finalDeduplicated.skills.length,
        },
        interests: {
          extracted: extractedData.interests.length,
          duplicates: extractedData.interests.length - finalDeduplicated.interests.length,
          new: finalDeduplicated.interests.length,
        },
        extracurricular: {
          extracted: extractedData.extracurricular.length,
          duplicates: extractedData.extracurricular.length - finalDeduplicated.extracurricular.length,
          new: finalDeduplicated.extracurricular.length,
        },
        careerGoals: {
          extracted: extractedData.careerGoals.length,
          duplicates: extractedData.careerGoals.length - finalDeduplicated.careerGoals.length,
          new: finalDeduplicated.careerGoals.length,
        },
      },
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if AI API keys are configured
    if (!process.env.TYPHOON_API_KEY && !process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'AI API keys not configured' },
        { status: 500 }
      );
    }

    // Check if OCR text is provided from client
    const body = await request.json().catch(() => ({}));
    const portfoliosWithOCR = body.portfolios as Array<{
      id: string;
      name: string;
      ocrText: string;
    }> | undefined;

    // If OCR text is provided from client, use it
    if (portfoliosWithOCR && portfoliosWithOCR.length > 0) {
      const allExtractedData: ExtractedData = {
        education: [],
        achievements: [],
        skills: [],
        interests: [],
        extracurricular: [],
        careerGoals: [],
      };

      for (const portfolio of portfoliosWithOCR) {
        if (portfolio.ocrText && portfolio.ocrText.length > 10) {
          const extracted = await extractDataFromPortfolio(
            '',
            portfolio.name,
            portfolio.ocrText
          );

          // Merge extracted data
          allExtractedData.education.push(...extracted.education);
          allExtractedData.achievements.push(...extracted.achievements);
          allExtractedData.skills.push(...extracted.skills);
          allExtractedData.interests.push(...extracted.interests);
          allExtractedData.extracurricular.push(...extracted.extracurricular);
          allExtractedData.careerGoals.push(...extracted.careerGoals);
        }
      }

      // Deduplicate the extracted data
      const { deduplicated, stats: dedupeStats } = await deduplicateExtractedData(
        session.user.id,
        allExtractedData
      );

      // Continue with rest of the processing...
      return await processExtractedData(
        session.user.id,
        deduplicated,
        portfoliosWithOCR.length,
        dedupeStats
      );
    }

    // Fallback: Fetch user's portfolio uploads and check metadata
    const portfolios = await prisma.portfolio_uploads.findMany({
      where: {
        user_id: session.user.id,
        status: 'completed',
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    if (portfolios.length === 0) {
      return NextResponse.json(
        {
          error: 'No portfolio files found. Please upload a portfolio first.',
          portfolios: [] // Return empty array for client to process
        },
        { status: 200 } // Changed to 200 so client can handle it
      );
    }

    // Return portfolios list for client-side OCR processing
    return NextResponse.json({
      needsOCR: true,
      portfolios: portfolios.map(p => ({
        id: p.id,
        name: p.portfolio_name,
        url: p.file_url,
        type: p.file_type,
      })),
    });
  } catch (error) {
    console.error('Error in AI extraction:', error);
    return NextResponse.json(
      { error: 'Failed to extract portfolio data' },
      { status: 500 }
    );
  }
}

// Helper function to process extracted data and save to database
async function processExtractedData(
  userId: string,
  allExtractedData: ExtractedData,
  filesProcessed: number,
  dedupeStats?: any
) {

    // Calculate total items after deduplication
    const totalExtracted =
      allExtractedData.education.length +
      allExtractedData.achievements.length +
      allExtractedData.skills.length +
      allExtractedData.interests.length +
      allExtractedData.extracurricular.length +
      allExtractedData.careerGoals.length;

    if (totalExtracted === 0) {
      return NextResponse.json({
        success: true,
        message: 'No data could be extracted from your portfolio files. The files may not contain recognizable profile information.',
        extracted: allExtractedData,
        stats: {
          filesProcessed: filesProcessed,
          itemsExtracted: dedupeStats?.totalExtracted || 0,
          duplicatesRemoved: dedupeStats?.duplicatesRemoved || 0,
          itemsCreated: 0,
        },
      });
    }

    // Save extracted data to database with data_source = 'ai_extracted'
    const results = {
      education: [],
      achievements: [],
      skills: [],
      interests: [],
      extracurricular: [],
      careerGoals: [],
    };

    // Insert education entries
    for (const edu of allExtractedData.education) {
      try {
        const created = await prisma.user_education_history.create({
          data: {
            user_id: userId,
            school_name: edu.school_name,
            school_type: edu.school_type || null,
            start_year: edu.start_year || null,
            end_year: edu.end_year || null,
            is_current: edu.is_current || false,
            location: edu.location || null,
            major: edu.major || null,
            honors_awards: edu.honors_awards || null,
            data_source: 'ai_extracted',
          },
        });
        results.education.push(serializeData(created));
      } catch (error) {
        console.error('Error creating education entry:', error);
      }
    }

    // Insert achievements
    for (const achievement of allExtractedData.achievements) {
      try {
        const created = await prisma.user_achievements.create({
          data: {
            user_id: userId,
            title: achievement.title,
            achievement_type: achievement.achievement_type || 'academic',
            description: achievement.description || null,
            organization: achievement.organization || null,
            date_achieved: achievement.date_achieved ? new Date(achievement.date_achieved) : null,
            achievement_level: achievement.achievement_level || null,
            evidence_urls: achievement.evidence_urls || null,
            skills_gained: achievement.skills_gained || null,
            data_source: 'ai_extracted',
          },
        });
        results.achievements.push(serializeData(created));
      } catch (error) {
        console.error('Error creating achievement entry:', error);
      }
    }

    // Insert skills
    for (const skill of allExtractedData.skills) {
      try {
        const created = await prisma.user_skills.create({
          data: {
            user_id: userId,
            skill_name: skill.skill_name,
            skill_category: skill.skill_category || null,
            proficiency_level: skill.proficiency_level || 'intermediate',
            verified_by: 'self',
            years_of_experience: skill.years_of_experience || null,
            data_source: 'ai_extracted',
          },
        });
        results.skills.push(serializeData(created));
      } catch (error) {
        console.error('Error creating skill entry:', error);
      }
    }

    // Insert interests
    for (const interest of allExtractedData.interests) {
      try {
        const created = await prisma.user_interests.create({
          data: {
            user_id: userId,
            interest_name: interest.interest_name,
            interest_category: interest.interest_category || 'subject_area',
            intensity_level: interest.intensity_level || 5,
            description: interest.description || null,
            data_source: 'ai_extracted',
          },
        });
        results.interests.push(serializeData(created));
      } catch (error) {
        console.error('Error creating interest entry:', error);
      }
    }

    // Insert extracurricular activities
    for (const activity of allExtractedData.extracurricular) {
      try {
        const created = await prisma.user_extracurricular.create({
          data: {
            user_id: userId,
            activity_name: activity.activity_name,
            activity_type: activity.activity_type || null,
            role: activity.role || null,
            organization: activity.organization || null,
            start_date: activity.start_date ? new Date(activity.start_date) : null,
            end_date: activity.end_date ? new Date(activity.end_date) : null,
            is_ongoing: activity.is_ongoing || false,
            description: activity.description || null,
            data_source: 'ai_extracted',
          },
        });
        results.extracurricular.push(serializeData(created));
      } catch (error) {
        console.error('Error creating extracurricular entry:', error);
      }
    }

    // Insert career goals
    for (const goal of allExtractedData.careerGoals) {
      try {
        const created = await prisma.user_career_goals.create({
          data: {
            user_id: userId,
            primary_goal: goal.primary_goal,
            backup_goals: goal.backup_goals || null,
            target_universities: goal.target_universities || null,
            target_programs: goal.target_programs || null,
            target_industry: goal.target_industry || null,
            motivation: goal.motivation || null,
            data_source: 'ai_extracted',
          },
        });
        results.careerGoals.push(serializeData(created));
      } catch (error) {
        console.error('Error creating career goal entry:', error);
      }
    }

    // Calculate final stats
    const itemsCreated =
      results.education.length +
      results.achievements.length +
      results.skills.length +
      results.interests.length +
      results.extracurricular.length +
      results.careerGoals.length;

  const duplicatesRemoved = dedupeStats?.duplicatesRemoved || 0;
  const successMessage = duplicatesRemoved > 0
    ? `สร้าง ${itemsCreated} รายการสำเร็จ (ตรวจพบข้อมูลซ้ำ ${duplicatesRemoved} รายการและลบออกแล้ว)`
    : `แยกข้อมูลสำเร็จ ${itemsCreated} รายการ!`;

  return NextResponse.json({
    success: true,
    message: successMessage,
    extracted: results,
    stats: {
      filesProcessed: filesProcessed,
      itemsExtracted: dedupeStats?.totalExtracted || totalExtracted,
      duplicatesRemoved: duplicatesRemoved,
      itemsCreated: itemsCreated,
      breakdown: {
        education: results.education.length,
        achievements: results.achievements.length,
        skills: results.skills.length,
        interests: results.interests.length,
        extracurricular: results.extracurricular.length,
        careerGoals: results.careerGoals.length,
      },
    },
  });
}
