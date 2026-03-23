export interface ProgramForMatching {
  id: number;
  university_id: string | null;
  university_name_th: string | null;
  university_name_en: string | null;
  faculty_name_th: string | null;
  faculty_name_en: string | null;
  group_field_th?: string | null;
  field_name_th: string | null;
  field_name_en: string | null;
  program_name_th: string | null;
  program_name_en: string | null;
  program_type_name_th?: string | null;
  logo_url: string | null;
  major_acceptance_number?: number | null;
}

export interface MatchedSkillScore {
  skill: string;
  score: number;
}

export interface ProgramRecommendationResult {
  id: number;
  university_id: string | null;
  university_name_th: string | null;
  university_name_en: string | null;
  faculty_name_th: string | null;
  faculty_name_en: string | null;
  field_name_th: string | null;
  field_name_en: string | null;
  program_name_th: string | null;
  program_name_en: string | null;
  logo_url: string | null;
  required_skills: string[];
  matched_skills: MatchedSkillScore[];
  match_percentage: number;
}

export interface ProgramRecommendationOptions {
  portfolioHints?: string[];
  detectedInterests?: string[];
  strictPortfolioHint?: boolean;
}

type SkillScores = Record<string, number>;
type SkillWeight = { skill: string; weight: number };
type DomainProfile = {
  name: string;
  keywords: string[];
  requiredSkills: SkillWeight[];
};

type DomainMatch = {
  profile: DomainProfile;
  score: number;
};

const DEFAULT_REQUIRED_SKILLS: SkillWeight[] = [
  { skill: 'การคิดวิเคราะห์', weight: 0.95 },
  { skill: 'การแก้ปัญหา', weight: 0.9 },
  { skill: 'การสื่อสาร', weight: 0.8 },
];

const DOMAIN_PROFILES: DomainProfile[] = [
  {
    name: 'engineering-tech',
    keywords: [
      'engineering',
      'วิศว',
      'computer',
      'เทคโนโลยี',
      'ดิจิทัล',
      'ai',
      'robot',
      'software',
      'innovation',
      'วิทยาการคอมพิวเตอร์',
    ],
    requiredSkills: [
      { skill: 'การแก้ปัญหา', weight: 1.2 },
      { skill: 'การคิดวิเคราะห์', weight: 1.1 },
      { skill: 'การทำงานเป็นทีม', weight: 0.9 },
      { skill: 'ความรับผิดชอบ', weight: 0.75 },
    ],
  },
  {
    name: 'health-medical',
    keywords: [
      'แพทย',
      'medicine',
      'พยาบาล',
      'nursing',
      'เภสัช',
      'ทันต',
      'สาธารณสุข',
      'public health',
      'กายภาพ',
      'medical',
    ],
    requiredSkills: [
      { skill: 'ความรับผิดชอบ', weight: 1.2 },
      { skill: 'การทำงานเป็นทีม', weight: 1.1 },
      { skill: 'การแก้ปัญหา', weight: 1.0 },
      { skill: 'การสื่อสาร', weight: 0.9 },
    ],
  },
  {
    name: 'science-data',
    keywords: [
      'science',
      'วิทยา',
      'data',
      'สถิติ',
      'คณิต',
      'analytics',
      'analysis',
      'research',
      'lab',
      'mathematics',
    ],
    requiredSkills: [
      { skill: 'การคิดวิเคราะห์', weight: 1.2 },
      { skill: 'การแก้ปัญหา', weight: 1.0 },
      { skill: 'ความรับผิดชอบ', weight: 0.85 },
      { skill: 'การสื่อสาร', weight: 0.7 },
    ],
  },
  {
    name: 'business-management',
    keywords: [
      'business',
      'บริหาร',
      'management',
      'entrepreneur',
      'commerce',
      'การตลาด',
      'marketing',
      'accounting',
      'บัญชี',
      'finance',
      'เศรษฐ',
    ],
    requiredSkills: [
      { skill: 'ภาวะผู้นำ', weight: 1.15 },
      { skill: 'การสื่อสาร', weight: 1.1 },
      { skill: 'การคิดวิเคราะห์', weight: 0.95 },
      { skill: 'ความรับผิดชอบ', weight: 0.8 },
    ],
  },
  {
    name: 'communication-arts',
    keywords: [
      'communication',
      'นิเทศ',
      'media',
      'journalism',
      'ภาษา',
      'language',
      'content',
      'public relation',
      'tourism',
      'hospitality',
    ],
    requiredSkills: [
      { skill: 'การสื่อสาร', weight: 1.2 },
      { skill: 'ความคิดสร้างสรรค์', weight: 1.0 },
      { skill: 'การทำงานเป็นทีม', weight: 0.85 },
      { skill: 'ภาวะผู้นำ', weight: 0.75 },
    ],
  },
  {
    name: 'creative-design',
    keywords: [
      'design',
      'ศิลป',
      'architecture',
      'สถาปัต',
      'creative',
      'animation',
      'film',
      'music',
      'ดนตรี',
      'fashion',
    ],
    requiredSkills: [
      { skill: 'ความคิดสร้างสรรค์', weight: 1.25 },
      { skill: 'การสื่อสาร', weight: 0.95 },
      { skill: 'การแก้ปัญหา', weight: 0.85 },
      { skill: 'ความรับผิดชอบ', weight: 0.75 },
    ],
  },
  {
    name: 'law-social',
    keywords: [
      'law',
      'นิติ',
      'รัฐศาสตร์',
      'political',
      'public administration',
      'สังคม',
      'policy',
      'international',
      'humanities',
    ],
    requiredSkills: [
      { skill: 'การสื่อสาร', weight: 1.15 },
      { skill: 'การคิดวิเคราะห์', weight: 1.0 },
      { skill: 'ความรับผิดชอบ', weight: 0.95 },
      { skill: 'ภาวะผู้นำ', weight: 0.8 },
    ],
  },
  {
    name: 'education-sport',
    keywords: [
      'education',
      'ครุ',
      'teacher',
      'sports',
      'sport science',
      'พลศึกษา',
      'coaching',
      'psychology',
    ],
    requiredSkills: [
      { skill: 'การสื่อสาร', weight: 1.05 },
      { skill: 'การทำงานเป็นทีม', weight: 1.0 },
      { skill: 'ภาวะผู้นำ', weight: 0.9 },
      { skill: 'ความรับผิดชอบ', weight: 0.85 },
    ],
  },
];

const SKILL_ALIASES: Record<string, string[]> = {
  การคิดวิเคราะห์: ['คิดวิเคราะห์', 'criticalthinking', 'analysis', 'analytical', 'reasoning'],
  การแก้ปัญหา: ['แก้ปัญหา', 'problemsolving', 'problem', 'solution'],
  ความคิดสร้างสรรค์: ['คิดสร้างสรรค์', 'creative', 'creativity'],
  การสื่อสาร: ['สื่อสาร', 'communication', 'present', 'presentation'],
  ภาวะผู้นำ: ['ผู้นำ', 'leadership', 'leader'],
  การทำงานเป็นทีม: ['ทีม', 'teamwork', 'team'],
  ความรับผิดชอบ: ['รับผิดชอบ', 'responsibility', 'reliable'],
};

const STOP_WORDS = new Set([
  'คณะ',
  'สาขา',
  'มหาวิทยาลัย',
  'ที่',
  'และ',
  'ของ',
  'กับ',
  'ใน',
  'for',
  'the',
  'faculty',
  'program',
  'major',
  'เหมาะสม',
  'แนะนำ',
  'portfolio',
  'พอร์ต',
]);

const TOKEN_ALIASES: Record<string, string[]> = {
  จุฬา: ['จุฬาลงกรณ์', 'chula'],
  จุฬาลงกรณ์: ['จุฬา', 'chula'],
  chula: ['จุฬา', 'จุฬาลงกรณ์', 'chulalongkorn'],
  chulalongkorn: ['จุฬา', 'จุฬาลงกรณ์', 'chula'],
  ชูล่า: ['จุฬา', 'จุฬาลงกรณ์'],
  มธ: ['ธรรมศาสตร์'],
  ธรรมศาสตร์: ['มธ'],
  มหิดล: ['mahidol'],
  เกษตร: ['เกษตรศาสตร์', 'kasetsart'],
  วิศว: ['วิศวกรรม', 'engineering'],
  วิศวกรรม: ['วิศว', 'engineering'],
  จิตวิทยา: ['psychology'],
  คอม: ['computer', 'software'],
  ไอที: ['it', 'information'],
};

const UNIVERSITY_ALIASES: Array<{ id: string; aliases: string[] }> = [
  {
    id: 'chula',
    aliases: ['จุฬา', 'จุฬาลงกรณ์', 'จุฬาลงกรณ์มหาวิทยาลัย', 'chula', 'chulalongkorn'],
  },
  {
    id: 'thammasat',
    aliases: ['ธรรมศาสตร์', 'มธ', 'thammasat', 'tu'],
  },
  {
    id: 'mahidol',
    aliases: ['มหิดล', 'mahidol', 'mu'],
  },
  {
    id: 'kasetsart',
    aliases: ['เกษตรศาสตร์', 'เกษตร', 'kasetsart', 'ku'],
  },
  {
    id: 'kmutt',
    aliases: ['พระจอมเกล้าธนบุรี', 'kmutt', 'มจธ'],
  },
  {
    id: 'kmitl',
    aliases: ['ลาดกระบัง', 'kmitl', 'มจล'],
  },
  {
    id: 'kmutt-north',
    aliases: ['พระนครเหนือ', 'kmutnb', 'มจพ'],
  },
  {
    id: 'rmut',
    aliases: ['ราชมงคล', 'rmut', 'rmutsv', 'ราชมงคลศรีวิชัย'],
  },
];

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_\-()/]/g, ' ')
    .replace(/[^a-z0-9ก-๙\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSkillKey(value: string): string {
  return value.toLowerCase().replace(/[\s_\-()]/g, '');
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function uniqueStrings(values: string[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeValue(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    result.push(value.trim());
  }

  return result;
}

export function extractPortfolioHintsFromAnalysis(
  recommendedFaculties: unknown,
  detectedInterests?: unknown,
  overview?: unknown,
): string[] {
  const hints: string[] = [];

  if (Array.isArray(recommendedFaculties)) {
    for (const item of recommendedFaculties) {
      if (typeof item === 'string') {
        hints.push(item);
        continue;
      }

      if (item && typeof item === 'object') {
        const asObject = item as Record<string, unknown>;
        if (typeof asObject.faculty === 'string') {
          hints.push(asObject.faculty);
        }
        if (typeof asObject.reason === 'string') {
          hints.push(asObject.reason);
        }
        if (typeof asObject.university === 'string') {
          hints.push(asObject.university);
        }
      }
    }
  }

  hints.push(...normalizeStringList(detectedInterests));

  const hasStrongHints = hints.length > 0;
  if (!hasStrongHints && typeof overview === 'string' && overview.trim().length > 0) {
    hints.push(overview.trim());
  }

  return uniqueStrings(hints).slice(0, 30);
}

export function extractStructuredPortfolioHints(rawText: unknown): string[] {
  if (typeof rawText !== 'string' || rawText.trim().length === 0) {
    return [];
  }

  let text = rawText.replace(/\r/g, ' ').replace(/\n+/g, ' ');
  for (let i = 0; i < 6; i++) {
    text = text.replace(/([ก-๙])\s(?=[ก-๙])/g, '$1');
  }

  const patterns: RegExp[] = [
    /(?:คณะ|ภาควิชา|สาขา)\s*[ก-๙A-Za-z][ก-๙A-Za-z0-9\s\-]{2,60}/g,
    /(?:จุฬาลงกรณ์มหาวิทยาลัย|มหาวิทยาลัย[ก-๙A-Za-z][ก-๙A-Za-z\s]{2,50})/g,
    /(?:จุฬา|chula|chulalongkorn|ธรรมศาสตร์|thammasat|มหิดล|mahidol|เกษตรศาสตร์|kasetsart|ราชมงคล|rmut)/gi,
    /(?:engineering|computer engineering|civil engineering|mechanical engineering|วิศวกรรมศาสตร์|วิทยาการคอมพิวเตอร์|บริหารธุรกิจ|นิติศาสตร์|นิเทศศาสตร์|จิตวิทยา|แพทยศาสตร์)/gi,
  ];

  const hints: string[] = [];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const value = (match[0] || '').trim();
      if (value.length >= 3) {
        hints.push(value);
      }
    }
  }

  return uniqueStrings(hints).slice(0, 25);
}

function tokenizeHintText(text: string): string[] {
  const normalized = normalizeValue(text);
  if (!normalized) {
    return [];
  }

  const tokens = normalized
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => !/^\d+$/.test(token));

  return uniqueStrings(tokens);
}

function expandTokens(tokens: string[]): string[] {
  const expanded = new Set<string>();

  for (const token of tokens) {
    expanded.add(token);

    for (const [source, aliases] of Object.entries(TOKEN_ALIASES)) {
      const normalizedSource = normalizeValue(source);
      if (
        token === normalizedSource ||
        token.includes(normalizedSource) ||
        normalizedSource.includes(token)
      ) {
        for (const alias of aliases) {
          const normalizedAlias = normalizeValue(alias);
          if (normalizedAlias.length >= 2 && !STOP_WORDS.has(normalizedAlias)) {
            expanded.add(normalizedAlias);
          }
        }
      }
    }
  }

  return [...expanded];
}

function buildHintTokens(hints: string[], detectedInterests: string[]): string[] {
  const rawTokens = uniqueStrings([...hints, ...detectedInterests])
    .flatMap((hint) => tokenizeHintText(hint))
    .slice(0, 80);

  return uniqueStrings(expandTokens(rawTokens));
}

function detectTargetUniversities(hintTokens: string[]): Set<string> {
  const targets = new Set<string>();
  if (hintTokens.length === 0) {
    return targets;
  }

  for (const university of UNIVERSITY_ALIASES) {
    const aliasTokens = university.aliases.map((alias) => normalizeValue(alias));
    const hasMatch = aliasTokens.some((aliasToken) => {
      return hintTokens.some((token) => {
        return token.includes(aliasToken) || aliasToken.includes(token);
      });
    });

    if (hasMatch) {
      targets.add(university.id);
    }
  }

  return targets;
}

function detectProgramUniversity(programSource: string): string | null {
  if (!programSource) {
    return null;
  }

  for (const university of UNIVERSITY_ALIASES) {
    const found = university.aliases.some((alias) => {
      const normalizedAlias = normalizeValue(alias);
      return (
        programSource.includes(normalizedAlias) ||
        normalizedAlias.includes(programSource)
      );
    });

    if (found) {
      return university.id;
    }
  }

  return null;
}

function buildProgramSource(program: ProgramForMatching): string {
  return normalizeValue(
    [
      program.university_name_th,
      program.university_name_en,
      program.faculty_name_th,
      program.faculty_name_en,
      program.group_field_th,
      program.field_name_th,
      program.field_name_en,
      program.program_name_th,
      program.program_name_en,
      program.program_type_name_th,
    ]
      .filter(Boolean)
      .join(' '),
  );
}

function detectProgramDomains(program: ProgramForMatching): DomainMatch[] {
  const source = buildProgramSource(program);
  if (!source) {
    return [];
  }

  const matches: DomainMatch[] = [];
  for (const profile of DOMAIN_PROFILES) {
    const hits = profile.keywords.reduce((count, keyword) => {
      return count + (source.includes(normalizeValue(keyword)) ? 1 : 0);
    }, 0);

    if (hits <= 0) {
      continue;
    }

    const denominator = Math.max(1, Math.min(4, Math.round(profile.keywords.length * 0.35)));
    const score = Math.max(0.25, Math.min(1, hits / denominator));
    matches.push({ profile, score });
  }

  return matches.sort((a, b) => b.score - a.score).slice(0, 3);
}

function detectHintDomains(hintTokens: string[]): Set<string> {
  if (hintTokens.length === 0) {
    return new Set();
  }

  const matchedDomains = new Set<string>();

  for (const domain of DOMAIN_PROFILES) {
    const hasMatch = domain.keywords.some((keyword) => {
      const normalizedKeyword = normalizeValue(keyword);
      return hintTokens.some((token) => {
        return (
          token.includes(normalizedKeyword) ||
          normalizedKeyword.includes(token)
        );
      });
    });

    if (hasMatch) {
      matchedDomains.add(domain.name);
    }
  }

  return matchedDomains;
}

function pickRequiredSkills(
  domainMatches: DomainMatch[],
): { requiredSkills: string[]; skillWeights: Record<string, number> } {
  const weightMap = new Map<string, number>();

  for (const domain of domainMatches) {
    for (const required of domain.profile.requiredSkills) {
      const existing = weightMap.get(required.skill) || 0;
      weightMap.set(required.skill, existing + required.weight * domain.score);
    }
  }

  for (const fallbackSkill of DEFAULT_REQUIRED_SKILLS) {
    const existing = weightMap.get(fallbackSkill.skill) || 0;
    weightMap.set(fallbackSkill.skill, existing + fallbackSkill.weight);
  }

  const sorted = [...weightMap.entries()].sort((a, b) => b[1] - a[1]);
  const requiredSkills = sorted.slice(0, 4).map(([skill]) => skill);
  const skillWeights: Record<string, number> = {};

  for (const [skill, weight] of sorted.slice(0, 4)) {
    skillWeights[skill] = Math.max(0.5, Number(weight.toFixed(3)));
  }

  return { requiredSkills, skillWeights };
}

function getStudentSkillScore(scores: SkillScores, requiredSkill: string): number {
  const aliases = SKILL_ALIASES[requiredSkill] || [];
  const candidates = [requiredSkill, ...aliases].map(normalizeSkillKey);

  let best = -1;
  for (const [skillName, rawScore] of Object.entries(scores)) {
    const score = Number(rawScore);
    if (!Number.isFinite(score)) {
      continue;
    }

    const normalizedName = normalizeSkillKey(skillName);
    const isMatched = candidates.some(
      (candidate) => normalizedName.includes(candidate) || candidate.includes(normalizedName),
    );
    if (isMatched) {
      best = Math.max(best, score);
    }
  }

  if (best >= 0) {
    return Math.round(clamp(best));
  }

  const allScores = Object.values(scores)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
  if (allScores.length === 0) {
    return 0;
  }

  const average = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  return Math.round(clamp(average * 0.78));
}

function calculateMatchPercentage(
  matchedSkills: MatchedSkillScore[],
  skillWeights: Record<string, number>,
  domainConfidence: number,
): number {
  if (matchedSkills.length === 0) {
    return 0;
  }

  const weightedTotal = matchedSkills.reduce((sum, skill) => {
    const weight = skillWeights[skill.skill] || 1;
    return sum + skill.score * weight;
  }, 0);
  const totalWeight = matchedSkills.reduce((sum, skill) => {
    return sum + (skillWeights[skill.skill] || 1);
  }, 0);

  const weightedAverage = totalWeight > 0 ? weightedTotal / totalWeight : 0;
  const coverageRatio =
    matchedSkills.filter((skill) => skill.score >= 65).length / matchedSkills.length;
  const excellenceRatio =
    matchedSkills.filter((skill) => skill.score >= 80).length / matchedSkills.length;

  const score = Math.round(
    Math.min(
      99,
      weightedAverage * 0.82 +
        coverageRatio * 12 +
        excellenceRatio * 6 +
        Math.max(0, Math.min(1, domainConfidence)) * 8,
    ),
  );
  return Math.max(0, score);
}

function sanitizeSkillScores(rawScores: unknown): SkillScores {
  if (!rawScores || typeof rawScores !== 'object' || Array.isArray(rawScores)) {
    return {};
  }

  const result: SkillScores = {};
  for (const [key, value] of Object.entries(rawScores as Record<string, unknown>)) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      continue;
    }
    result[key] = clamp(numericValue);
  }

  return result;
}

export function recommendProgramsBySkills(
  programs: ProgramForMatching[],
  rawSkillScores: unknown,
  limit = 8,
  options: ProgramRecommendationOptions = {},
): ProgramRecommendationResult[] {
  const skillScores = sanitizeSkillScores(rawSkillScores);
  const hasSkillScores = Object.keys(skillScores).length > 0;

  const portfolioHints = uniqueStrings(normalizeStringList(options.portfolioHints));
  const detectedInterests = uniqueStrings(normalizeStringList(options.detectedInterests));
  const hintTokens = buildHintTokens(portfolioHints, detectedInterests);
  const strictPortfolioHint = Boolean(options.strictPortfolioHint && hintTokens.length > 0);
  const targetUniversities = detectTargetUniversities(hintTokens);

  if (!hasSkillScores && hintTokens.length === 0) {
    return [];
  }

  const hintDomains = detectHintDomains(hintTokens);

  const scored = programs.map((program) => {
    const programSource = buildProgramSource(program);
    const programUniversity = detectProgramUniversity(programSource);
    const domainMatches = detectProgramDomains(program);
    const strongestDomainScore = domainMatches[0]?.score || 0;
    const { requiredSkills, skillWeights } = pickRequiredSkills(domainMatches);

    const matchedSkills = requiredSkills.map((skill) => ({
      skill,
      score: hasSkillScores ? getStudentSkillScore(skillScores, skill) : 56,
    }));

    const baseMatch = hasSkillScores
      ? calculateMatchPercentage(matchedSkills, skillWeights, strongestDomainScore)
      : Math.round(40 + strongestDomainScore * 20);

    const hintHits =
      hintTokens.length > 0
        ? hintTokens.filter((token) => programSource.includes(token)).length
        : 0;
    const hintCoverage =
      hintTokens.length > 0 ? hintHits / Math.min(12, hintTokens.length) : 0;

    const programDomainNames = new Set(domainMatches.map((item) => item.profile.name));
    const domainAligned =
      hintDomains.size > 0
        ? [...hintDomains].some((domainName) => programDomainNames.has(domainName))
        : false;

    let finalScore = baseMatch;
    if (hintTokens.length > 0) {
      finalScore += hintCoverage * 36;
      if (domainAligned) {
        finalScore += 10;
      }
      if (hintHits >= 3) {
        finalScore += 6;
      }
      if (strictPortfolioHint && hintCoverage < 0.12) {
        finalScore -= 14;
      }
      if (strictPortfolioHint && hintDomains.size > 0 && !domainAligned) {
        finalScore -= 18;
      }
    }

    let universityMatched = false;
    if (targetUniversities.size > 0) {
      universityMatched = programUniversity ? targetUniversities.has(programUniversity) : false;
      if (universityMatched) {
        finalScore += 34;
      } else {
        finalScore -= strictPortfolioHint ? 42 : 18;
      }
    }

    finalScore = clamp(Math.round(finalScore), 0, 99);

    return {
      recommendation: {
        id: program.id,
        university_id: program.university_id,
        university_name_th: program.university_name_th,
        university_name_en: program.university_name_en,
        faculty_name_th: program.faculty_name_th,
        faculty_name_en: program.faculty_name_en,
        field_name_th: program.field_name_th,
        field_name_en: program.field_name_en,
        program_name_th: program.program_name_th,
        program_name_en: program.program_name_en,
        logo_url: program.logo_url,
        required_skills: requiredSkills,
        matched_skills: matchedSkills,
        match_percentage: finalScore,
      } satisfies ProgramRecommendationResult,
      finalScore,
      hintCoverage,
      baseMatch,
      domainAligned,
      programUniversity,
      universityMatched,
    };
  });

  scored.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    if (b.hintCoverage !== a.hintCoverage) {
      return b.hintCoverage - a.hintCoverage;
    }
    if (b.baseMatch !== a.baseMatch) {
      return b.baseMatch - a.baseMatch;
    }
    return a.recommendation.id - b.recommendation.id;
  });

  const strictCandidates = strictPortfolioHint
    ? scored.filter((item) => item.hintCoverage >= 0.12 || item.domainAligned)
    : [];

  const universityCandidates =
    targetUniversities.size > 0
      ? scored.filter((item) => item.universityMatched)
      : [];

  let finalCandidates = strictCandidates.length >= 3 ? strictCandidates : scored;
  if (universityCandidates.length > 0) {
    finalCandidates = universityCandidates;
  }

  const finalLimit = Math.max(1, Math.min(20, limit));

  return finalCandidates.slice(0, finalLimit).map((item) => item.recommendation);
}
