# Mindful Webapp Runbook (Windows PowerShell)

Use this as a strict, copy-paste checklist to run and test the app locally.

## 0. Go To Project Root

```powershell
cd C:\Users\HP\Documents\minder\mindful-webapp
```

## 1. Confirm Node Version

```powershell
node -v
npm -v
```

Expected: Node 18+ (you are on Node 22, which is fine).

## 2. Install Server Dependencies (Normal Path)

```powershell
cd .\server
npm install --include=optional
```

If this succeeds, skip to step 4.

## 3. Fix `esbuild` Version Mismatch (Only If Install Fails)

Run these only if you get:
`Error: Expected "0.18.20" but got "0.25.12"`

### 3.1 Diagnose

```powershell
cd C:\Users\HP\Documents\minder\mindful-webapp\server
node -p "require.resolve('@esbuild/win32-x64/esbuild.exe')"
node -p "require('C:/Users/HP/Documents/node_modules/@esbuild/win32-x64/package.json').version"
```

If path resolves to `C:\Users\HP\Documents\node_modules\...`, you are picking a conflicting parent dependency.

### 3.2 Clean Local Install

```powershell
cd C:\Users\HP\Documents\minder\mindful-webapp\server
Remove-Item -Recurse -Force .\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue
```

### 3.3 Temporarily Move Conflicting Parent Package

```powershell
Rename-Item "C:\Users\HP\Documents\node_modules\@esbuild" "@esbuild.bak" -ErrorAction SilentlyContinue
```

### 3.4 Reinstall

```powershell
cd C:\Users\HP\Documents\minder\mindful-webapp\server
npm install --include=optional
```

### 3.5 Verify

```powershell
node -p "require('./node_modules/esbuild/package.json').version"
node -p "require('./node_modules/@esbuild/win32-x64/package.json').version"
.\node_modules\esbuild\bin\esbuild --version
```

Expected: all `0.18.20`.

## 4. Install Client Dependencies

```powershell
cd C:\Users\HP\Documents\minder\mindful-webapp\client
npm install
```

## 5. Start MongoDB

Make sure MongoDB is running for:
`mongodb://localhost:27017/mindful-webapp`

If MongoDB is installed as a Windows service:

```powershell
Get-Service *mongo*
```

If needed:

```powershell
Start-Service MongoDB
```

## 6. Run Backend (Terminal 1)

```powershell
cd C:\Users\HP\Documents\minder\mindful-webapp\server
npm run dev
```

Expected log includes API on port `5000`.

## 7. Run Frontend (Terminal 2)

```powershell
cd C:\Users\HP\Documents\minder\mindful-webapp\client
npm run dev
```

Expected Vite URL: `http://localhost:5173`

## 8. Smoke Test API

In a third terminal:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```

Expected response contains `success = true`.

## 9. Create Test User + Token (API Testing)

```powershell
$base = "http://localhost:5000/api"
$email = "tester_$(Get-Random)@example.com"
$password = "Password123!"

$registerBody = @{
  name = "Dev Tester"
  email = $email
  password = $password
} | ConvertTo-Json

$register = Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body $registerBody
$token = $register.data.token
$headers = @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Get -Uri "$base/auth/me" -Headers $headers
```

## 10. Create and Update an Entry (Feature Validation)

```powershell
$entryBody = @{
  mood = 4
  waterIntake = 7
  sleepHours = 8
  gratitude = @("Health", "Family", "Focus time")
  completedSections = @("reflection")
} | ConvertTo-Json

$created = Invoke-RestMethod -Method Post -Uri "$base/entries" -Headers $headers -ContentType "application/json" -Body $entryBody
$entryId = $created.data._id

Invoke-RestMethod -Method Get -Uri "$base/entries/today" -Headers $headers
Invoke-RestMethod -Method Get -Uri "$base/entries/recent?days=7" -Headers $headers
```

## 11. Run Analytics Endpoints

```powershell
Invoke-RestMethod -Uri "$base/analytics/summary?period=30days" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/mood-trends?period=30days" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/energy-patterns" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/activity-heatmap?year=2026" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/weekly-report" -Headers $headers
```

## 12. Frontend Route Check

Auth pages are placeholders. For protected routes, set local storage in browser devtools:

```js
localStorage.setItem("token", "<PASTE_TOKEN>");
localStorage.setItem("user", JSON.stringify({ name: "Dev Tester", email: "dev@example.com" }));
location.href = "/";
```

Then check:

- `http://localhost:5173/`
- `http://localhost:5173/reflection`
- `http://localhost:5173/selfcare`
- `http://localhost:5173/emotional`
- `http://localhost:5173/review`
- `http://localhost:5173/analytics`
- `http://localhost:5173/settings`

## 13. Stop Servers

In each running terminal:

```powershell
Ctrl + C
```
