// src/app/page.tsx
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function HomePage() {
  const token = cookies().get('access_token')?.value;

  if (token) {
    redirect('/projects');
  } else {
    redirect('/login');
  }
}
