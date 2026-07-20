import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://lrtlhvemfdkdsctnicwi.supabase.co', 'sb_publishable_zJbfejfByt20C-JNvm8tpA_0A2vXJfK', { auth: { persistSession: false } });
async function run() {
  const { data: authData } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    options: { data: { name: 'Test User', role: 'Propietario' } }
  });
  const token = authData.session.access_token;
  const client = createClient('https://lrtlhvemfdkdsctnicwi.supabase.co', 'sb_publishable_zJbfejfByt20C-JNvm8tpA_0A2vXJfK', { global: { headers: { Authorization: 'Bearer ' + token } } });
  const { data: profile, error: profileError } = await client.from('profiles').upsert({
    id: authData.user.id,
    name: 'Test User',
    role: 'Propietario',
    initials: 'TU'
  }).select();
  console.log('Profile Error:', profileError);
}
run();
