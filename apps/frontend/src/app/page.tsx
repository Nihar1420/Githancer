import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginCard } from '@/components/auth/LoginCard';

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

export default function Home() {
  if (!USE_MOCK) {
    const token = cookies().get('gtm_token');
    if (token) {
      redirect('/dashboard');
    }
  }
  return <LoginCard useMock={USE_MOCK} />;
}
