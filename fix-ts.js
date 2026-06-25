const fs = require("fs");
const path = require("path");

const libDir = path.join(__dirname, "src", "lib", "hooks");
const authProfile = path.join(__dirname, "src", "lib", "auth-profile.ts");
const notificationDropdown = path.join(__dirname, "src", "components", "NotificationDropdown.tsx");

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, "utf8");

  // Replace supabase.from("xxx").upsert(profile) with (supabase.from("xxx") as any).upsert(profile)
  // Replace supabase.from("xxx").insert(data) with (supabase.from("xxx") as any).insert(data)
  // Replace supabase.from("xxx").update(data) with (supabase.from("xxx") as any).update(data)

  const original = content;
  content = content.replace(
    /supabase\.from\("([^"]+)"\)\.upsert/g,
    '(supabase.from("$1") as any).upsert',
  );
  content = content.replace(
    /supabase\.from\("([^"]+)"\)\.insert/g,
    '(supabase.from("$1") as any).insert',
  );
  content = content.replace(
    /supabase\.from\("([^"]+)"\)\.update/g,
    '(supabase.from("$1") as any).update',
  );
  content = content.replace(
    /supabase\.from\('([^']+)'\)\.upsert/g,
    "(supabase.from('$1') as any).upsert",
  );
  content = content.replace(
    /supabase\.from\('([^']+)'\)\.insert/g,
    "(supabase.from('$1') as any).insert",
  );
  content = content.replace(
    /supabase\.from\('([^']+)'\)\.update/g,
    "(supabase.from('$1') as any).update",
  );

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log("Fixed", filePath);
  }
}

fixFile(authProfile);
fixFile(notificationDropdown);

if (fs.existsSync(libDir)) {
  const files = fs.readdirSync(libDir);
  for (const file of files) {
    if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      fixFile(path.join(libDir, file));
    }
  }
}
