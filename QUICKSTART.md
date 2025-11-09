# 🚀 Branch Quick Start Guide

Your Firebase project **dann-91ae4** is now configured!

## ⚡ Get Started in 5 Minutes

### 1. Install Dependencies

```bash
cd /Users/dianhaoli/Documents/Branch

# Install all packages
npm install
cd shared && npm install && npm run build && cd ..
cd web && npm install && cd ..
cd backend && npm install && cd ..
cd extension && npm install && cd ..
```

### 2. Enable Firebase Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/project/dann-91ae4)
2. Navigate to **Authentication** → **Sign-in method**
3. Enable **Google** provider
4. Add authorized domains:
   - `localhost`
   - `dann-91ae4.firebaseapp.com`

### 3. Initialize Firestore Database

1. In Firebase Console, go to **Firestore Database**
2. Click **Create database**
3. Start in **test mode** (we'll deploy rules later)
4. Choose a location (e.g., `us-central`)

### 4. Start Development Servers

Open **3 terminal windows**:

**Terminal 1 - Web App:**
```bash
cd web
npm run dev
```
Visit: http://localhost:3000

**Terminal 2 - Backend (Firebase Emulators):**
```bash
cd backend
firebase login
firebase use dann-91ae4
npm run serve
```
Emulator UI: http://localhost:4000

**Terminal 3 - Extension:**
```bash
cd extension
npm run build
# For development, use watch mode:
npm run watch
```

### 5. Load Chrome Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Navigate to `/Users/dianhaoli/Documents/Branch/extension/dist`
6. Select the folder

The Branch extension icon should now appear in your toolbar!

### 6. Test the App

1. **Sign In:**
   - Open http://localhost:3000
   - Click "Sign in with Google"
   - Authorize with your Google account

2. **Start Studying:**
   - Open a study website (e.g., https://docs.python.org)
   - The extension will automatically start tracking
   - Or click the extension icon and start a manual session

3. **View Dashboard:**
   - Go to http://localhost:3000/dashboard
   - See your stats, XP, and session data

## 🔧 Configuration Files Created

✅ **web/.env.local** - Environment variables with your Firebase config
✅ **backend/.firebaserc** - Firebase project selection
✅ **extension/src/config.ts** - Extension configuration

## 🎯 Current Setup

- **Project ID**: `dann-91ae4`
- **Region**: `us-central1` (default)
- **Web App**: http://localhost:3000
- **Firebase Functions**: http://localhost:5001
- **Firestore UI**: http://localhost:4000

## 📝 Next Steps

### Required for Full Functionality

1. **Deploy Firestore Rules:**
   ```bash
   cd backend
   firebase deploy --only firestore:rules
   firebase deploy --only firestore:indexes
   ```

2. **Add OpenAI API Key (Optional - for AI features):**
   - Get key from https://platform.openai.com/api-keys
   - Add to `backend/functions/.env`:
     ```
     OPENAI_API_KEY=sk-...your-key-here
     ```
   - Restart backend emulator

3. **Create Extension Icons:**
   - The extension uses placeholder icons
   - Create actual PNG icons (16x16, 32x32, 48x48, 128x128)
   - Place in `extension/public/icons/`
   - See `extension/public/icons/README.md` for details

### Test Each Feature

- ✅ **Auth**: Sign in/out
- ✅ **Extension**: Start/stop sessions
- ✅ **Dashboard**: View stats
- ✅ **Social**: Check leaderboard (needs multiple users)
- ✅ **Insights**: View AI summaries (needs OpenAI key)
- ✅ **To-Dos**: Create and complete tasks

## 🐛 Troubleshooting

### "Permission denied" in Firestore
- Make sure you're signed in
- Check Firestore is in test mode OR deploy rules:
  ```bash
  cd backend && firebase deploy --only firestore:rules
  ```

### Extension not tracking
- Check the extension is loaded in Chrome
- Visit a whitelisted study domain (see `shared/src/constants/index.ts`)
- Open DevTools → Console to see any errors
- Check background service worker is running (`chrome://extensions/`)

### Firebase Functions not working
- Make sure you ran `firebase login`
- Check `firebase use dann-91ae4` is set
- Restart the emulator: `npm run serve`
- Check http://localhost:4000 for function logs

### Web app won't start
- Make sure `.env.local` exists in `web/` directory
- Verify all dependencies are installed
- Clear `.next` folder and rebuild: `rm -rf .next && npm run dev`

## 🚀 Deployment (When Ready)

### Web App to Vercel
```bash
cd web
vercel login
vercel deploy
```

### Backend to Firebase
```bash
cd backend
firebase deploy
```

### Extension to Chrome Web Store
1. Build: `cd extension && npm run build`
2. Zip: `cd dist && zip -r ../dan-extension.zip .`
3. Upload to Chrome Web Store Developer Dashboard

## 📊 Check Everything Works

Run through this checklist:

- [ ] Web app loads at localhost:3000
- [ ] Can sign in with Google
- [ ] Dashboard shows user data
- [ ] Extension icon appears in Chrome
- [ ] Extension popup opens and shows UI
- [ ] Extension tracks sessions on study sites
- [ ] Sessions appear in dashboard
- [ ] XP is awarded correctly
- [ ] Firebase emulators are running
- [ ] Can view data in Firestore UI (localhost:4000)

## 🎉 You're All Set!

Branch is now running locally. Start studying and watch your productivity soar! 📚🚀

Need help? Check:
- SETUP.md - Detailed setup guide
- ARCHITECTURE.md - Technical details
- FEATURES.md - Feature documentation

Happy coding! 💻

