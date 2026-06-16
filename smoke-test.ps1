# Smoke test — register, login, create link
$BASE = "http://localhost:3000/api/v1"
$EMAIL = "test_$(Get-Random)@example.com"
$PASSWORD = "password123"

Write-Host "`n🧪 Smoke Test — Link Graveyard API`n"

# Register
Write-Host "1. Register..."
$reg = Invoke-RestMethod -Uri "$BASE/auth/register" -Method POST -ContentType "application/json" -Body (@{ email=$EMAIL; password=$PASSWORD } | ConvertTo-Json)
Write-Host "   ✅ Registered: $($reg.email)"

# Login
Write-Host "2. Login..."
$login = Invoke-RestMethod -Uri "$BASE/auth/login" -Method POST -ContentType "application/json" -Body (@{ email=$EMAIL; password=$PASSWORD } | ConvertTo-Json)
$TOKEN = $login.accessToken
Write-Host "   ✅ Got access token: $($TOKEN.Substring(0,20))..."

# Create link
Write-Host "3. Create link..."
$headers = @{ Authorization = "Bearer $TOKEN"; "Content-Type" = "application/json" }
$link = Invoke-RestMethod -Uri "$BASE/links" -Method POST -Headers $headers -Body (@{ url="https://github.com/nestjs/nest"; source="WEB_EXT"; context_text="Test link" } | ConvertTo-Json)
Write-Host "   ✅ Link created: $($link.data.link_id) status=$($link.data.status)"

# Get links
Write-Host "4. Get links..."
$links = Invoke-RestMethod -Uri "$BASE/links" -Method GET -Headers $headers
Write-Host "   ✅ Total links: $($links.meta.total)"

Write-Host "`n🎉 All smoke tests passed!`n"
