
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
    options: {
      data: { name: 'Test User', role: 'Propietario' }
    }
  });
  console.log('Auth error:', authError);
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

