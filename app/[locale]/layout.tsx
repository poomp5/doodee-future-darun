import "../globals.css";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/components/AuthProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/routing';
import LayoutWrapper from "@/components/LayoutWrapper";
import QueryProvider from "@/components/QueryProvider";
import AppErrorBoundary from "@/components/AppErrorBoundary";
import LayoutSkeleton from "@/components/LayoutSkeleton";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import SWRProvider from "@/components/SWRProvider";

// const kanit = Kanit({ subsets: ["latin"], weight: ["400", "700"] });

export const viewport: Viewport = {
  themeColor: '#ec4899',
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;

  const title = locale === 'th'
    ? "Doodee Future | เตรียมเข้ามหาลัยแบบครบวงจร วิเคราะห์ Portfolio AI"
    : "Doodee Future | Complete University Preparation & AI Portfolio Analysis";

  const description = locale === 'th'
    ? "แพลตฟอร์มแนะแนวการศึกษาอันดับ 1 เตรียมเข้ามหาลัยแบบครบวงจร วิเคราะห์ Portfolio ด้วย AI ค้นหากิจกรรมและคอร์ส คำนวณ GPAX และรับคำแนะนำคณะที่เหมาะกับคุณ"
    : "Thailand's #1 educational guidance platform for university preparation. AI-powered portfolio analysis, activities and courses discovery, GPAX calculator, and personalized faculty recommendations";

  const keywords = locale === 'th'
    ? "เตรียมเข้ามหาลัย, TCAS, รอบ 1, Portfolio, วิเคราะห์ Portfolio, AI, แนะแนว, มหาวิทยาลัย, คณะ, GPAX, คำนวณเกรด, จุฬาลงกรณ์, มหิดล, เกษตรศาสตร์, ธรรมศาสตร์, Doodee Future, เตรียมสอบ, แผนการเรียน"
    : "university preparation, TCAS, portfolio, AI analysis, Thailand university, faculty recommendation, GPAX calculator, Chulalongkorn, Mahidol, Kasetsart, Thammasat, Doodee Future";

  return {
    title,
    description,
    keywords,
    metadataBase: new URL("https://doodee-future.com"),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'th': '/th',
        'en': '/en',
      },
    },
    authors: [{ name: 'Doodee Future' }],
    openGraph: {
      type: 'website',
      locale: locale === 'th' ? 'th_TH' : 'en_US',
      url: 'https://doodee-future.com',
      siteName: 'Doodee Future',
      title,
      description,
      images: [
        {
          url: '/doodee-cover-new.png',
          width: 1200,
          height: 630,
          alt: 'Doodee Future - เตรียมเข้ามหาลัยแบบครบวงจร',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/doodee-cover-new.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },
    other: {
      'og:image:width': '1200',
      'og:image:height': '630',
      'geo.region': 'TH',
      'geo.placename': 'Thailand',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages({ locale });

  // JSON-LD Structured Data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://doodee-future.com/#website',
        url: 'https://doodee-future.com',
        name: 'Doodee Future',
        description: locale === 'th'
          ? 'แพลตฟอร์มแนะแนวการศึกษา เตรียมเข้ามหาลัยแบบครบวงจร'
          : 'Educational guidance platform for university preparation',
        publisher: { '@id': 'https://doodee-future.com/#organization' },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: 'https://doodee-future.com/faculty?search={search_term_string}',
          },
          'query-input': 'required name=search_term_string',
        },
        inLanguage: locale === 'th' ? 'th-TH' : 'en-US',
      },
      {
        '@type': 'Organization',
        '@id': 'https://doodee-future.com/#organization',
        name: 'Doodee Future',
        url: 'https://doodee-future.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://doodee-future.com/doodee_logo.png',
          width: 512,
          height: 512,
        },
        sameAs: [
          'https://www.facebook.com/doodeefuture',
          'https://www.instagram.com/doodeefuture',
          'https://www.tiktok.com/@doodeefuture',
        ],
      },
      {
        '@type': 'EducationalOrganization',
        '@id': 'https://doodee-future.com/#educationalorg',
        name: 'Doodee Future',
        description: locale === 'th'
          ? 'แพลตฟอร์มแนะแนวการศึกษาและเตรียมเข้ามหาวิทยาลัย วิเคราะห์ Portfolio ด้วย AI คำนวณ GPAX แนะนำคณะที่เหมาะสม'
          : 'Educational guidance platform for university preparation with AI portfolio analysis, GPAX calculator, and faculty recommendations',
        url: 'https://doodee-future.com',
        areaServed: {
          '@type': 'Country',
          name: 'Thailand',
        },
        serviceType: locale === 'th'
          ? ['แนะแนวการศึกษา', 'วิเคราะห์ Portfolio', 'คำนวณ GPAX', 'เตรียมสอบ TCAS']
          : ['Educational Guidance', 'Portfolio Analysis', 'GPAX Calculator', 'TCAS Preparation'],
      },
      {
        '@type': 'BreadcrumbList',
        '@id': 'https://doodee-future.com/#breadcrumb',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: locale === 'th' ? 'หน้าแรก' : 'Home',
            item: 'https://doodee-future.com',
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NextIntlClientProvider messages={messages}>
        <AuthProvider>
          <Toaster position="top-right" reverseOrder={false} />
          <QueryProvider>
            <SWRProvider>
              <Suspense fallback={<LayoutSkeleton />}>
                <AppErrorBoundary>
                  <LayoutWrapper>{children}</LayoutWrapper>
                </AppErrorBoundary>
              </Suspense>
            </SWRProvider>
          </QueryProvider>
        </AuthProvider>
      </NextIntlClientProvider>
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
