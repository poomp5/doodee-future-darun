import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/create-user - Manually create a user
export async function POST(request: NextRequest) {
  try {
    const { email, name, image } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    console.log("=== Manual User Creation ===");
    console.log("Email:", email);

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", existingUser.id);
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser
      });
    }

    // Create new user
    const username = email.split("@")[0];
    const referralCode = Math.random().toString(36).substring(2, 10);
    const newUserId = crypto.randomUUID();

    console.log("Creating new user with id:", newUserId);

    const newUser = await prisma.users.create({
      data: {
        id: newUserId,
        email,
        full_name: name || null,
        profile_image_url: image || null,
        username,
        referral_code: referralCode,
        current_points: 0,
        total_points: 0,
      },
    });

    console.log("User created successfully:", newUser);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: newUser
    });

  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

// GET /api/create-user?email=xxx - Check if user exists
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'email query param is required' }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    return NextResponse.json({
      exists: !!user,
      user: user || null
    });

  } catch (error: any) {
    console.error("Error checking user:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
