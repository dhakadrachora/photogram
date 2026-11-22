import { redirect } from 'next/navigation';

export default function AccountPasswordResetPage() {
  redirect('/login?mode=forgot');
}
