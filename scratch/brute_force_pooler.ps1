$regions = @(
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
)

foreach ($region in $regions) {
  $url = "postgresql://postgres.lrtlhvemfdkdsctnicwi:1036449201J@${region}.pooler.supabase.com:6543/postgres"
  Write-Host "Testing $region..."
  
  # Run npx supabase db push (it will fail if url is bad)
  # But we don't want to actually push if it's the wrong one... wait!
  # If it's the RIGHT one, it WILL push! Which is exactly what we want.
  
  $output = npx supabase db push --db-url $url 2>&1
  $outString = $output | Out-String
  
  if ($outString -match "failed to connect") {
    Write-Host "Failed: $region"
  } else {
    Write-Host "SUCCESS or DIFFERENT ERROR on $region!"
    Write-Host $outString
    break
  }
}
