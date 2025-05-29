import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, createUser } from '@/lib/userDb';
import { hashPassword, generateToken } from '@/lib/auth';

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
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Create user
    const result = await createUser({
      email,
      password: hashedPassword,
      name,
    });

    // Get the created user to generate token
    const createdUser = await findUserByEmail(email);
    
    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    // Generate token after user creation
    const token = await generateToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      name: createdUser.name,
    });

    return NextResponse.json({
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
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