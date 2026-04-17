# Backend Deployment to Vercel

Your backend is now configured to deploy to Vercel alongside your frontend on `abance-2-igez.vercel.app`.

## Deployment Steps

### 1. Push to GitHub
```bash
git add .
git commit -m "Configure backend for Vercel deployment"
git push origin main
```

### 2. Deploy Backend to Vercel

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to backend directory
cd backend

# Deploy
vercel
```

**Option B: Using Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Create a new project from your GitHub repo
3. Set root directory to `backend/`
4. Click Deploy

### 3. What Changed

✅ **vercel.json** - Vercel configuration file created
✅ **backend/server.js** - Updated to work with Vercel's serverless environment
✅ **src/config.js** - Created API configuration file
✅ **src/PreForm.jsx** - Updated to use dynamic API URL
✅ **src/form/ApplicationForm.jsx** - Updated to use dynamic API URL

### 4. How It Works

#### Local Development
- Backend runs on: `http://localhost:3001`
- Frontend uses: `http://localhost:3001` for API calls

#### Production (Vercel)
- Backend runs on: `https://abance-2-igez.vercel.app`
- Frontend uses: `https://abance-2-igez.vercel.app` for API calls

### 5. Key Updates

**CORS Configuration:**
```javascript
const allowedOrigins = [
  "http://localhost:5173",           // Local Vite development
  "http://localhost:3000",           // Local alternative
  "https://abance-2-igez.vercel.app" // Production frontend
];
```

**Vercel Export:**
```javascript
// For Vercel: export as serverless function
module.exports = app;

// For local development: listen on PORT
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    // ... startup logs
  });
}
```

### 6. Testing

1. **Local Test:**
   ```bash
   cd backend
   npm start
   ```
   Visit: `http://localhost:5173` (frontend should work)

2. **Production Test:**
   - Visit: `https://abance-2-igez.vercel.app`
   - Submit the application form
   - Check WorkHub24 for submissions

### 7. Environment Variables

If you need to add environment variables in Vercel:
1. Go to Project Settings → Environment Variables
2. Add `AUTH_TOKEN` if you want to make it configurable
3. Update `server.js` to use `process.env.AUTH_TOKEN`

### 8. Troubleshooting

**CORS Error:** Ensure your frontend domain is in the `allowedOrigins` array
**502 Bad Gateway:** Check logs in Vercel Dashboard → Logs tab
**Token Expired:** Update `AUTH_TOKEN` in `server.js` when it expires

---

**Status:** ✅ Ready to deploy. Run Vercel CLI or use dashboard to complete deployment.
