// Portfolio Analysis Service
export interface PortfolioAnalysisResult {
  overview: string;
  strengths: string[];
  weaknesses: string[];
  recommendedFaculties: {
    faculty: string;
    reason: string;
    matchPercentage: number;
  }[];
  recommendations: string[];
  studentName?: string;
  detectedInterests: string[];
  skillsScore?: {
    [key: string]: number; // skill name: score (0-100)
  };
  analysisMetadata: {
    textLength: number;
    confidenceScore: number;
    processingTime: number;
  };
}

export interface PortfolioAnalysisProgress {
  progress: number;
  status: string;
}

type FacultyRecommendation = PortfolioAnalysisResult['recommendedFaculties'][number];

type SkillRule = {
  skill: string;
  keywords: string[];
  boosters: string[];
  aliases: string[];
};

const SKILL_RULES: SkillRule[] = [
  {
    skill: 'ภาวะผู้นำ',
    keywords: ['หัวหน้า', 'ประธาน', 'leader', 'leadership', 'organizer', 'manage', 'บริหาร'],
    boosters: ['โครงการ', 'ชมรม', 'ค่าย', 'กิจกรรม', 'แข่งขัน', 'award', 'รางวัล'],
    aliases: ['ภาวะผู้นำ', 'ผู้นำ', 'leadership', 'leader'],
  },
  {
    skill: 'การทำงานเป็นทีม',
    keywords: ['ทีม', 'teamwork', 'collaboration', 'ร่วมงาน', 'group', 'อาสา', 'volunteer'],
    boosters: ['กิจกรรม', 'โครงการ', 'ค่าย', 'ชมรม', 'แข่งขัน', 'camp'],
    aliases: ['การทำงานเป็นทีม', 'ทีมเวิร์ก', 'teamwork', 'team'],
  },
  {
    skill: 'ความคิดสร้างสรรค์',
    keywords: ['creative', 'ออกแบบ', 'design', 'ศิลป', 'นวัตกรรม', 'content', 'media'],
    boosters: ['ผลงาน', 'portfolio', 'ประกวด', 'แข่งขัน', 'prototype', 'project'],
    aliases: ['ความคิดสร้างสรรค์', 'คิดสร้างสรรค์', 'creative', 'creativity'],
  },
  {
    skill: 'การแก้ปัญหา',
    keywords: ['problem', 'แก้ปัญหา', 'solution', 'debug', 'วิเคราะห์', 'research', 'ทดลอง'],
    boosters: ['โครงงาน', 'project', 'แข่งขัน', 'hackathon', 'งานวิจัย', 'research'],
    aliases: ['การแก้ปัญหา', 'แก้ปัญหา', 'problem', 'solution'],
  },
  {
    skill: 'การสื่อสาร',
    keywords: ['presentation', 'present', 'สื่อสาร', 'พูด', 'เขียน', 'ภาษา', 'debate', 'public speaking'],
    boosters: ['อบรม', 'เวที', 'แข่งขัน', 'ประกวด', 'report', 'workshop'],
    aliases: ['การสื่อสาร', 'สื่อสาร', 'communication', 'presentation'],
  },
  {
    skill: 'ความรับผิดชอบ',
    keywords: ['รับผิดชอบ', 'สม่ำเสมอ', 'deadline', 'วินัย', 'commitment', 'assistant', 'internship'],
    boosters: ['หัวหน้า', 'โครงการ', 'อาสา', 'ฝึกงาน', 'กิจกรรมต่อเนื่อง', 'achievement'],
    aliases: ['ความรับผิดชอบ', 'รับผิดชอบ', 'responsibility', 'reliable'],
  },
  {
    skill: 'การคิดวิเคราะห์',
    keywords: ['วิเคราะห์', 'analysis', 'data', 'สถิติ', 'คณิต', 'logic', 'critical thinking'],
    boosters: ['โครงงาน', 'วิจัย', 'competition', 'olympiad', 'science fair', 'experiment'],
    aliases: ['การคิดวิเคราะห์', 'คิดวิเคราะห์', 'analysis', 'criticalthinking'],
  },
];

const INTEREST_RULES: Array<{ interest: string; keywords: string[] }> = [
  { interest: 'เทคโนโลยี', keywords: ['computer', 'program', 'coding', 'software', 'ai', 'robot', 'ดิจิทัล', 'เทคโนโลยี'] },
  { interest: 'วิทยาศาสตร์', keywords: ['science', 'laboratory', 'วิทยาศาสตร์', 'ทดลอง', 'research', 'biology', 'chemistry', 'physics'] },
  { interest: 'ธุรกิจ', keywords: ['business', 'marketing', 'finance', 'บริหาร', 'การตลาด', 'บัญชี', 'economics', 'entrepreneur'] },
  { interest: 'การสื่อสาร', keywords: ['communication', 'media', 'นิเทศ', 'ภาษา', 'journalism', 'content', 'presentation'] },
  { interest: 'ศิลปะและการออกแบบ', keywords: ['design', 'ศิลปะ', 'creative', 'animation', 'architecture', 'fashion', 'music'] },
  { interest: 'สุขภาพและการแพทย์', keywords: ['medicine', 'แพทย', 'พยาบาล', 'สุขภาพ', 'pharmacy', 'public health', 'medical'] },
  { interest: 'กฎหมายและสังคม', keywords: ['law', 'นิติ', 'รัฐศาสตร์', 'policy', 'political', 'human rights', 'social'] },
  { interest: 'การศึกษาและจิตวิทยา', keywords: ['education', 'ครู', 'teacher', 'psychology', 'guidance', 'เด็ก', 'learning'] },
  { interest: 'กีฬาและกิจกรรม', keywords: ['sport', 'กีฬา', 'coach', 'fitness', 'athlete', 'competition', 'team'] },
];

const FACULTY_PROFILES: Array<{
  faculty: string;
  keywords: string[];
  relatedInterests: string[];
  requiredSkills: string[];
}> = [
  {
    faculty: 'วิศวกรรมศาสตร์',
    keywords: ['engineering', 'วิศว', 'robot', 'innovation', 'system', 'design'],
    relatedInterests: ['เทคโนโลยี', 'วิทยาศาสตร์'],
    requiredSkills: ['การแก้ปัญหา', 'การคิดวิเคราะห์', 'การทำงานเป็นทีม'],
  },
  {
    faculty: 'วิทยาการคอมพิวเตอร์/ไอที',
    keywords: ['computer', 'software', 'coding', 'programming', 'ai', 'data', 'cyber'],
    relatedInterests: ['เทคโนโลยี', 'วิทยาศาสตร์'],
    requiredSkills: ['การแก้ปัญหา', 'การคิดวิเคราะห์', 'ความรับผิดชอบ'],
  },
  {
    faculty: 'บริหารธุรกิจ',
    keywords: ['business', 'management', 'marketing', 'finance', 'entrepreneur', 'commerce'],
    relatedInterests: ['ธุรกิจ', 'การสื่อสาร'],
    requiredSkills: ['ภาวะผู้นำ', 'การสื่อสาร', 'การคิดวิเคราะห์'],
  },
  {
    faculty: 'นิเทศศาสตร์/วารสารศาสตร์',
    keywords: ['media', 'communication', 'journalism', 'content', 'public relation', 'broadcast'],
    relatedInterests: ['การสื่อสาร', 'ศิลปะและการออกแบบ'],
    requiredSkills: ['การสื่อสาร', 'ความคิดสร้างสรรค์', 'การทำงานเป็นทีม'],
  },
  {
    faculty: 'ศิลปกรรม/ออกแบบ',
    keywords: ['design', 'art', 'creative', 'animation', 'fashion', 'music', 'architecture'],
    relatedInterests: ['ศิลปะและการออกแบบ', 'การสื่อสาร'],
    requiredSkills: ['ความคิดสร้างสรรค์', 'การสื่อสาร', 'ความรับผิดชอบ'],
  },
  {
    faculty: 'วิทยาศาสตร์',
    keywords: ['science', 'research', 'laboratory', 'experiment', 'biology', 'chemistry', 'physics'],
    relatedInterests: ['วิทยาศาสตร์', 'เทคโนโลยี'],
    requiredSkills: ['การคิดวิเคราะห์', 'การแก้ปัญหา', 'ความรับผิดชอบ'],
  },
  {
    faculty: 'แพทยศาสตร์/สาธารณสุข',
    keywords: ['medicine', 'medical', 'nursing', 'public health', 'patient', 'health'],
    relatedInterests: ['สุขภาพและการแพทย์', 'กีฬาและกิจกรรม'],
    requiredSkills: ['ความรับผิดชอบ', 'การทำงานเป็นทีม', 'การสื่อสาร'],
  },
  {
    faculty: 'นิติศาสตร์/รัฐศาสตร์',
    keywords: ['law', 'legal', 'political', 'policy', 'social justice', 'human rights'],
    relatedInterests: ['กฎหมายและสังคม', 'การสื่อสาร'],
    requiredSkills: ['การสื่อสาร', 'การคิดวิเคราะห์', 'ภาวะผู้นำ'],
  },
  {
    faculty: 'ครุศาสตร์/ศึกษาศาสตร์',
    keywords: ['education', 'teacher', 'teaching', 'learning', 'curriculum', 'guidance'],
    relatedInterests: ['การศึกษาและจิตวิทยา', 'กีฬาและกิจกรรม'],
    requiredSkills: ['การสื่อสาร', 'การทำงานเป็นทีม', 'ความรับผิดชอบ'],
  },
];

const RECOMMENDATION_HINTS: Array<{ pattern: RegExp; advice: string }> = [
  {
    pattern: /(รางวัล|แข่งขัน|award|competition)/i,
    advice: 'เพิ่มรายละเอียดเชิงผลลัพธ์ของผลงาน (เช่น บทบาท, วิธีทำ, impact) ให้ชัดเจนในแต่ละกิจกรรม',
  },
  {
    pattern: /(โครงงาน|project|research|วิจัย)/i,
    advice: 'แนบสรุปโครงงานแบบ problem-solution-result เพื่อให้กรรมการเห็นกระบวนการคิดชัดขึ้น',
  },
  {
    pattern: /(อบรม|certificate|certification|คอร์ส)/i,
    advice: 'จัดลำดับ certificate ตามความเกี่ยวข้องกับสาขาที่ต้องการสมัคร เพื่อเพิ่มน้ำหนักการประเมิน',
  },
  {
    pattern: /(อาสา|volunteer|community)/i,
    advice: 'เพิ่มหลักฐานกิจกรรมจิตอาสาและผลลัพธ์ที่วัดได้ เพื่อสะท้อนความรับผิดชอบและการทำงานร่วมกับผู้อื่น',
  },
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\r\n]+/g, ' ')
    .replace(/[_\-()/]/g, ' ')
    .replace(/[^a-z0-9ก-๙\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSkillKey(value: string): string {
  return value.toLowerCase().replace(/[\s_\-()]/g, '');
}

function countKeywordHits(normalizedText: string, keywords: string[]): number {
  const seen = new Set<string>();
  for (const keyword of keywords) {
    const normalizedKeyword = normalizeSearchText(keyword);
    if (!normalizedKeyword) {
      continue;
    }

    if (normalizedText.includes(normalizedKeyword)) {
      seen.add(normalizedKeyword);
    }
  }

  return seen.size;
}

function uniqueStrings(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== 'string') {
      continue;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const normalized = normalizeSearchText(trimmed);
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    output.push(trimmed);
  }

  return output;
}

function sanitizeSkillsScore(rawSkills: any): { [key: string]: number } {
  if (!rawSkills || typeof rawSkills !== 'object' || Array.isArray(rawSkills)) {
    return {};
  }

  const result: { [key: string]: number } = {};
  for (const [key, value] of Object.entries(rawSkills as Record<string, unknown>)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      continue;
    }
    result[key] = clamp(Math.round(numeric));
  }
  return result;
}

export class PortfolioAnalyzer {
  async analyzePortfolio(
    extractedText: string,
    fileName: string,
    confidence: number,
    onProgress?: (progress: PortfolioAnalysisProgress) => void
  ): Promise<PortfolioAnalysisResult> {
    const startTime = Date.now();
    const cleanedText = (extractedText || '').trim();
    const ruleInsights = this.extractRuleBasedInsights(cleanedText);

    try {
      onProgress?.({ progress: 5, status: 'เริ่มต้นการวิเคราะห์...' });

      if (!cleanedText || cleanedText.length < 10) {
        return this.createFallbackResult(
          'ข้อความที่สกัดได้มีความยาวไม่เพียงพอสำหรับการวิเคราะห์',
          cleanedText.length,
          confidence,
          Date.now() - startTime,
          ruleInsights,
        );
      }

      onProgress?.({ progress: 10, status: 'กำลังเตรียมข้อมูล...' });

      // ใช้ข้อความมากขึ้นเพื่อรักษาบริบทจากพอร์ตจริง
      const textLimit = cleanedText.length > 7000 ? 7000 : cleanedText.length;
      const prompt = this.createSimplifiedPrompt(cleanedText.substring(0, textLimit), fileName);

      onProgress?.({ progress: 15, status: 'กำลังส่งข้อมูลไปยัง AI...' });

      let currentProgress = 15;
      const progressInterval = setInterval(() => {
        if (currentProgress < 74) {
          currentProgress += 2;
          const statusMessages = [
            'กำลังวิเคราะห์เนื้อหา...',
            'กำลังวิเคราะห์ทักษะ...',
            'กำลังประเมินความเหมาะสมคณะ...',
            'กำลังสร้างข้อเสนอแนะ...',
          ];
          const statusIndex = Math.floor((currentProgress - 15) / 16);
          onProgress?.({
            progress: currentProgress,
            status: statusMessages[Math.min(statusIndex, statusMessages.length - 1)],
          });
        }
      }, 700);

      let response: Response;
      try {
        response = await fetch('/api/deepseek', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
      } catch (networkError) {
        clearInterval(progressInterval);
        console.error('Network error calling AI API:', networkError);
        return this.createFallbackResult(
          'เกิดข้อผิดพลาดในการเชื่อมต่อกับ AI',
          cleanedText.length,
          confidence,
          Date.now() - startTime,
          ruleInsights,
        );
      }

      clearInterval(progressInterval);
      onProgress?.({ progress: 78, status: 'ได้รับผลการวิเคราะห์แล้ว...' });

      if (!response.ok) {
        const responseText = await response.text();
        console.error(`AI API failed with status ${response.status}:`, responseText);
        return this.createFallbackResult(
          `การเรียก API ล้มเหลว: ${response.status}`,
          cleanedText.length,
          confidence,
          Date.now() - startTime,
          ruleInsights,
        );
      }

      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse API response as JSON:', jsonError);
        return this.createFallbackResult(
          'การตอบสนองจาก API ไม่ถูกต้อง',
          cleanedText.length,
          confidence,
          Date.now() - startTime,
          ruleInsights,
        );
      }

      if (data?.result?.error || data?.error) {
        const errorMsg = data?.result?.error?.message || data?.error || 'Unknown API error';
        console.error('AI API error:', errorMsg);
        return this.createFallbackResult(
          `API Error: ${errorMsg}`,
          cleanedText.length,
          confidence,
          Date.now() - startTime,
          ruleInsights,
        );
      }

      const aiResponse = data?.result?.choices?.[0]?.message?.content ?? '';

      if (!aiResponse || aiResponse.trim().length < 10) {
        return this.createFallbackResult(
          'AI ไม่สามารถสร้างการวิเคราะห์ได้',
          cleanedText.length,
          confidence,
          Date.now() - startTime,
          ruleInsights,
        );
      }

      onProgress?.({ progress: 84, status: 'กำลังประมวลผลผลลัพธ์...' });

      const analysisResult = this.parseAIResponse(aiResponse);
      const aiSkills = sanitizeSkillsScore(analysisResult.skillsScore);
      const mergedSkills = this.mergeSkillsScore(aiSkills, ruleInsights.skillsScore);
      const mergedInterests = this.mergeInterests(analysisResult.detectedInterests, ruleInsights.interests);
      const mergedFaculties = this.mergeFacultyRecommendations(
        this.formatFacultyRecommendations(analysisResult.recommendedFaculties),
        ruleInsights.recommendedFaculties,
        mergedSkills,
      );

      const strengths = uniqueStrings(
        Array.isArray(analysisResult.strengths) ? analysisResult.strengths : [],
      );
      const weaknesses = uniqueStrings(
        Array.isArray(analysisResult.weaknesses) ? analysisResult.weaknesses : [],
      );

      const autoRecommendations = this.generateRuleBasedRecommendations(cleanedText, weaknesses, mergedInterests);
      const recommendations = uniqueStrings([
        ...(Array.isArray(analysisResult.recommendations) ? analysisResult.recommendations : []),
        ...autoRecommendations,
      ]).slice(0, 6);

      const overview =
        typeof analysisResult.overview === 'string' && analysisResult.overview.trim().length > 0
          ? analysisResult.overview.trim()
          : this.buildFallbackOverview(cleanedText, mergedInterests);

      const studentName =
        typeof analysisResult.studentName === 'string' && analysisResult.studentName.trim().length > 0
          ? this.normalizeThaiNameSpacing(analysisResult.studentName)
          : this.extractStudentNameFromText(cleanedText);

      onProgress?.({ progress: 95, status: 'กำลังสรุปผลการวิเคราะห์...' });

      const result: PortfolioAnalysisResult = {
        overview,
        strengths: strengths.length > 0 ? strengths : ['มีผลงานและกิจกรรมที่สอดคล้องกับเป้าหมายการเรียนต่อ'],
        weaknesses:
          weaknesses.length > 0
            ? weaknesses
            : ['ควรเพิ่มหลักฐานผลลัพธ์เชิงตัวเลขของกิจกรรมเพื่อเพิ่มความน่าเชื่อถือ'],
        recommendedFaculties: mergedFaculties,
        recommendations:
          recommendations.length > 0
            ? recommendations
            : ['เพิ่มหลักฐานผลงานที่วัดผลได้และเชื่อมโยงกับคณะเป้าหมายให้ชัดเจน'],
        studentName: studentName || undefined,
        detectedInterests: mergedInterests,
        skillsScore: mergedSkills,
        analysisMetadata: {
          textLength: cleanedText.length,
          confidenceScore: confidence,
          processingTime: Date.now() - startTime,
        },
      };

      onProgress?.({ progress: 100, status: 'วิเคราะห์เสร็จสมบูรณ์!' });
      return result;
    } catch (error) {
      console.error('Portfolio analysis error:', error);
      return this.createFallbackResult(
        'เกิดข้อผิดพลาดในการวิเคราะห์พอร์ตโฟลิโอ',
        cleanedText.length,
        confidence,
        Date.now() - startTime,
        ruleInsights,
      );
    }
  }

  private extractRuleBasedInsights(text: string): {
    interests: string[];
    skillsScore: Record<string, number>;
    recommendedFaculties: FacultyRecommendation[];
  } {
    const normalized = normalizeSearchText(text);
    const interests = this.detectInterests(normalized);
    const skillsScore = this.buildRuleBasedSkills(normalized);
    const recommendedFaculties = this.buildRuleBasedFacultyRecommendations(
      normalized,
      interests,
      skillsScore,
    );

    return { interests, skillsScore, recommendedFaculties };
  }

  private buildRuleBasedSkills(normalizedText: string): Record<string, number> {
    const textLengthBoost = Math.min(10, Math.floor(normalizedText.length / 900));
    const achievementHits = countKeywordHits(normalizedText, [
      'รางวัล',
      'award',
      'competition',
      'แข่งขัน',
      'เกียรติบัตร',
      'certificate',
      'achievement',
    ]);
    const activityHits = countKeywordHits(normalizedText, [
      'กิจกรรม',
      'โครงการ',
      'project',
      'camp',
      'workshop',
      'internship',
      'อาสา',
      'ชมรม',
    ]);

    const scores: Record<string, number> = {};

    for (const rule of SKILL_RULES) {
      const mainHits = countKeywordHits(normalizedText, rule.keywords);
      const boosterHits = countKeywordHits(normalizedText, rule.boosters);

      let score = 28 + textLengthBoost;
      if (mainHits > 0) {
        score =
          40 +
          mainHits * 11 +
          Math.min(3, boosterHits) * 5 +
          Math.min(2, achievementHits) * 3 +
          Math.min(3, activityHits) * 2 +
          textLengthBoost;
      } else if (boosterHits > 0) {
        score = 34 + boosterHits * 4 + Math.min(2, activityHits) * 2 + textLengthBoost;
      }

      scores[rule.skill] = clamp(Math.round(score), 22, 96);
    }

    return scores;
  }

  private detectInterests(normalizedText: string): string[] {
    const scored = INTEREST_RULES.map((rule) => ({
      interest: rule.interest,
      score: countKeywordHits(normalizedText, rule.keywords),
    }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.interest);

    return uniqueStrings(scored).slice(0, 6);
  }

  private buildRuleBasedFacultyRecommendations(
    normalizedText: string,
    interests: string[],
    skillsScore: Record<string, number>,
  ): FacultyRecommendation[] {
    const recommendations = FACULTY_PROFILES.map((profile) => {
      const keywordHits = countKeywordHits(normalizedText, profile.keywords);
      const matchedInterests = profile.relatedInterests.filter((interest) => interests.includes(interest));

      const requiredScores = profile.requiredSkills
        .map((skill) => Number(skillsScore[skill]))
        .filter((score) => Number.isFinite(score));
      const skillAverage =
        requiredScores.length > 0
          ? requiredScores.reduce((sum, score) => sum + score, 0) / requiredScores.length
          : 45;

      const keywordStrength = Math.min(1, keywordHits / 3);
      const interestStrength = matchedInterests.length / Math.max(1, profile.relatedInterests.length);

      const matchPercentage = clamp(
        Math.round(skillAverage * 0.72 + keywordStrength * 18 + interestStrength * 10),
        35,
        98,
      );

      const skillHighlights = profile.requiredSkills
        .map((skill) => ({ skill, score: skillsScore[skill] ?? 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .map((item) => `${item.skill} ${item.score}%`);

      const evidenceKeywords = profile.keywords
        .filter((keyword) => normalizedText.includes(normalizeSearchText(keyword)))
        .slice(0, 2);

      let reason = `พอร์ตมีสัญญาณที่สอดคล้องกับสาย ${profile.faculty}`;
      if (evidenceKeywords.length > 0) {
        reason += ` (พบคำสำคัญ: ${evidenceKeywords.join(', ')})`;
      }
      if (skillHighlights.length > 0) {
        reason += ` และทักษะเด่นคือ ${skillHighlights.join(', ')}`;
      }

      return {
        faculty: profile.faculty,
        reason,
        matchPercentage,
        signal: keywordHits + matchedInterests.length,
      };
    });

    const withSignal = recommendations
      .filter((item) => item.signal > 0)
      .sort((a, b) => {
        if (b.matchPercentage !== a.matchPercentage) {
          return b.matchPercentage - a.matchPercentage;
        }
        return b.signal - a.signal;
      })
      .slice(0, 5)
      .map(({ signal, ...rest }) => rest);

    if (withSignal.length > 0) {
      return withSignal;
    }

    // หากไม่เจอคำสำคัญ ให้ fallback จากทักษะล้วน
    return recommendations
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 3)
      .map(({ signal, ...rest }) => ({
        ...rest,
        matchPercentage: clamp(rest.matchPercentage - 8, 30, 90),
      }));
  }

  private mergeSkillsScore(
    aiSkills: Record<string, number>,
    ruleSkills: Record<string, number>,
  ): Record<string, number> {
    const canonicalMap = new Map<string, string>();
    for (const rule of SKILL_RULES) {
      canonicalMap.set(normalizeSkillKey(rule.skill), rule.skill);
      for (const alias of rule.aliases) {
        canonicalMap.set(normalizeSkillKey(alias), rule.skill);
      }
    }

    const normalizedAISkills: Record<string, number> = {};
    for (const [key, value] of Object.entries(aiSkills)) {
      const normalized = normalizeSkillKey(key);
      let canonical = canonicalMap.get(normalized);

      if (!canonical) {
        canonical = SKILL_RULES.find((rule) => {
          return rule.aliases.some((alias) => {
            const aliasKey = normalizeSkillKey(alias);
            return normalized.includes(aliasKey) || aliasKey.includes(normalized);
          });
        })?.skill;
      }

      if (canonical) {
        normalizedAISkills[canonical] = clamp(Math.round(value));
      } else if (Number.isFinite(Number(value))) {
        normalizedAISkills[key] = clamp(Math.round(Number(value)));
      }
    }

    const merged: Record<string, number> = {};
    const keys = new Set<string>([
      ...Object.keys(ruleSkills),
      ...Object.keys(normalizedAISkills),
      ...SKILL_RULES.map((rule) => rule.skill),
    ]);

    for (const key of keys) {
      const aiValue = normalizedAISkills[key];
      const ruleValue = ruleSkills[key];

      if (Number.isFinite(aiValue) && Number.isFinite(ruleValue)) {
        merged[key] = clamp(Math.round(aiValue * 0.65 + ruleValue * 0.35));
      } else if (Number.isFinite(aiValue)) {
        merged[key] = clamp(Math.round(aiValue));
      } else if (Number.isFinite(ruleValue)) {
        merged[key] = clamp(Math.round(ruleValue));
      }
    }

    return merged;
  }

  private mergeInterests(aiInterests: unknown, ruleInterests: string[]): string[] {
    const aiList = Array.isArray(aiInterests) ? aiInterests.filter((item): item is string => typeof item === 'string') : [];
    return uniqueStrings([...aiList, ...ruleInterests]).slice(0, 6);
  }

  private mergeFacultyRecommendations(
    aiFaculties: FacultyRecommendation[],
    ruleFaculties: FacultyRecommendation[],
    skillScores: Record<string, number>,
  ): FacultyRecommendation[] {
    const merged = new Map<string, FacultyRecommendation>();

    const upsert = (recommendation: FacultyRecommendation, source: 'ai' | 'rule') => {
      const key = normalizeSearchText(recommendation.faculty);
      if (!key) {
        return;
      }

      const existing = merged.get(key);
      if (!existing) {
        merged.set(key, {
          faculty: recommendation.faculty,
          reason: recommendation.reason,
          matchPercentage: clamp(Math.round(recommendation.matchPercentage)),
        });
        return;
      }

      const blended =
        source === 'ai'
          ? existing.matchPercentage * 0.45 + recommendation.matchPercentage * 0.55
          : existing.matchPercentage * 0.6 + recommendation.matchPercentage * 0.4;

      merged.set(key, {
        faculty: existing.faculty.length >= recommendation.faculty.length ? existing.faculty : recommendation.faculty,
        reason: uniqueStrings([existing.reason, recommendation.reason]).join(' | '),
        matchPercentage: clamp(Math.round(blended)),
      });
    };

    for (const recommendation of ruleFaculties) {
      upsert(recommendation, 'rule');
    }

    for (const recommendation of aiFaculties) {
      upsert(recommendation, 'ai');
    }

    let results = [...merged.values()]
      .map((item) => ({
        ...item,
        matchPercentage: this.adjustFacultyScoreFromSkills(item, skillScores),
      }))
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 6);

    if (results.length === 0) {
      results = ruleFaculties.slice(0, 3);
    }

    if (results.length === 0) {
      return [
        {
          faculty: 'ต้องการข้อมูลเพิ่มเติม',
          reason: 'ไม่พบสัญญาณเพียงพอในการจับคู่คณะที่เหมาะสม',
          matchPercentage: 0,
        },
      ];
    }

    return results;
  }

  private adjustFacultyScoreFromSkills(
    recommendation: FacultyRecommendation,
    skillScores: Record<string, number>,
  ): number {
    const profile = FACULTY_PROFILES.find(
      (item) => normalizeSearchText(item.faculty) === normalizeSearchText(recommendation.faculty),
    );

    if (!profile) {
      return clamp(Math.round(recommendation.matchPercentage));
    }

    const scores = profile.requiredSkills
      .map((skill) => skillScores[skill])
      .filter((score): score is number => Number.isFinite(score));

    if (scores.length === 0) {
      return clamp(Math.round(recommendation.matchPercentage));
    }

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return clamp(Math.round(recommendation.matchPercentage * 0.72 + average * 0.28));
  }

  private generateRuleBasedRecommendations(
    text: string,
    weaknesses: string[],
    interests: string[],
  ): string[] {
    const autoRecommendations: string[] = [];

    for (const hint of RECOMMENDATION_HINTS) {
      if (hint.pattern.test(text)) {
        autoRecommendations.push(hint.advice);
      }
    }

    if (weaknesses.length > 0) {
      autoRecommendations.push('ระบุแนวทางแก้ไขจุดอ่อนแต่ละข้อในพอร์ตให้ชัดเจน พร้อมแสดงสิ่งที่ปรับปรุงแล้ว');
    }

    if (interests.length > 0) {
      autoRecommendations.push(
        `เพิ่ม statement เป้าหมายการเรียนต่อให้ชัดว่าอยากต่อด้าน ${interests.slice(0, 2).join(' / ')}`,
      );
    }

    return uniqueStrings(autoRecommendations).slice(0, 4);
  }

  private createFallbackResult(
    errorMessage: string,
    textLength: number,
    confidence: number,
    processingTime: number,
    ruleInsights?: {
      interests: string[];
      skillsScore: Record<string, number>;
      recommendedFaculties: FacultyRecommendation[];
    },
  ): PortfolioAnalysisResult {
    const interests = ruleInsights?.interests || [];
    const skillsScore = ruleInsights?.skillsScore || {};

    return {
      overview: `เกิดข้อผิดพลาด: ${errorMessage}`,
      strengths: ['พบข้อความจากไฟล์เรียบร้อยแล้ว'],
      weaknesses: ['ระบบวิเคราะห์ AI ไม่สมบูรณ์ จึงแสดงผลจากการประเมินเชิงกฎแทน'],
      recommendedFaculties:
        ruleInsights?.recommendedFaculties?.length
          ? ruleInsights.recommendedFaculties.slice(0, 4)
          : [
              {
                faculty: 'ต้องการการวิเคราะห์เพิ่มเติม',
                reason: 'ระบบไม่สามารถวิเคราะห์ AI ได้ในขณะนี้',
                matchPercentage: 0,
              },
            ],
      recommendations: [
        'ลองอัปโหลดไฟล์ที่คมชัดขึ้นหรือเพิ่มข้อมูลกิจกรรมให้ครบถ้วน',
        ...this.generateRuleBasedRecommendations('', [], interests),
      ].slice(0, 4),
      detectedInterests: interests,
      skillsScore,
      analysisMetadata: {
        textLength,
        confidenceScore: confidence,
        processingTime,
      },
    };
  }

  private createSimplifiedPrompt(text: string, fileName: string): string {
    return `คุณคือผู้ช่วยวิเคราะห์พอร์ตโฟลิโอเพื่อแนะนำสาขา/คณะอย่างแม่นยำ

ข้อกำหนดสำคัญ:
1) ใช้เฉพาะข้อมูลที่ปรากฏในข้อความเท่านั้น ห้ามเดา ห้ามแต่งข้อมูล
2) หากข้อมูลไม่พอ ให้ระบุแบบระมัดระวังและคงค่าให้สั้นชัดเจน
3) ประเมิน skillsScore แบบ evidence-based (0-100)
4) recommendedFaculties ต้องอ้างอิงจากกิจกรรม/ผลงาน/ทักษะในข้อความ
5) ตอบกลับเป็น JSON เพียวๆ เท่านั้น ห้ามมี markdown

ไฟล์: ${fileName}

ข้อความพอร์ตโฟลิโอจาก OCR:
"""
${text}
"""

รูปแบบ JSON ที่ต้องตอบ:
{
  "overview": "สรุปภาพรวมพอร์ตโฟลิโอ 2-4 ประโยค",
  "strengths": ["จุดแข็งที่ 1", "จุดแข็งที่ 2", "จุดแข็งที่ 3"],
  "weaknesses": ["จุดที่ควรพัฒนา 1", "จุดที่ควรพัฒนา 2"],
  "recommendedFaculties": [
    {"faculty": "ชื่อคณะหรือสาขา", "reason": "เหตุผลจากข้อมูลในพอร์ต", "matchPercentage": 85}
  ],
  "recommendations": ["คำแนะนำที่นำไปทำต่อได้ทันที"],
  "detectedInterests": ["ความสนใจหลัก"],
  "studentName": "ชื่อนักเรียนถ้าพบเท่านั้น",
  "skillsScore": {
    "ภาวะผู้นำ": 75,
    "การทำงานเป็นทีม": 85,
    "ความคิดสร้างสรรค์": 80,
    "การแก้ปัญหา": 70,
    "การสื่อสาร": 90,
    "ความรับผิดชอบ": 85,
    "การคิดวิเคราะห์": 78
  }
}
`;
  }

  private parseAIResponse(response: string): any {
    const cleaned = response
      .replace(/```json/gi, '```')
      .replace(/```/g, '')
      .trim();

    const direct = this.tryParseJson(cleaned);
    if (direct) {
      return direct;
    }

    const braceStart = cleaned.indexOf('{');
    const braceEnd = cleaned.lastIndexOf('}');
    if (braceStart >= 0 && braceEnd > braceStart) {
      const candidate = cleaned.slice(braceStart, braceEnd + 1);
      const extracted = this.tryParseJson(candidate);
      if (extracted) {
        return extracted;
      }
    }

    return this.parseUnstructuredResponse(cleaned);
  }

  private tryParseJson(raw: string): any | null {
    try {
      return JSON.parse(raw);
    } catch {
      // continue with relaxed parsing
    }

    try {
      const relaxed = raw
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u0019]/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return JSON.parse(relaxed);
    } catch {
      return null;
    }
  }

  private parseUnstructuredResponse(response: string): any {
    const sections: any = {
      overview: '',
      strengths: [],
      weaknesses: [],
      recommendedFaculties: [],
      recommendations: [],
      detectedInterests: [],
      skillsScore: {},
    };

    const lines = response.split('\n').map((line) => line.trim()).filter(Boolean);

    let currentSection = '';
    for (const line of lines) {
      const lowered = line.toLowerCase();

      if (lowered.includes('ภาพรวม') || lowered.includes('overview') || lowered.includes('สรุป')) {
        currentSection = 'overview';
        sections.overview = line.replace(/^.*?:\s*/, '').trim() || sections.overview;
      } else if (lowered.includes('จุดแข็ง') || lowered.includes('strength')) {
        currentSection = 'strengths';
      } else if (lowered.includes('จุดอ่อน') || lowered.includes('weakness')) {
        currentSection = 'weaknesses';
      } else if (lowered.includes('คณะ') || lowered.includes('faculty') || lowered.includes('สาขา')) {
        currentSection = 'faculties';
      } else if (lowered.includes('แนะนำ') || lowered.includes('recommend')) {
        currentSection = 'recommendations';
      } else if (lowered.includes('ความสนใจ') || lowered.includes('interest')) {
        currentSection = 'interests';
      } else if (
        currentSection &&
        (line.startsWith('-') || line.startsWith('*') || /^\d+[.)]/.test(line))
      ) {
        const item = line.replace(/^[-*\d.)\s]+/, '').trim();
        if (!item) {
          continue;
        }

        if (currentSection === 'strengths') {
          sections.strengths.push(item);
        } else if (currentSection === 'weaknesses') {
          sections.weaknesses.push(item);
        } else if (currentSection === 'recommendations') {
          sections.recommendations.push(item);
        } else if (currentSection === 'interests') {
          sections.detectedInterests.push(item);
        } else if (currentSection === 'faculties') {
          const percentMatch = item.match(/(\d{1,3})\s*%/);
          sections.recommendedFaculties.push({
            faculty: item.replace(/\(.*?\)/g, '').replace(/\d{1,3}\s*%/g, '').trim(),
            reason: 'วิเคราะห์จากข้อมูลในพอร์ตโฟลิโอ',
            matchPercentage: percentMatch ? clamp(Number(percentMatch[1])) : 65,
          });
        }
      }
    }

    if (!sections.overview && lines.length > 0) {
      sections.overview = lines.slice(0, 2).join(' ');
    }

    return sections;
  }

  private formatFacultyRecommendations(faculties: any): FacultyRecommendation[] {
    if (!Array.isArray(faculties)) {
      return [];
    }

    return faculties
      .map((faculty: any) => {
        const name = typeof faculty?.faculty === 'string' ? faculty.faculty.trim() : '';
        const reason = typeof faculty?.reason === 'string' ? faculty.reason.trim() : '';
        const percentage = Number(faculty?.matchPercentage);

        if (!name) {
          return null;
        }

        return {
          faculty: name,
          reason: reason || 'เหมาะสมตามข้อมูลในพอร์ตโฟลิโอ',
          matchPercentage: clamp(Math.round(Number.isFinite(percentage) ? percentage : 0)),
        } satisfies FacultyRecommendation;
      })
      .filter((item): item is FacultyRecommendation => item !== null);
  }

  private extractStudentNameFromText(text: string): string | undefined {
    const normalized = text.replace(/\s+/g, ' ').trim();

    const thaiNameMatch = normalized.match(
      /(นาย|นางสาว|น\.ส\.|ด\.ช\.|ด\.ญ\.)\s*[ก-๙\s]{4,40}/,
    );
    if (thaiNameMatch && thaiNameMatch[0]) {
      return this.normalizeThaiNameSpacing(thaiNameMatch[0]);
    }

    const englishNameMatch = normalized.match(/\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/);
    if (englishNameMatch && englishNameMatch[1]) {
      return englishNameMatch[1].trim();
    }

    return undefined;
  }

  private normalizeThaiNameSpacing(name: string): string {
    let cleaned = name
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*([()\[\]{}])\s*/g, ' $1 ')
      .trim();

    // OCR มักคั่นระยะระหว่างตัวอักษรไทย ให้บีบช่องว่างให้ติดกัน
    for (let i = 0; i < 6; i++) {
      cleaned = cleaned.replace(/([ก-๙])\s(?=[ก-๙])/g, '$1');
    }

    return cleaned.replace(/\s{2,}/g, ' ').trim();
  }

  private buildFallbackOverview(text: string, interests: string[]): string {
    const firstUsefulLine = text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 25);

    const interestText =
      interests.length > 0
        ? `พอร์ตมีแนวโน้มความสนใจเด่นด้าน ${interests.slice(0, 2).join(' และ ')}`
        : 'พอร์ตแสดงกิจกรรมและผลงานหลายมิติที่ใช้ประเมินศักยภาพได้';

    if (firstUsefulLine) {
      return `${interestText} โดยมีเนื้อหาหลักเช่น "${firstUsefulLine.slice(0, 140)}"`;
    }

    return interestText;
  }
}

// Singleton instance
export const portfolioAnalyzer = new PortfolioAnalyzer();
