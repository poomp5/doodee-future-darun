export type FacultyRound = {
  round: string;
  start: string; // ISO
  end: string;   // ISO
  badge: string; // e.g., "Portfolio (รอบ 1)"
};

export type FacultyCalendar = {
  id: string;
  name: string;
  university: string;
  rounds: FacultyRound[];
};

export const facultyCalendar: FacultyCalendar[] = [
  {
    id: "eng-chula",
    name: "วิศวกรรมศาสตร์",
    university: "จุฬาลงกรณ์มหาวิทยาลัย",
    rounds: [
      {
        round: "portfolio",
        badge: "Portfolio (รอบ 1)",
        start: "2026-10-15T00:00:00+07:00",
        end: "2026-11-15T23:59:59+07:00",
      },
      {
        round: "quota",
        badge: "Quota (รอบ 2)",
        start: "2027-02-12T00:00:00+07:00",
        end: "2027-03-12T23:59:59+07:00",
      },
      {
        round: "admission",
        badge: "Admission (รอบ 3)",
        start: "2027-05-06T00:00:00+07:00",
        end: "2027-05-12T23:59:59+07:00",
      },
    ],
  },
  {
    id: "med-kmu",
    name: "แพทยศาสตร์",
    university: "มหาวิทยาลัยขอนแก่น",
    rounds: [
      {
        round: "portfolio",
        badge: "Portfolio (รอบ 1)",
        start: "2026-10-01T00:00:00+07:00",
        end: "2026-10-10T23:59:59+07:00",
      },
      {
        round: "quota",
        badge: "Quota (รอบ 2)",
        start: "2027-03-02T00:00:00+07:00",
        end: "2027-03-11T23:59:59+07:00",
      },
    ],
  },
  {
    id: "arch-tu",
    name: "สถาปัตยกรรมศาสตร์",
    university: "มหาวิทยาลัยธรรมศาสตร์",
    rounds: [
      {
        round: "portfolio",
        badge: "Portfolio (รอบ 1)",
        start: "2026-10-15T00:00:00+07:00",
        end: "2026-11-17T23:59:59+07:00",
      },
      {
        round: "admission",
        badge: "Admission (รอบ 3)",
        start: "2027-05-06T00:00:00+07:00",
        end: "2027-05-12T23:59:59+07:00",
      },
    ],
  },
];
