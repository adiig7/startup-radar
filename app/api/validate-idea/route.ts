import { NextRequest, NextResponse } from 'next/server';
import { validateStartupIdea } from '@/lib/ai/idea-validator';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();
    const { idea } = body as { idea: string };

    if (!idea || typeof idea !== 'string' || idea.trim().length === 0) {
      return NextResponse.json(
        { error: 'Startup idea is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (idea.length > 500) {
      return NextResponse.json(
        { error: 'Idea description is too long (max 500 characters)' },
        { status: 400 }
      );
    }

    const report = await validateStartupIdea(idea);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to validate idea',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
