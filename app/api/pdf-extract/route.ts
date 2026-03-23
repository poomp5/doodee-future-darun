import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // For now, return a message indicating that server-side PDF extraction
    // would require additional dependencies (like pdf-parse)
    // This is a placeholder for future server-side PDF processing
    
    return NextResponse.json({
      success: false,
      error: 'Server-side PDF extraction not implemented yet',
      message: 'Use client-side OCR fallback'
    });

  } catch (error) {
    console.error('PDF extraction API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}