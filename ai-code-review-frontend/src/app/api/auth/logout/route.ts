// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete('access_token');
  cookieStore.delete('auth_token');

  return NextResponse.json({ success: true, message: 'Logged out successfully' });
}
