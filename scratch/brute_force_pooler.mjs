import postgres from 'postgres';
import fs from 'fs';

const regions = [
  'aws-0-us-east-1',
  'aws-0-us-east-2',
  'aws-0-us-west-1',
  'aws-0-us-west-2',
  'aws-0-sa-east-1',
  'aws-0-ca-central-1',
  'aws-0-eu-central-1',
  'aws-0-eu-west-1',
  'aws-0-eu-west-2',
  'aws-0-eu-west-3',
  'aws-0-ap-southeast-1',
  'aws-0-ap-southeast-2',
  'aws-0-ap-northeast-1',
  'aws-0-ap-south-1'
];

async function checkRegion() {
  for (const region of regions) {
    const url = `postgres://postgres.lrtlhvemfdkdsctnicwi:1036449201J@${region}.pooler.supabase.com:6543/postgres`;
    console.log(`Testing ${region}...`);
    try {
      const sql = postgres(url, { max: 1, idle_timeout: 1, connect_timeout: 3 });
      const result = await sql`SELECT 1`;
      console.log(`SUCCESS on ${region}!`);
      fs.writeFileSync('valid_db_url.txt', url);
      process.exit(0);
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('password authentication failed') || err.message.includes('ENOTFOUND') || err.code === 'ENOTFOUND') {
        // Expected if region is wrong or offline
      } else {
        console.log(`Error on ${region}:`, err.message);
      }
    }
  }
  console.log("None of the standard regions worked.");
  process.exit(1);
}

checkRegion();
