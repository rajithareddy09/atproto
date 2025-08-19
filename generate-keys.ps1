# PowerShell script to generate secure keys for SF Project PDS

Write-Host "🔐 Generating Secure Keys for SF Project PDS" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""

# Function to generate random hex string
function Get-RandomHexString {
    param([int]$Length)
    $bytes = New-Object byte[] $Length
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    return ($bytes | ForEach-Object { $_.ToString("x2") }) -join ""
}

# Function to generate base58 string (simplified)
function Get-Base58String {
    param([int]$Length)
    $bytes = New-Object byte[] $Length
    (New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes)
    # Simplified base58 encoding - in production, use a proper base58 library
    return "z" + [Convert]::ToBase64String($bytes).Replace("+", "").Replace("/", "").Replace("=", "")
}

# Generate 64-character hex strings for private keys (256-bit)
$repoSigningKey = Get-RandomHexString 32
$plcRotationKey = Get-RandomHexString 32
$dpopSecret = Get-RandomHexString 32

# Generate JWT secret (32 bytes)
$jwtSecret = Get-RandomHexString 32

# Generate admin passwords (32 characters)
$adminPassword = Get-RandomHexString 16
$ozoneAdminPassword = Get-RandomHexString 16
$plcAdminPassword = Get-RandomHexString 16

# Generate signing keys for services (64 characters)
$ozoneSigningKey = Get-RandomHexString 32
$plcSigningKey = Get-RandomHexString 32

# Generate service signing key (did:key format)
$serviceSigningKeyMultibase = Get-Base58String 32
$serviceSigningKey = "did:key:$serviceSigningKeyMultibase"

Write-Host "📋 PDS Keys:" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow
Write-Host "PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX=`"$repoSigningKey`"" -ForegroundColor Cyan
Write-Host "PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX=`"$plcRotationKey`"" -ForegroundColor Cyan
Write-Host "PDS_DPOP_SECRET=`"$dpopSecret`"" -ForegroundColor Cyan
Write-Host "PDS_JWT_SECRET=`"$jwtSecret`"" -ForegroundColor Cyan
Write-Host "PDS_ADMIN_PASSWORD=`"$adminPassword`"" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Ozone Keys:" -ForegroundColor Yellow
Write-Host "---------------" -ForegroundColor Yellow
Write-Host "OZONE_SIGNING_KEY_HEX=`"$ozoneSigningKey`"" -ForegroundColor Cyan
Write-Host "OZONE_ADMIN_PASSWORD=`"$ozoneAdminPassword`"" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 PLC Keys:" -ForegroundColor Yellow
Write-Host "-------------" -ForegroundColor Yellow
Write-Host "PLC_SIGNING_KEY_HEX=`"$plcSigningKey`"" -ForegroundColor Cyan
Write-Host "PLC_ADMIN_PASSWORD=`"$plcAdminPassword`"" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Bsky AppView Keys:" -ForegroundColor Yellow
Write-Host "---------------------" -ForegroundColor Yellow
Write-Host "BSKY_SERVICE_SIGNING_KEY=`"$serviceSigningKey`"" -ForegroundColor Cyan
Write-Host "BSKY_ADMIN_PASSWORDS=`"$adminPassword,$ozoneAdminPassword`"" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Admin DIDs (you need to create these):" -ForegroundColor Yellow
Write-Host "------------------------------------------" -ForegroundColor Yellow
Write-Host "OZONE_ADMIN_DIDS=`"did:web:your-admin-did`"" -ForegroundColor Cyan
Write-Host "OZONE_MODERATOR_DIDS=`"did:web:your-moderator-did`"" -ForegroundColor Cyan
Write-Host "OZONE_TRIAGE_DIDS=`"did:web:your-triage-did`"" -ForegroundColor Cyan

Write-Host ""
Write-Host "⚠️  IMPORTANT SECURITY NOTES:" -ForegroundColor Red
Write-Host "============================" -ForegroundColor Red
Write-Host "1. Store these keys securely - never commit them to version control" -ForegroundColor White
Write-Host "2. Use different keys for each environment (dev, staging, production)" -ForegroundColor White
Write-Host "3. Keep backups of your keys in a secure location" -ForegroundColor White
Write-Host "4. Rotate keys regularly in production" -ForegroundColor White
Write-Host "5. Use strong, unique passwords for admin accounts" -ForegroundColor White

Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green
Write-Host "1. Copy these keys to your environment files" -ForegroundColor White
Write-Host "2. Replace placeholder values in:" -ForegroundColor White
Write-Host "   - packages/pds/sfproject.env" -ForegroundColor White
Write-Host "   - packages/ozone/sfproject.env" -ForegroundColor White
Write-Host "   - services/bsky/sfproject.env" -ForegroundColor White
Write-Host "   - services/plc/sfproject.env" -ForegroundColor White
Write-Host "3. Create admin DIDs and update the admin DID lists" -ForegroundColor White
Write-Host "4. Start your services with: docker-compose up -d" -ForegroundColor White
