import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import {
  downloadAndUploadUniversityLogoWithCache,
  clearLogoCache,
} from '@/lib/r2-logo';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large imports

// Hardcoded data source URLs
const DATA_SOURCES = {
  universities: 'https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/universities.json',
  courses: 'https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/courses.json',
};

interface ProgramData {
  university_type_id?: string;
  university_type_name_th?: string;
  university_id?: string;
  university_name_th?: string;
  university_name_en?: string;
  campus_id?: string;
  campus_name_th?: string;
  campus_name_en?: string;
  faculty_id?: string;
  faculty_name_th?: string;
  faculty_name_en?: string;
  group_field_id?: string;
  group_field_th?: string;
  field_id?: string;
  field_name_th?: string;
  field_name_en?: string;
  program_running_number?: string;
  program_name_th?: string;
  program_name_en?: string;
  program_type_id?: string;
  program_type_name_th?: string;
  program_id?: string;
  number_acceptance_mko2?: number;
  program_partners_id?: string;
  program_partners_inter_name?: string;
  country_partners_name?: string;
  major_acceptance_number?: number;
  cost?: string;
  graduate_rate?: string;
  employment_rate?: string;
  median_salary?: string;
  logo_url?: string;
  // University-specific fields
  university_type?: string;
  is_accepted_round1?: boolean;
  is_accepted_round2?: boolean;
  is_accepted_round3?: boolean;
  is_accepted_round4?: boolean;
  file_path_1?: string;
  file_path_2?: string;
  file_path_3?: string;
  file_path_4?: string;
}

interface ImportStats {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  logosUploaded: number;
  universitiesCreated: number;
  universitiesUpdated: number;
  errors: Array<{ program_id: string; error: string }>;
}

/**
 * Check if user is admin
 */
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === 'admin' || user?.role === 'superadmin';
}

/**
 * POST - Trigger data import or preview
 * Body: {
 *   academic_year: string,
 *   upload_logos?: boolean,
 *   preview?: boolean,
 *   universities_url?: string,
 *   courses_url?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const {
      academic_year,
      skip_existing_logos = true,
      preview = false,
      universities_url = DATA_SOURCES.universities,
      courses_url = DATA_SOURCES.courses,
    } = body;

    // Validate academic year
    if (!academic_year || typeof academic_year !== 'string') {
      return NextResponse.json(
        { error: 'academic_year is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate year format (e.g., "2568")
    if (!/^\d{4}$/.test(academic_year)) {
      return NextResponse.json(
        { error: 'academic_year must be a 4-digit year (e.g., "2568")' },
        { status: 400 }
      );
    }

    console.log(`Starting ${preview ? 'preview' : 'import'} for academic year: ${academic_year}`);
    console.log(`Skip existing logos: ${skip_existing_logos}`);
    console.log(`Universities URL: ${universities_url}`);
    console.log(`Courses URL: ${courses_url}`);

    // Fetch data from both sources
    console.log('Fetching data from external sources...');
    const [universitiesRes, coursesRes] = await Promise.all([
      fetch(universities_url),
      fetch(courses_url),
    ]);

    if (!universitiesRes.ok || !coursesRes.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch data from external sources' },
        { status: 502 }
      );
    }

    const universitiesData: ProgramData[] = await universitiesRes.json();
    const coursesData: ProgramData[] = await coursesRes.json();

    // Combine both data sources
    const allPrograms = [...universitiesData, ...coursesData];
    const totalCount = allPrograms.length;

    console.log(`Fetched ${totalCount} programs`);

    // PREVIEW MODE - Return sample data without importing
    if (preview) {
      // Get unique universities for stats
      const uniqueUniversities = new Set(
        allPrograms.map((p) => p.university_id).filter(Boolean)
      );

      return NextResponse.json({
        preview: true,
        stats: {
          total: totalCount,
          universities: uniqueUniversities.size,
          universities_count: universitiesData.length,
          courses_count: coursesData.length,
        },
        universities: universitiesData,
        courses: coursesData,
        message: `Preview: Found ${totalCount} programs from ${uniqueUniversities.size} universities`,
      });
    }

    // IMPORT MODE - Proceed with database import
    // Clear logo cache at the start of import
    clearLogoCache();

    // Initialize stats
    const stats: ImportStats = {
      total: totalCount,
      created: 0,
      updated: 0,
      skipped: 0,
      logosUploaded: 0,
      universitiesCreated: 0,
      universitiesUpdated: 0,
      errors: [],
    };

    // Create a TransformStream for streaming progress
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Helper to send progress update
    const sendProgress = async (data: any) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    // Start processing in background
    (async () => {
      try {
        const BATCH_SIZE = 100;
        const batches = Math.ceil(allPrograms.length / BATCH_SIZE);

        // Track uploaded logos to avoid duplicates
        const uploadedLogos = new Set<string>();

        // Send initial progress
        await sendProgress({
          stage: 'processing',
          progress: 0,
          total: totalCount,
          stats,
          message: `INFO: Starting import of ${totalCount} programs in ${batches} batches...`,
        });

        // Log skip_existing_logos status
        if (skip_existing_logos) {
          await sendProgress({
            stage: 'processing',
            message: `INFO: Smart Mode: Skip existing logos in R2 - Upload only new logos (faster)`,
          });
        } else {
          await sendProgress({
            stage: 'processing',
            message: `INFO: Force Mode: Re-upload all logos - Overwrite existing logos in R2 (slower)`,
          });
        }

        for (let i = 0; i < batches; i++) {
          const start = i * BATCH_SIZE;
          const end = Math.min(start + BATCH_SIZE, allPrograms.length);
          const batch = allPrograms.slice(start, end);

          const batchMsg = `INFO: Processing batch ${i + 1}/${batches} (${start + 1}-${end})`;
          console.log(batchMsg);

          // Process batch with logo tracking
          await processBatch(batch, academic_year, skip_existing_logos, stats, uploadedLogos, sendProgress);

          // Calculate progress
          const progress = Math.round(((i + 1) / batches) * 100);

          const progressMsg = `SUCCESS: Batch ${i + 1}/${batches} complete - Programs: ${stats.created + stats.updated}, Universities: ${stats.universitiesCreated + stats.universitiesUpdated}, Logos: ${stats.logosUploaded}`;
          console.log(progressMsg);

          // Send progress update
          await sendProgress({
            stage: 'processing',
            progress,
            processed: end,
            total: totalCount,
            stats: {
              created: stats.created,
              updated: stats.updated,
              universitiesCreated: stats.universitiesCreated,
              universitiesUpdated: stats.universitiesUpdated,
              logosUploaded: stats.logosUploaded,
              errors: stats.errors.length,
            },
            message: progressMsg,
          });
        }

        // Clear cache after import
        clearLogoCache();

        const completionMsg = `SUCCESS: Import completed! Total: ${stats.total}, Programs Created: ${stats.created}, Programs Updated: ${stats.updated}, Universities Created: ${stats.universitiesCreated}, Universities Updated: ${stats.universitiesUpdated}, Logos uploaded: ${stats.logosUploaded}, Errors: ${stats.errors.length}`;
        console.log('Import complete:', stats);

        // Send error summary if there are errors
        if (stats.errors.length > 0) {
          await sendProgress({
            stage: 'processing',
            message: `WARNING: Error Summary: ${stats.errors.length} programs failed to import`,
          });

          // Log first 10 errors in detail
          const errorsToShow = stats.errors.slice(0, 10);
          for (const err of errorsToShow) {
            await sendProgress({
              stage: 'processing',
              message: `  • Program ${err.program_id}: ${err.error}`,
            });
          }

          if (stats.errors.length > 10) {
            await sendProgress({
              stage: 'processing',
              message: `  ... and ${stats.errors.length - 10} more errors`,
            });
          }
        }

        // Send final completion
        await sendProgress({
          stage: 'complete',
          progress: 100,
          stats,
          message: completionMsg,
        });
      } catch (error) {
        console.error('Import error in stream:', error);
        await sendProgress({
          stage: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        await writer.close();
      }
    })();

    // Return streaming response
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process a batch of programs
 */
async function processBatch(
  programs: ProgramData[],
  academicYear: string,
  skipExistingLogos: boolean,
  stats: ImportStats,
  uploadedLogos: Set<string>,
  sendProgress: (data: any) => Promise<void>
): Promise<void> {
  for (const programData of programs) {
    try {
      // Check if this is a university record (no program_id) or a program record (has program_id)
      if (!programData.program_id) {
        // This is a UNIVERSITY record - save to universities table
        if (!programData.university_id) {
          const identifyingInfo = programData.university_name_th || programData.university_name_en || 'unknown university';
          const errorMsg = `ERROR: Missing university_id: ${identifyingInfo}`;
          console.error(errorMsg, programData);
          await sendProgress({
            stage: 'processing',
            message: errorMsg,
          });
          stats.errors.push({
            program_id: 'N/A',
            error: `Missing university_id for: ${identifyingInfo}`,
          });
          continue;
        }

        // Handle university logo upload
        let universityLogoUrl = programData.logo_url;
        if (programData.university_id) {
          const shouldUpload = !skipExistingLogos || !uploadedLogos.has(programData.university_id);
          if (shouldUpload) {
            const logoResult = await downloadAndUploadUniversityLogoWithCache(
              programData.university_id
            );
            if (logoResult.success && logoResult.url) {
              universityLogoUrl = logoResult.url;
              uploadedLogos.add(programData.university_id);
              stats.logosUploaded++;
            }
          }
        }

        // Check if university exists
        const existingUniversity = await prisma.universities.findUnique({
          where: { university_id: programData.university_id },
          select: { id: true, academic_years: true },
        });

        if (existingUniversity) {
          // University exists - update it
          const yearExists = existingUniversity.academic_years.includes(academicYear);
          await prisma.universities.update({
            where: { university_id: programData.university_id },
            data: {
              university_type: programData.university_type || programData.university_type_id,
              university_type_id: programData.university_type_id,
              university_name_th: programData.university_name_th,
              university_name_en: programData.university_name_en,
              logo_url: universityLogoUrl || programData.logo_url,
              is_accepted_round1: programData.is_accepted_round1,
              is_accepted_round2: programData.is_accepted_round2,
              is_accepted_round3: programData.is_accepted_round3,
              is_accepted_round4: programData.is_accepted_round4,
              file_path_1: programData.file_path_1,
              file_path_2: programData.file_path_2,
              file_path_3: programData.file_path_3,
              file_path_4: programData.file_path_4,
              academic_years: yearExists
                ? existingUniversity.academic_years
                : { push: academicYear },
              updated_at: new Date(),
            },
          });
          stats.universitiesUpdated++;
        } else {
          // University doesn't exist - create it
          await prisma.universities.create({
            data: {
              university_id: programData.university_id,
              university_type: programData.university_type || programData.university_type_id,
              university_type_id: programData.university_type_id,
              university_name_th: programData.university_name_th,
              university_name_en: programData.university_name_en,
              logo_url: universityLogoUrl || programData.logo_url,
              is_accepted_round1: programData.is_accepted_round1,
              is_accepted_round2: programData.is_accepted_round2,
              is_accepted_round3: programData.is_accepted_round3,
              is_accepted_round4: programData.is_accepted_round4,
              file_path_1: programData.file_path_1,
              file_path_2: programData.file_path_2,
              file_path_3: programData.file_path_3,
              file_path_4: programData.file_path_4,
              academic_years: [academicYear],
            },
          });
          stats.universitiesCreated++;
        }
        continue; // Skip program processing for university records
      }

      // Handle logo upload based on skipExistingLogos flag
      let r2LogoUrl = programData.logo_url;

      if (programData.university_id) {
        // If skipExistingLogos is true: only upload if NOT already uploaded (skip existing)
        // If skipExistingLogos is false: always upload (force re-upload, overwrite existing)
        const shouldUpload = !skipExistingLogos || !uploadedLogos.has(programData.university_id);

        if (shouldUpload) {
          const logoResult = await downloadAndUploadUniversityLogoWithCache(
            programData.university_id
          );

          if (logoResult.success && logoResult.url) {
            r2LogoUrl = logoResult.url;
            uploadedLogos.add(programData.university_id);
            stats.logosUploaded++;
          } else {
            console.warn(
              `Failed to upload logo for university ${programData.university_id}, using original URL`
            );
          }
        }
      }

      // Check if program exists
      const existingProgram = await prisma.programs.findUnique({
        where: { program_id: programData.program_id },
        select: { id: true, academic_years: true },
      });

      if (existingProgram) {
        // Program exists - check if academic year is already in array
        const yearExists = existingProgram.academic_years.includes(academicYear);

        if (yearExists) {
          // Year already exists - UPDATE data only
          await prisma.programs.update({
            where: { program_id: programData.program_id },
            data: {
              ...convertToDatabaseFormat(programData),
              logo_url: r2LogoUrl || programData.logo_url,
              updated_at: new Date(),
            },
          });
          stats.updated++;
        } else {
          // Year doesn't exist - APPEND to academic_years and UPDATE
          await prisma.programs.update({
            where: { program_id: programData.program_id },
            data: {
              ...convertToDatabaseFormat(programData),
              logo_url: r2LogoUrl || programData.logo_url,
              academic_years: {
                push: academicYear,
              },
              updated_at: new Date(),
            },
          });
          stats.updated++;
        }
      } else {
        // Program doesn't exist - CREATE with academic year
        await prisma.programs.create({
          data: {
            ...convertToDatabaseFormat(programData),
            logo_url: r2LogoUrl || programData.logo_url,
            academic_years: [academicYear],
          },
        });
        stats.created++;
      }
    } catch (error) {
      const programId = programData.program_id || 'N/A';
      const identifyingInfo = [
        programData.university_name_th || programData.university_name_en,
        programData.faculty_name_th || programData.faculty_name_en,
        programData.program_name_th || programData.program_name_en,
      ].filter(Boolean).join(' > ') || 'unknown';

      const errorMsg = `ERROR: [${programId}] ${identifyingInfo}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error(errorMsg, { programData, error });
      await sendProgress({
        stage: 'processing',
        message: errorMsg,
      });
      stats.errors.push({
        program_id: programId,
        error: `${identifyingInfo}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }
}

/**
 * Convert API data format to database format
 */
function convertToDatabaseFormat(data: ProgramData) {
  return {
    university_type_id: data.university_type_id || null,
    university_type_name_th: data.university_type_name_th || null,
    university_id: data.university_id || null,
    university_name_th: data.university_name_th || null,
    university_name_en: data.university_name_en || null,
    campus_id: data.campus_id || null,
    campus_name_th: data.campus_name_th || null,
    campus_name_en: data.campus_name_en || null,
    faculty_id: data.faculty_id || null,
    faculty_name_th: data.faculty_name_th || null,
    faculty_name_en: data.faculty_name_en || null,
    group_field_id: data.group_field_id || null,
    group_field_th: data.group_field_th || null,
    field_id: data.field_id || null,
    field_name_th: data.field_name_th || null,
    field_name_en: data.field_name_en || null,
    program_running_number: data.program_running_number || null,
    program_name_th: data.program_name_th || null,
    program_name_en: data.program_name_en || null,
    program_type_id: data.program_type_id || null,
    program_type_name_th: data.program_type_name_th || null,
    program_id: data.program_id || null,
    number_acceptance_mko2: data.number_acceptance_mko2 || 0,
    program_partners_id: data.program_partners_id || null,
    program_partners_inter_name: data.program_partners_inter_name || null,
    country_partners_name: data.country_partners_name || null,
    major_acceptance_number: data.major_acceptance_number || 0,
    cost: data.cost || null,
    graduate_rate: data.graduate_rate || null,
    employment_rate: data.employment_rate || null,
    median_salary: data.median_salary || null,
  };
}
