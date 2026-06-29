**Welcome to your Smart Class Pulse project** 

**About**

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will update the application.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_APP_ID=your_app_id
VITE_APP_BASE_URL=your_backend_url

e.g.
VITE_APP_ID=com.smartclasspulse.app
VITE_APP_BASE_URL=https://smart-class-pulse.app
```

Run the app: `npm run dev`

**Final Deployment Steps:**

1. **Set API Key:**
   Run `firebase functions:secrets:set GEMINI_API_KEY` and paste your key.
2. **Deploy Backend:**
   Run `firebase deploy`
3. **Android App:**
   Ensure `google-services.json` is in `android/app/`, then run `npx cap sync android`.

**Docs & Support**

Support: [https://smartclasspulse.app/support](https://smartclasspulse.app/support)
