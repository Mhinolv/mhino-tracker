# MhinoTracker - Location Tracker

A Next.js application for tracking and visualizing location data from Google Sheets with real road-following routes.

## Features

- 📍 Real-time location tracking from Google Sheets
- 🗺️ Interactive map with road-following routes (OpenRouteService)
- 📱 Responsive design for desktop and mobile
- 💾 Intelligent route caching to minimize API usage
- 🎯 Smart map centering on most recent location

## Local Development

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your values:
   - `GOOGLE_SHEET_ID`: Your Google Sheet ID
   - `GOOGLE_SERVICE_ACCOUNT_FILE`: Path to your credentials.json file

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment to Render

### Prerequisites
- GitHub repository with your code
- Google Service Account JSON credentials
- Google Sheet with location data

### Steps

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Create Render Web Service:**
   - Go to [render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration

3. **Set Environment Variables in Render:**

   **Required:**
   - `GOOGLE_SHEET_ID`: Your Google Sheet ID
   - `GOOGLE_SERVICE_ACCOUNT_JSON`: Complete JSON credentials (see below)

   **Optional:**
   - `NODE_ENV`: `production` (auto-set by Render)

4. **Setup Google Service Account JSON:**

   Copy your entire `credentials.json` file content and paste as one line:
   ```json
   {"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
   ```

5. **Deploy:**
   - Render will automatically build and deploy
   - Build time: ~2-5 minutes
   - Your app will be available at: `https://your-app-name.onrender.com`

### Google Sheets Setup

Your Google Sheet should have columns in this order:
1. **timestamp** - Date/time of location
2. **device** - Device name (ignored in display)
3. **latitude** - Latitude coordinate
4. **longitude** - Longitude coordinate
5. **city** - City name
6. **state** - State/region

### Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_SHEET_ID` | ✅ | The ID from your Google Sheet URL |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | ✅ | Complete service account credentials |
| `NODE_ENV` | Auto | Set to `production` by Render |

### Troubleshooting

**Build Failures:**
- Check that all environment variables are set
- Verify Google Service Account JSON is valid
- Check build logs in Render dashboard

**Authentication Errors:**
- Verify Google Service Account has access to the sheet
- Check that JSON credentials are properly formatted
- Ensure Google Sheets API is enabled

**Route Display Issues:**
- Routes use OpenRouteService API with built-in caching
- Check browser console for API errors
- Routes fall back to straight lines if API fails

## Tech Stack

- **Framework:** Next.js 15 with TypeScript
- **Maps:** Leaflet with React-Leaflet
- **Routing:** OpenRouteService API
- **Styling:** Tailwind CSS
- **Data:** Google Sheets API
- **Deployment:** Render.com

## API Usage

- **OpenRouteService:** 2000 requests/month free tier
- **Route Caching:** Persistent localStorage caching minimizes API usage
- **Smart Routing:** Only fetches routes for new location segments
