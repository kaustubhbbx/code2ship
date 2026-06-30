import { createServerSupabase } from '@/lib/supabase';

export async function getCurrentUser() {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentSession() {
  const supabase = await createServerSupabase();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
}
