param(
  [string]$PgUser = "postgres",
  [string]$PgPassword,
  [string]$DbName = "mindfullife",
  [string]$DbHost = "127.0.0.1",
  [int]$DbPort = 5432
)

$ErrorActionPreference = "Stop"

function Invoke-Psql {
  param(
    [string[]]$Arguments
  )

  $output = & $script:psql @Arguments 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw ($output -join [Environment]::NewLine)
  }

  return $output
}

function Set-EnvValue {
  param(
    [string[]]$Lines,
    [string]$Key,
    [string]$Value
  )

  $updated = $false
  $result = foreach ($line in $Lines) {
    if ($line -match "^[#\s]*$Key=") {
      $updated = $true
      "$Key=$Value"
    } else {
      $line
    }
  }

  if (-not $updated) {
    $result += "$Key=$Value"
  }

  return $result
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverDir = Split-Path -Parent $scriptDir
$envFile = Join-Path $serverDir ".env"

$psqlCommand = Get-Command psql -ErrorAction Stop
$psql = $psqlCommand.Source

if (-not $PgPassword) {
  $securePassword = Read-Host "Enter PostgreSQL password for user '$PgUser'" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  try {
    $PgPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
  } finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

$encodedUser = [System.Uri]::EscapeDataString($PgUser)
$encodedPassword = [System.Uri]::EscapeDataString($PgPassword)
$databaseUrl = "postgresql://${encodedUser}:${encodedPassword}@${DbHost}:${DbPort}/${DbName}"

$env:PGPASSWORD = $PgPassword

try {
  Invoke-Psql -Arguments @("-h", $DbHost, "-p", $DbPort, "-U", $PgUser, "-d", "postgres", "-tAc", "SELECT 1;") | Out-Null

  $databaseExists = (Invoke-Psql -Arguments @("-h", $DbHost, "-p", $DbPort, "-U", $PgUser, "-d", "postgres", "-tAc", "SELECT 1 FROM pg_database WHERE datname = '${DbName}';") | Out-String).Trim()
  if ($databaseExists -ne "1") {
    Invoke-Psql -Arguments @("-h", $DbHost, "-p", $DbPort, "-U", $PgUser, "-d", "postgres", "-c", "CREATE DATABASE ""${DbName}"";") | Out-Null
  }

  $envLines = if (Test-Path $envFile) { Get-Content $envFile } else { @() }
  $envLines = Set-EnvValue -Lines $envLines -Key "DATABASE_URL" -Value $databaseUrl
  Set-Content -Path $envFile -Value $envLines

  Push-Location $serverDir
  try {
    npm.cmd run prisma:generate
    npm.cmd run prisma:deploy
  } finally {
    Pop-Location
  }

  Write-Host "Postgres setup complete."
  Write-Host "DATABASE_URL updated in $envFile"
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
