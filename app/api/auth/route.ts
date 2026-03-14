import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { password } = await request.json();

  if (password === process.env.SITE_PASSWORD) {
    const response = NextResponse.json({ success: true });
    // Use a fixed token — middleware (Edge Runtime) can't read process.env at runtime
    response.cookies.set('atum_auth', 'atum_access_granted', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });
    return response;
  }

  return NextResponse.json({ success: false, error: 'Incorrect password' }, { status: 401 });
}
