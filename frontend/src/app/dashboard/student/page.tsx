import { redirect } from 'next/navigation';

export default function StudentRoot() {
  redirect('/dashboard/student/leads');
}
