import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://lrtlhvemfdkdsctnicwi.supabase.co', 'sb_publishable_zJbfejfByt20C-JNvm8tpA_0A2vXJfK');
async function run() {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    options: {
      data: { name: 'Test User', role: 'Propietario' }
    }
  });
  console.log('Auth:', authError || 'OK');
  if (authData?.user) {
    const { data: profile, error: profileError } = await supabase.from('profiles').upsert({
      id: authData.user.id,
      name: 'Test User',
      role: 'Propietario',
      initials: 'TU'
    }).select();
    console.log('Profile Error:', profileError);
  }
}
run();
