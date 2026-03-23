import type { SubjectDefinition, FacultyCriteria } from "@/types/mock-exam";

export const SUBJECTS: SubjectDefinition[] = [
  { code: "MATH", name: "Mathematics" },
  { code: "PHYSICS", name: "Physics" },
  { code: "ENGLISH", name: "English" },
  { code: "CHEMISTRY", name: "Chemistry" },
  { code: "BIOLOGY", name: "Biology" },
  { code: "THAI", name: "Thai Language" },
  { code: "SOCIAL", name: "Social Studies" },
  { code: "TGAT1", name: "TGAT1 - Thai Communication" },
  { code: "TGAT2", name: "TGAT2 - Critical Thinking" },
  { code: "TGAT3", name: "TGAT3 - Future Workforce Competency" },
  { code: "TPAT3", name: "TPAT3 - Science, Technology, Engineering" },
  { code: "TPAT5", name: "TPAT5 - Teacher Aptitude" },
];

export const DEFAULT_FACULTY_CRITERIA: FacultyCriteria[] = [
  {
    faculty: "Engineering (Computer)",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 60, weight: 0.4 },
      { subject: "PHYSICS", min: 50, weight: 0.4 },
      { subject: "ENGLISH", min: 40, weight: 0.2 },
    ],
  },
  {
    faculty: "Engineering (Electrical)",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 55, weight: 0.35 },
      { subject: "PHYSICS", min: 55, weight: 0.35 },
      { subject: "ENGLISH", min: 40, weight: 0.15 },
      { subject: "CHEMISTRY", min: 40, weight: 0.15 },
    ],
  },
  {
    faculty: "Medicine",
    university: "Mahidol University",
    requirements: [
      { subject: "BIOLOGY", min: 70, weight: 0.3 },
      { subject: "CHEMISTRY", min: 65, weight: 0.25 },
      { subject: "MATH", min: 60, weight: 0.2 },
      { subject: "ENGLISH", min: 55, weight: 0.15 },
      { subject: "PHYSICS", min: 50, weight: 0.1 },
    ],
  },
  {
    faculty: "Science (Computer Science)",
    university: "Kasetsart University",
    requirements: [
      { subject: "MATH", min: 50, weight: 0.45 },
      { subject: "ENGLISH", min: 40, weight: 0.3 },
      { subject: "PHYSICS", min: 40, weight: 0.25 },
    ],
  },
  {
    faculty: "Arts (English)",
    university: "Thammasat University",
    requirements: [
      { subject: "ENGLISH", min: 65, weight: 0.6 },
      { subject: "THAI", min: 45, weight: 0.2 },
      { subject: "SOCIAL", min: 40, weight: 0.2 },
    ],
  },
  {
    faculty: "Commerce and Accountancy",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 60, weight: 0.4 },
      { subject: "ENGLISH", min: 55, weight: 0.4 },
      { subject: "THAI", min: 40, weight: 0.2 },
    ],
  },
  {
    faculty: "Engineering (Civil)",
    university: "King Mongkut's University of Technology Thonburi",
    requirements: [
      { subject: "MATH", min: 50, weight: 0.4 },
      { subject: "PHYSICS", min: 50, weight: 0.35 },
      { subject: "ENGLISH", min: 35, weight: 0.25 },
    ],
  },
  {
    faculty: "Architecture",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 55, weight: 0.3 },
      { subject: "PHYSICS", min: 45, weight: 0.25 },
      { subject: "ENGLISH", min: 50, weight: 0.25 },
      { subject: "THAI", min: 40, weight: 0.2 },
    ],
  },
];
