import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysis_id, university_id, university_name_th, university_name_en, logo_url } = body;

    if (!analysis_id) {
      return NextResponse.json(
        { error: 'analysis_id is required' },
        { status: 400 }
      );
    }

    // Update the recommended_faculties array to include university information
    const analysis = await prisma.portfolio_analysis.findUnique({
      where: { id: BigInt(analysis_id) },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis not found' },
        { status: 404 }
      );
    }

    // Update the first item in recommended_faculties with new university info
    let updatedFaculties = analysis.recommended_faculties;
    if (Array.isArray(updatedFaculties) && updatedFaculties.length > 0) {
      updatedFaculties = updatedFaculties.map((faculty: any, index: number) => {
        if (index === 0) {
          return {
            ...faculty,
            university_id,
            university_name_th,
            university_name_en,
            logo_url,
          };
        }
        return faculty;
      });
    } else {
      // If no faculties exist, create one with university info
      updatedFaculties = [
        {
          university_id,
          university_name_th,
          university_name_en,
          logo_url,
        },
      ];
    }

    // Update the analysis record
    await prisma.portfolio_analysis.update({
      where: { id: BigInt(analysis_id) },
      data: {
        recommended_faculties: updatedFaculties as any,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'University updated successfully',
    });
  } catch (error) {
    console.error('Error updating university:', error);
    return NextResponse.json(
      { error: 'Failed to update university' },
      { status: 500 }
    );
  }
}
