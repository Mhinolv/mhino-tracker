# Google Sheets API Setup Guide

Now that Google Cloud CLI is installed, follow these steps to set up your Google Sheets API:

## 1. Initialize gcloud (if not already done)
```bash
gcloud init
```

## 2. Create or select a Google Cloud project
```bash
# Create a new project (replace PROJECT_ID with your desired ID)
gcloud projects create PROJECT_ID

# Or list existing projects
gcloud projects list

# Set the project
gcloud config set project PROJECT_ID
```

## 3. Enable the Google Sheets API
```bash
gcloud services enable sheets.googleapis.com
```

## 4. Create a service account and download credentials
```bash
# Create service account
gcloud iam service-accounts create location-tracker \
    --display-name="Location Tracker Service Account"

# Create and download key file
gcloud iam service-accounts keys create credentials.json \
    --iam-account=location-tracker@PROJECT_ID.iam.gserviceaccount.com
```

## 5. Update your .env.local file
Instead of using an API key, update your `.env.local` to use the service account:
```
GOOGLE_SERVICE_ACCOUNT_FILE=./credentials.json
GOOGLE_SHEET_ID=your_sheet_id_here
```

## 6. Share your Google Sheet
1. Open your Google Sheet
2. Click "Share" in the top right
3. Add the service account email: `location-tracker@PROJECT_ID.iam.gserviceaccount.com`
4. Give it "Viewer" permissions
5. Copy the Sheet ID from the URL (between `/d/` and `/edit`)

## 7. Format your Google Sheet
Make sure your sheet has these columns in order:
- Column A: Timestamp (e.g., "2023-12-01 14:30:00")
- Column B: Latitude (e.g., "40.7128")
- Column C: Longitude (e.g., "-74.0060")
- Column D: Address (optional)
- Column E: Notes (optional)

## Quick Setup Commands
Run these commands in your terminal (replace PROJECT_ID with your actual project ID):

```bash
# Navigate to your project
cd /Users/MarkHinojosa/Projects/MhinoTracker/location-tracker

# Set your project ID
export PROJECT_ID="your-project-id"

# Enable API and create service account
gcloud config set project $PROJECT_ID
gcloud services enable sheets.googleapis.com
gcloud iam service-accounts create location-tracker --display-name="Location Tracker Service Account"
gcloud iam service-accounts keys create credentials.json --iam-account=location-tracker@$PROJECT_ID.iam.gserviceaccount.com

echo "Service account email: location-tracker@$PROJECT_ID.iam.gserviceaccount.com"
echo "Add this email to your Google Sheet with Viewer permissions"
```