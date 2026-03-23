import {
  CheckCircle2,
  FileText,
  Mail,
  Shield,
  Sparkles,
} from "lucide-react";

type LegalKind = "terms" | "privacy" | "contact";
type Locale = "th" | "en";

const copy = {
  th: {
    eyebrow: "เอกสารทางกฎหมาย",
    intro:
      "Doodee Future ใช้เอกสารชุดนี้เพื่ออธิบายสิทธิ หน้าที่ และขอบเขตการใช้ข้อมูลเมื่อคุณเข้าสู่ระบบ ใช้งานแพลตฟอร์ม หรืออัปโหลดไฟล์เข้ามาในระบบ",
    summaryTitle: "สรุปแบบสั้น",
    summary: [
      "การเข้าสู่ระบบและการใช้งานแพลตฟอร์มถือเป็นการยอมรับเงื่อนไขและแนวทางการใช้ข้อมูลตามที่ระบุไว้ในหน้านี้",
      "ข้อมูลบัญชี ข้อมูลการใช้งาน และไฟล์ที่คุณอัปโหลด อาจถูกใช้เพื่อประมวลผล วิเคราะห์ ปรับปรุงผลลัพธ์ และรักษาความปลอดภัยของระบบ",
      "หากคุณไม่ยอมรับข้อกำหนดเหล่านี้ ควรงดใช้งานบริการหรือหลีกเลี่ยงการอัปโหลดข้อมูลที่มีความอ่อนไหวเข้าสู่ระบบ",
    ],
    termsTitle: "เงื่อนไขการใช้งาน",
    privacyTitle: "นโยบายความเป็นส่วนตัว",
    contactTitle: "ช่องทางการติดต่อ",
    sections: {
      terms: [
        {
          title: "1. การยอมรับเงื่อนไข",
          body:
            "เมื่อคุณเข้าสู่ระบบ เชื่อมต่อบัญชี หรือลงใช้งานบริการของ Doodee Future ถือว่าคุณรับทราบและยอมรับเงื่อนไขการใช้งานฉบับนี้ รวมถึงแนวทางการประมวลผลข้อมูลที่เกี่ยวข้องกับบริการของเรา",
        },
        {
          title: "2. ขอบเขตของบริการ",
          body:
            "แพลตฟอร์มของเราให้บริการด้านการวิเคราะห์ portfolio, การแนะนำคณะ/หลักสูตร, การติดตามกิจกรรมและคอร์ส, และฟีเจอร์ที่เกี่ยวข้องกับการพัฒนาตนเอง โดยผลลัพธ์บางส่วนอาจสร้างจากระบบอัตโนมัติหรือ AI เพื่อช่วยประกอบการตัดสินใจ",
        },
        {
          title: "3. ความรับผิดชอบของผู้ใช้งาน",
          body:
            "คุณต้องรับผิดชอบต่อข้อมูลที่อัปโหลด ความถูกต้องของข้อมูลบัญชี และการใช้งานแพลตฟอร์มอย่างเหมาะสม ห้ามอัปโหลดเนื้อหาที่ละเมิดสิทธิผู้อื่น ผิดกฎหมาย เป็นอันตราย หรือพยายามรบกวนความมั่นคงปลอดภัยของระบบ",
        },
        {
          title: "4. การประมวลผลไฟล์และผลลัพธ์",
          body:
            "ไฟล์ portfolio, รูปภาพ, PDF และข้อมูลที่เกี่ยวข้อง อาจถูกส่งผ่านกระบวนการ OCR, การวิเคราะห์เชิงโครงสร้าง, และการประมวลผลด้วย AI เพื่อสร้างผลลัพธ์ คำแนะนำ และสรุปข้อมูลเฉพาะสำหรับบัญชีของคุณ",
        },
        {
          title: "5. ข้อจำกัดความรับผิด",
          body:
            "Doodee Future พยายามให้ผลลัพธ์ที่เป็นประโยชน์และถูกต้องที่สุดเท่าที่เป็นไปได้ แต่ไม่รับประกันว่าผลวิเคราะห์หรือคำแนะนำทั้งหมดจะถูกต้องสมบูรณ์ในทุกกรณี ผู้ใช้ควรใช้วิจารณญาณและตรวจสอบข้อมูลสำคัญเพิ่มเติมก่อนตัดสินใจ",
        },
        {
          title: "6. การแก้ไขเปลี่ยนแปลงบริการ",
          body:
            "เราอาจปรับปรุง เปลี่ยนแปลง หรือยุติฟีเจอร์บางส่วนของระบบ รวมถึงแก้ไขเงื่อนไขการใช้งานฉบับนี้ตามความเหมาะสม โดยการใช้งานต่อหลังการปรับปรุงถือเป็นการยอมรับฉบับล่าสุด",
        },
      ],
      privacy: [
        {
          title: "1. ประเภทข้อมูลที่เก็บ",
          body:
            "เราอาจเก็บข้อมูลบัญชี เช่น ชื่อ อีเมล รูปโปรไฟล์ ผู้ให้บริการเข้าสู่ระบบ ข้อมูลการใช้งานในระบบ ข้อมูลอุปกรณ์ และไฟล์ที่คุณอัปโหลด รวมถึงผลวิเคราะห์หรือ metadata ที่เกิดขึ้นจากการประมวลผลไฟล์เหล่านั้น",
        },
        {
          title: "2. วัตถุประสงค์ในการใช้ข้อมูล",
          body:
            "ข้อมูลของคุณถูกใช้เพื่อให้บริการวิเคราะห์ portfolio, สร้างผลลัพธ์เฉพาะบุคคล, แสดงประวัติการใช้งาน, ยืนยันตัวตน, ป้องกันการใช้งานที่ไม่เหมาะสม, ดูแลความปลอดภัยของระบบ และปรับปรุงคุณภาพบริการโดยรวม",
        },
        {
          title: "3. การใช้ข้อมูลเพื่อการประมวลผล",
          body:
            "เมื่อคุณอัปโหลดไฟล์ ข้อมูลในไฟล์นั้นอาจถูกประมวลผลผ่านบริการจัดเก็บไฟล์, OCR, เครื่องมือวิเคราะห์เอกสาร, และระบบ AI ที่เกี่ยวข้องกับฟีเจอร์ของแพลตฟอร์ม เพื่อให้สามารถสร้าง preview, extract ข้อความ, และสร้างคำแนะนำกลับไปยังบัญชีของคุณ",
        },
        {
          title: "4. การแบ่งปันข้อมูล",
          body:
            "เราไม่ขายข้อมูลส่วนบุคคลของคุณ แต่ข้อมูลบางส่วนอาจถูกประมวลผลผ่านผู้ให้บริการโครงสร้างพื้นฐานหรือเครื่องมือที่จำเป็นต่อการให้บริการ เช่น ระบบยืนยันตัวตน ระบบจัดเก็บไฟล์ CDN หรือผู้ให้บริการ AI ตามขอบเขตที่จำเป็น",
        },
        {
          title: "5. การเก็บรักษาและความปลอดภัย",
          body:
            "เราดำเนินมาตรการตามสมควรเพื่อปกป้องข้อมูลจากการเข้าถึง ใช้งาน หรือเปิดเผยโดยไม่ได้รับอนุญาต และจะเก็บข้อมูลไว้เท่าที่จำเป็นต่อการให้บริการ การปฏิบัติตามข้อกำหนด และการปรับปรุงระบบ",
        },
        {
          title: "6. สิทธิของผู้ใช้งาน",
          body:
            "คุณสามารถหยุดใช้งานบริการ ลบข้อมูลบางส่วนจากพื้นที่ของคุณ หรือร้องขอให้ตรวจสอบข้อมูลที่เกี่ยวข้องกับบัญชีของคุณได้ตามช่องทางที่ระบบรองรับ ทั้งนี้ข้อมูลบางประเภทอาจยังต้องถูกเก็บไว้ตามเหตุผลด้านความปลอดภัยหรือข้อกำหนดทางเทคนิค",
        },
      ],
      contact: [
        {
          title: "1. ช่องทางติดต่อหลัก",
          body:
            "หากคุณต้องการติดต่อ Doodee Future เกี่ยวกับการใช้งานระบบ ปัญหาบัญชี การเข้าถึงข้อมูล หรือคำถามเกี่ยวกับเอกสารทางกฎหมาย คุณสามารถติดต่อทีมงานผ่านช่องทางที่ระบุไว้ในหน้าทางการของแพลตฟอร์มและบัญชีที่เกี่ยวข้องกับบริการของเรา",
        },
        {
          title: "2. การติดต่อเรื่องข้อมูลส่วนบุคคล",
          body:
            "คำขอที่เกี่ยวข้องกับข้อมูลส่วนบุคคล เช่น การตรวจสอบข้อมูลที่ผูกกับบัญชี การแจ้งแก้ไขข้อมูล หรือการขอลบข้อมูลบางส่วน ควรส่งมาพร้อมรายละเอียดที่เพียงพอเพื่อให้ทีมงานสามารถยืนยันตัวตนและตรวจสอบคำขอได้อย่างเหมาะสม",
        },
        {
          title: "3. การรายงานปัญหาทางเทคนิค",
          body:
            "สำหรับปัญหาเกี่ยวกับการเข้าสู่ระบบ การอัปโหลดไฟล์ การเชื่อมต่อบัญชี หรือผลการประมวลผลที่ผิดปกติ กรุณาระบุเวลา ปัญหาที่พบ และภาพหน้าจอหรือข้อมูลประกอบเท่าที่จำเป็น เพื่อช่วยให้ทีมงานตรวจสอบได้รวดเร็วขึ้น",
        },
        {
          title: "4. ระยะเวลาในการตอบกลับ",
          body:
            "ทีมงานจะพยายามตอบกลับภายในระยะเวลาที่เหมาะสมตามความเร่งด่วนและความซับซ้อนของเรื่องที่ได้รับ โดยบางกรณีอาจต้องใช้เวลาตรวจสอบเพิ่มเติมก่อนให้คำตอบหรือดำเนินการตามคำขอ",
        },
      ],
    },
  },
  en: {
    eyebrow: "Legal Documents",
    intro:
      "This legal hub explains the rights, responsibilities, and data processing scope that apply when you sign in, use the platform, or upload files to Doodee Future.",
    summaryTitle: "Quick Summary",
    summary: [
      "Signing in and using the platform means you accept the terms and data practices described here.",
      "Account data, usage data, and uploaded files may be used for processing, analysis, personalization, service quality, and platform security.",
      "If you do not agree with these terms, you should stop using the service and avoid uploading sensitive content.",
    ],
    termsTitle: "Terms of Service",
    privacyTitle: "Privacy Policy",
    contactTitle: "Contact Channels",
    sections: {
      terms: [
        {
          title: "1. Acceptance of Terms",
          body:
            "By signing in, connecting an account, or using Doodee Future, you acknowledge and accept these terms together with the related data-processing practices that support the service.",
        },
        {
          title: "2. Scope of Service",
          body:
            "Our platform provides portfolio analysis, academic guidance, program recommendations, activity tracking, and related self-development features. Some outputs may be generated with automated systems or AI to support decision-making.",
        },
        {
          title: "3. User Responsibilities",
          body:
            "You are responsible for the information you submit, the files you upload, and the way you use the platform. You must not upload unlawful, infringing, harmful, or abusive content, or attempt to interfere with platform security.",
        },
        {
          title: "4. File Processing and Results",
          body:
            "Uploaded portfolio files, images, PDFs, and related data may go through OCR, structured analysis, and AI-assisted processing in order to generate outputs, recommendations, and account-specific insights.",
        },
        {
          title: "5. Limitation of Liability",
          body:
            "We aim to provide useful and reliable outputs, but we cannot guarantee that every analysis or recommendation will be fully accurate in every situation. Users should independently review critical information before making decisions.",
        },
        {
          title: "6. Service Changes",
          body:
            "We may improve, change, or discontinue parts of the service and update these terms when needed. Continued use after updates means you accept the latest version.",
        },
      ],
      privacy: [
        {
          title: "1. Data We Collect",
          body:
            "We may collect account details such as name, email, profile image, sign-in provider details, usage records, device-related information, uploaded files, and metadata or analysis results generated from those files.",
        },
        {
          title: "2. Why We Use Data",
          body:
            "Your data is used to provide portfolio analysis, personalized outputs, usage history, authentication, abuse prevention, security monitoring, and product improvement.",
        },
        {
          title: "3. Processing of Uploaded Files",
          body:
            "When you upload files, their contents may be processed by storage infrastructure, OCR systems, document analysis tools, and AI services required to create previews, extract text, and generate personalized results.",
        },
        {
          title: "4. Data Sharing",
          body:
            "We do not sell your personal data. Some information may be processed through infrastructure or service providers that are necessary for authentication, file hosting, CDN delivery, and AI-supported features.",
        },
        {
          title: "5. Retention and Security",
          body:
            "We take reasonable measures to protect data against unauthorized access, use, or disclosure. Data is retained only as long as necessary for service delivery, technical operations, security, and product improvement.",
        },
        {
          title: "6. User Rights",
          body:
            "You may stop using the service, delete some of your own content, or request review of account-related data through supported channels. Certain records may still be retained where needed for security or technical reasons.",
        },
      ],
      contact: [
        {
          title: "1. Main Contact Channels",
          body:
            "If you need to contact Doodee Future about platform usage, account issues, access to data, or questions about legal documents, please reach out through the official channels listed on our platform and service-related accounts.",
        },
        {
          title: "2. Personal Data Requests",
          body:
            "Requests related to personal data, such as reviewing account-linked information, correcting information, or requesting deletion of certain data, should include enough detail for the team to verify identity and review the request appropriately.",
        },
        {
          title: "3. Technical Issue Reports",
          body:
            "For sign-in issues, file upload problems, connected-account errors, or unexpected processing results, please include the time of the issue, what happened, and any relevant screenshots or context that can help with investigation.",
        },
        {
          title: "4. Response Time",
          body:
            "Our team will try to respond within a reasonable time based on the urgency and complexity of each request. Some cases may require additional review before we can provide a final response or take action.",
        },
      ],
    },
  },
} satisfies Record<Locale, any>;

export default function LegalHubPage({
  locale,
  focus,
}: {
  locale: Locale;
  focus: LegalKind;
}) {
  const t = copy[locale];
  const sectionMap = {
    terms: {
      id: "terms",
      icon: FileText,
      title: t.termsTitle,
      sections: t.sections.terms,
    },
    privacy: {
      id: "privacy",
      icon: Shield,
      title: t.privacyTitle,
      sections: t.sections.privacy,
    },
    contact: {
      id: "contact",
      icon: Mail,
      title: t.contactTitle,
      sections: t.sections.contact,
    },
  } as const;

  const orderedSections = [
    sectionMap[focus],
    ...(["terms", "privacy", "contact"] as const)
      .filter((key) => key !== focus)
      .map((key) => sectionMap[key]),
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-pink-100 bg-gradient-to-br from-white via-pink-50/70 to-rose-100/80 p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-2xl">
            <p
              className={`text-xs font-semibold text-pink-500 ${
                locale === "en" ? "uppercase tracking-[0.22em]" : ""
              }`}
            >
              {t.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              {focus === "privacy"
                ? t.privacyTitle
                : focus === "contact"
                  ? t.contactTitle
                  : t.termsTitle}
            </h1>
            <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
              {t.intro}
            </p>
          </div>

          <div className="rounded-3xl bg-white/80 p-5 ring-1 ring-pink-100 backdrop-blur">
            <div className="flex items-center gap-2 text-pink-600">
              <Sparkles className="h-4 w-4" />
              <p className="text-sm font-semibold">{t.summaryTitle}</p>
            </div>
            <ul className="mt-4 space-y-3">
              {t.summary.map((item: string) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                  <span className="leading-6">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {orderedSections.map((group) => {
        const Icon = group.icon;
        return (
          <section
            key={group.id}
            id={group.id}
            className="scroll-mt-28 rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm md:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-2xl bg-pink-50 p-3 text-pink-600">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{group.title}</h2>
                <p className="text-sm text-gray-500">
                  {group.id === "terms"
                    ? locale === "th"
                      ? "ข้อตกลงที่เกี่ยวข้องกับการใช้งานบริการและความรับผิดชอบของผู้ใช้"
                      : "Rules, service scope, and responsibilities when using the platform"
                    : group.id === "privacy"
                      ? locale === "th"
                        ? "แนวทางการเก็บ ใช้ ประมวลผล และปกป้องข้อมูลของผู้ใช้งาน"
                        : "How user data is collected, processed, and protected"
                      : locale === "th"
                        ? "ช่องทางสำหรับติดต่อทีมงานเกี่ยวกับบัญชี ระบบ และคำขอด้านข้อมูล"
                        : "Ways to reach the team about accounts, platform issues, and data requests"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {group.sections.map((section: { title: string; body: string }) => (
                <article
                  key={section.title}
                  className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5"
                >
                  <h3 className="text-base font-semibold text-gray-900">{section.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{section.body}</p>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
