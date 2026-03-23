import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log("Testing database connection...");

    // Test 1: Simple query
    const result = await prisma.$queryRaw<{ current_time: Date }[]>`SELECT NOW() as current_time`;
    console.log("Database connection OK:", result);

    // Test 2: Check users table
    const usersCount = await prisma.users.count();
    console.log("Users count:", usersCount);

    // Test 3: List all users
    const allUsers = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        created_at: true,
      },
      take: 10,
    });
    console.log("Users:", allUsers);

    return NextResponse.json({
      success: true,
      currentTime: result[0]?.current_time,
      usersCount: usersCount,
      users: allUsers
    });
  } catch (error: any) {
    console.error("Database test error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
