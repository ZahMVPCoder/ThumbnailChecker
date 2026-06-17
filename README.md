# ThumbnailChecker

ThumbnailChecker is a full-stack web app for YouTube creators who want to test thumbnail and title ideas before publishing. A creator can upload a thumbnail, enter a video title, get an AI-powered CTR prediction, save the check, and preview the video across YouTube-style layouts.

## Project Purpose

Many creators choose thumbnails without seeing how the thumbnail and title will look in real viewing contexts. ThumbnailChecker solves that by combining platform-style previews, saved review history, and AI coaching in one quick workflow.

## Target Users

- YouTube creators
- Streamers and gaming channels
- Educational channels
- Small businesses using YouTube for marketing
- Content teams reviewing videos before upload

## Main Features

- Upload a YouTube thumbnail image
- Enter and edit a video title
- Save thumbnail checks to a Neon Postgres database
- Scope saved checks to the current browser/device with a local `deviceId`
- View the 12 most recent saved thumbnail checks
- Edit saved video titles
- Delete one saved thumbnail check
- Clear all saved thumbnail checks for the current device
- Preview thumbnails in six YouTube-style layouts
- Use Gemini AI to analyze the thumbnail and title
- Show a `CTR Prediction Score` from 1 to 10
- Show AI feedback cards for readability, title strength, curiosity, mobile visibility, improvements, title ideas, and thumbnail text suggestions
- Show a thumbnail checklist before publishing
- Save AI score, AI feedback, and checklist progress with each submission
- Rate limit AI analysis to protect API usage
- Toggle light and dark mode
- Browse creator resource cards from the app homepage
- Navigate with a sticky header and footer product links

## User Workflow

During client testing, users said the app should not have separate actions for saving/previewing and analyzing. Based on that feedback, the workflow was changed into one combined action.

Current flow:

1. The user uploads a thumbnail.
2. The user enters a video title.
3. The user clicks `Save, Analyze & Preview`.
4. The app sends the thumbnail and title to Gemini AI.
5. Gemini returns a CTR prediction and structured feedback.
6. The app builds the publishing checklist.
7. The thumbnail check, AI feedback, score, and checklist are saved to Neon.
8. The app opens the YouTube-style preview screen.

The score label is `CTR Prediction Score` so creators understand that the score estimates how clickable the thumbnail/title combination may be.

## Product UI

The React frontend includes:

- Sticky top navigation with links to the tool and creator resources
- Upload panel with file preview, title entry, character count, and combined submit button
- AI Thumbnail Coach feedback section
- Thumbnail checklist section
- Saved thumbnail checks with edit, delete, and clear-all actions
- Creator Resources section with article cards
- Floating light/dark theme toggle
- Footer with product and creator tool links

## Preview Layouts

ThumbnailChecker previews the uploaded thumbnail and title in six YouTube-style contexts:

- Desktop Home Feed
- Desktop Search Results
- Watch Next Sidebar
- Mobile App Home
- Mobile App Search
- YouTube TV

These previews help creators check readability, title fit, and overall click appeal across different screen sizes.

## AI Thumbnail Coach

The AI Thumbnail Coach uses the Google Gemini API. It analyzes both the uploaded image and the video title.

The response is requested as structured JSON with these fields:

- `overallClickabilityScore`
- `thumbnailReadability`
- `titleStrength`
- `curiosityClickAppeal`
- `mobileVisibility`
- `suggestedImprovements`
- `betterTitleIdeas`
- `thumbnailTextSuggestions`

The app displays this feedback as UI cards instead of plain text. The local Express server and the Vercel API route both use the same Gemini prompt, response schema, image parsing, and rate limit behavior.

## Thumbnail Checklist

The checklist gives creators a readiness check before publishing. It tracks whether:

- A thumbnail has been uploaded
- A title has been added
- The title length is scan-friendly
- The AI coach has reviewed the thumbnail
- The CTR Prediction Score is 7 or higher
- Mobile visibility has been reviewed

Saved thumbnail cards show checklist completion progress, such as `4/6 complete`.

## Database

The production database uses Neon Postgres with Prisma.

### Prisma Models

```prisma
model ThumbnailSubmission {
  id        Int      @id @default(autoincrement())
  deviceId  String
  device    Device   @relation(fields: [deviceId], references: [id], onDelete: Cascade)
  title     String
  thumbnail String   @db.Text
  aiScore   Float?
  aiFeedback Json?
  checklist Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([deviceId])
}

model Device {
  id          String                @id
  submissions ThumbnailSubmission[]
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt
}
```

### Model Relationship

The relationship is one-to-many:

- One `Device` can have many `ThumbnailSubmission` records.
- Each `ThumbnailSubmission` belongs to one `Device`.
- `deviceId` connects saved thumbnail checks to the browser/device that created them.
- Deleting a device cascades to its thumbnail submissions.

This lets each user see only their own saved thumbnail checks without requiring login accounts.

## API Endpoints

The production API lives in `api/` for Vercel. The local development API lives in `server.js` and mirrors the same routes with Express.

### `/api/thumbnails`

Supports:

- `GET` - Loads up to 12 saved thumbnail checks for the current `deviceId`
- `POST` - Creates a saved thumbnail check with title, thumbnail, optional AI score, optional AI feedback, and optional checklist data
- `PATCH` - Updates a saved thumbnail check after confirming it belongs to the current `deviceId`
- `DELETE` - Deletes one saved thumbnail check or clears all checks for the current `deviceId`

### `/api/analyze-thumbnail`

Supports:

- `POST` - Sends the thumbnail and title to Gemini AI and returns structured feedback

The AI endpoint validates the required fields, requires `GEMINI_API_KEY`, and limits each device to 5 analyses per hour in the current server instance.

## System Architecture

```mermaid
flowchart LR
  User["Creator / User"] --> Browser["React + Vite Frontend"]
  Browser --> LocalStorage["localStorage deviceId + theme"]
  Browser --> API["Vercel API Routes or Local Express API"]
  API --> Prisma["Prisma Client"]
  Prisma --> Neon["Neon Postgres Database"]
  API --> Gemini["Google Gemini API"]
  Gemini --> API
  API --> Browser
```

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Prisma
- Neon Postgres
- Google Gemini API
- Vercel API routes
- Express for local API development
- Lucide React icons

## Environment Variables

Create a local `.env` file from `.env.example` and add these values:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=require"
GEMINI_API_KEY="your-gemini-api-key"
GEMINI_MODEL="gemini-2.5-flash"
```

`GEMINI_MODEL` is optional because the API defaults to `gemini-2.5-flash`, but keeping it in the environment makes the model easy to change later.

The same environment variables must be added in Vercel Project Settings before deploying.

## Local Development

Install dependencies:

```bash
npm install
```

Generate the Prisma client and push the schema to the database:

```bash
npm run db:push
```

Run the local API server:

```bash
npm run dev:api
```

Run the Vite frontend in a second terminal:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## NPM Scripts

- `npm run dev` - Starts the Vite frontend
- `npm run dev:api` - Starts the local Express API server on port `3001` unless `PORT` is set
- `npm run build` - Builds the frontend into `dist/`
- `npm run preview` - Serves the production frontend build with Vite
- `npm run db:push` - Pushes the Prisma schema to the configured database
- `npm run db:init` - Alias for `prisma db push`
- `npm run db:studio` - Opens Prisma Studio
- `postinstall` - Runs `prisma generate`

## Deployment

The app is designed to deploy on Vercel. Vercel serves the React frontend and runs the API routes in `api/`. Neon stores saved thumbnail checks, and Gemini provides AI feedback.

Required Vercel environment variables:

```env
DATABASE_URL
GEMINI_API_KEY
GEMINI_MODEL
```

## Current Status

The project currently includes:

- Full upload, analyze, save, and preview workflow
- Database-backed saved thumbnail checks
- Device-scoped saved history
- Prisma models and relationship
- Gemini AI Thumbnail Coach
- CTR Prediction Score
- Thumbnail checklist
- Saved AI feedback and saved checklist data
- Edit, delete, and clear-all saved check actions
- Six responsive preview layouts
- Sticky navigation, creator resource cards, theme toggle, and footer
- Production Vercel API routes
- Local Express API server for development

## Validation

The production build was checked with:

```bash
npm.cmd run build
```

On Windows PowerShell, `npm run build` may be blocked by the script execution policy because it tries to run `npm.ps1`. Using `npm.cmd run build` avoids that shell policy issue.

## Future Improvements

- Store thumbnail images in cloud storage instead of saving base64 image data in the database
- Add user accounts so saved checks can follow users across devices
- Add A/B thumbnail comparison
- Add shareable report links
- Add PDF export for AI feedback reports
- Add analytics for saved CTR prediction trends
