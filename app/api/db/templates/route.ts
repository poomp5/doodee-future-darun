import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to convert BigInt fields to string for JSON serialization
const serializeTemplate = (template: any) => ({
  ...template,
  id: template.id.toString(),
});

// GET /api/db/templates - Get portfolio templates
// Supports ?id=<bigint> for single template lookup
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single template lookup by ID
    if (id) {
      const template = await prisma.portfolio_templates.findUnique({
        where: { id: BigInt(id) },
      });

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      return NextResponse.json(serializeTemplate(template));
    }

    // List templates with optional filters
    const isActive = searchParams.get('is_active');
    const isFeatured = searchParams.get('is_featured');

    const where: Record<string, boolean> = {};
    if (isActive === 'true') where.is_active = true;
    if (isFeatured === 'true') where.is_featured = true;

    const templates = await prisma.portfolio_templates.findMany({
      where,
      orderBy: { display_order: 'asc' },
    });

    return NextResponse.json(templates.map(serializeTemplate));
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}
