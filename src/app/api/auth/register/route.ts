import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '../../../../generated/prisma'; // Using prisma from @/lib/prisma instead
import { prisma } from '@/lib/prisma'; // Corrected import
import { hashPassword, generateToken } from '@/lib/auth';

// const prisma = new PrismaClient(); // prisma instance already available from @/lib/prisma

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    // const token = generateToken(); // Removed incorrect token generation here

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        // token, // Removed token from user creation data
      },
    });

    // Generate token after user creation
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role, // user.role will have the default value 'USER'
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 