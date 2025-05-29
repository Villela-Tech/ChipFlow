import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    env_vars: {
      DB_HOST: process.env.DB_HOST || 'NOT_SET',
      DB_PORT: process.env.DB_PORT || 'NOT_SET',
      DB_USER: process.env.DB_USER || 'NOT_SET',
      DB_PASSWORD: process.env.DB_PASSWORD ? 'SET' : 'NOT_SET',
      DB_NAME: process.env.DB_NAME || 'NOT_SET',
      NODE_ENV: process.env.NODE_ENV,
    }
  });
} 