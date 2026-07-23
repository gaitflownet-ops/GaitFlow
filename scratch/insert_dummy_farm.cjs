const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking if dummy farm exists...");
  const dummyId = "00000000-0000-0000-0000-000000000000";
  
  const { data, error } = await supabase
    .from('farms')
    .select('id')
    .eq('id', dummyId)
    .single();
    
  if (data) {
    console.log("Dummy farm already exists.");
  } else {
    console.log("Inserting dummy farm...");
    const { data: newFarm, error: insertError } = await supabase
      .from('farms')
      .insert({
        id: dummyId,
        name: 'Sistema General',
        slug: 'sistema-general-000',
        location: 'Global',
        description: 'Granja base del sistema',
      })
      .select()
      .single();
      
    if (insertError) {
      console.error("Error inserting dummy farm:", insertError);
    } else {
      console.log("Inserted dummy farm:", newFarm);
    }
  }
}

run();
