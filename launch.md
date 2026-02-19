# Mindful Webapp Development Launch Guide

This guide shows how to run the app locally and test each feature area in development.

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally on `mongodb://localhost:27017`
- Two terminals (one for `server`, one for `client`)

## 2. Environment Setup

The required `.env` files already exist in this repo.

- `server/.env`
  - `PORT=5000`
  - `MONGODB_URI=mongodb://localhost:27017/mindful-webapp`
  - `CLIENT_URL=http://localhost:5173`
- `client/.env`
  - `VITE_API_URL=http://localhost:5000`

## 3. Install Dependencies

Run once per app:

```powershell
cd server
npm install
cd ../client
npm install
```

## 4. Start Development Servers

Terminal 1 (API):

```powershell
cd server
npm run dev
```

Terminal 2 (Web app):

```powershell
cd client
npm run dev
```

## 5. Smoke Check

- Open `http://localhost:5173`
- Check API health:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```

Expected: `success: true`.

## 6. Create Test Auth Session

Use this once to register/login and get a token:

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
```

Optional for testing protected frontend routes (because auth pages are placeholders):

```js
localStorage.setItem("token", "<PASTE_TOKEN>");
localStorage.setItem("user", JSON.stringify({ name: "Dev Tester", email: "dev@example.com" }));
location.href = "/";
```

## 7. Feature-by-Feature Testing

Note: many frontend pages are currently placeholders, so functional validation is primarily through API routes.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`

Quick check:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:5000/api/auth/me" -Headers $headers
```

### Daily Reflection and Entries

1. Create today's entry:

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
```

2. Validate entry APIs:
- `GET /api/entries`
- `GET /api/entries/today`
- `GET /api/entries/recent?days=7`
- `GET /api/entries/:id`
- `PUT /api/entries/:id`
- `PATCH /api/entries/:id/autosave`
- `DELETE /api/entries/:id` (cleanup only)

### Self Care

Update the same entry with self-care fields:

```powershell
$selfCareBody = @{
  selfLove = "I handled stress well today."
  feeling = "relaxed"
  ratings = @{ overall = 4; selfTalk = 4; energyPoint = 3 }
  selfCareChecklist = @{ drankWater = $true; journaled = $true; gotFreshAir = $true }
  completedSections = @("reflection", "selfcare")
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Method Put -Uri "$base/entries/$entryId" -Headers $headers -ContentType "application/json" -Body $selfCareBody
```

### Emotional Guidance

```powershell
$emotionalBody = @{
  emotionalGuidance = @{
    whereAreYou = "Work sprint week"
    howYoureFeeling = "A bit overwhelmed"
    whatYoureThinking = "Need to prioritize better"
    copingMethod = "Break work into small blocks"
    feelingBeforeGo = "Calmer"
  }
  selfCarePlanDays = @{ monday = $true; tuesday = $false; wednesday = $true }
  completedSections = @("reflection", "selfcare", "emotional")
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Put -Uri "$base/entries/$entryId" -Headers $headers -ContentType "application/json" -Body $emotionalBody
```

### Review

```powershell
$reviewBody = @{
  priorities = @("Finish sprint tasks", "Exercise", "Read 20 minutes")
  todoList = @(
    @{ text = "Ship API docs"; completed = $false },
    @{ text = "Walk 30 minutes"; completed = $true }
  )
  focus = "Deep work from 9-11 AM"
  mindfulnessNotes = "Breathing breaks helped reset focus."
  completedSections = @("reflection", "selfcare", "emotional", "review")
} | ConvertTo-Json -Depth 6

Invoke-RestMethod -Method Put -Uri "$base/entries/$entryId" -Headers $headers -ContentType "application/json" -Body $reviewBody
```

### Analytics

Run all analytics endpoints:

```powershell
Invoke-RestMethod -Uri "$base/analytics/summary?period=30days" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/mood-trends?period=30days" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/energy-patterns" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/activity-heatmap?year=2026" -Headers $headers
Invoke-RestMethod -Uri "$base/analytics/weekly-report" -Headers $headers
```

### Settings and Account

- `GET /api/users/preferences`
- `PUT /api/users/preferences`
- `GET /api/users/export` (downloads JSON)
- `DELETE /api/users/account` (destructive)

## 8. Frontend Route Checks

After setting `localStorage` token, verify each route renders:

- `/`
- `/reflection`
- `/selfcare`
- `/emotional`
- `/review`
- `/analytics`
- `/settings`

Current expected behavior: pages render placeholder content for each module.

## 9. Common Issues

- `MongoDB connection failed`: confirm local MongoDB is running and `server/.env` URI is correct.
- CORS/auth issues: confirm `CLIENT_URL` in `server/.env` matches Vite URL.
- `401 Not authorized`: token missing/expired; login/register again and update `Authorization` header.
- Port conflicts: change `PORT` in `server/.env` and `VITE_API_URL` in `client/.env` together.
