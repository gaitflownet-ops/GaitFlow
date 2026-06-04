import { supabase } from "./src/lib/supabase";

async function run() {
  // Test single object insert
  await supabase.from("profiles").insert({
    id: "test",
    name: "test",
  });

  // Test array insert
  await supabase.from("profiles").insert([
    {
      id: "test",
      name: "test",
    },
  ]);
}
