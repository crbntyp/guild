# Deployment Guide

## Quick Overview
- **Frontend**: FTP the `/dist` folder to your web host
- **Backend**: Deploy OAuth server to Railway (free)

---

## Part 1: Deploy OAuth Server to Railway

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub (free, no credit card needed)

### Step 2: Deploy Server
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account and select this repository
4. Railway will auto-detect the Node.js project

### Step 3: Set Environment Variables
In Railway dashboard, add these environment variables:
- `BNET_CLIENT_ID` = `86af3b20703442e78f9a90778846ce3b`
- `BNET_CLIENT_SECRET` = `xHpqmVAnuwV8DFcMQncEYxCio35MSUHq`
- `PORT` = `3001` (optional, Railway sets this automatically)

### Step 4: Get Your API URL
After deployment, Railway will give you a URL like:
`https://your-project.railway.app`

**Save this URL - you'll need it for the frontend!**

---

## Part 2: Update Frontend Configuration

### Update Auth Service
Edit `src/scripts/services/auth.js` and change:

```javascript
const API_PROXY_URL = 'https://your-project.railway.app';  // Your Railway URL
```

### Rebuild
```bash
npm run build
```

---

## Part 3: Deploy Frontend via FTP

### What to Upload
Upload the entire contents of the `/dist` folder to your web host:
- `index.html`
- `character-details.html`
- `my-characters.html`
- `scripts/` folder
- `styles/` folder
- `img/` folder
- `assets/` folder
- `fonts/` folder

### Where to Upload
Typically to one of these folders on your host:
- `public_html/`
- `www/`
- `htdocs/`

---

## Part 4: Update Battle.net OAuth Settings

1. Go to https://develop.battle.net/
2. Navigate to your application
3. Add these redirect URIs:
   - `http://localhost:8080` (for local dev)
   - `https://yourdomain.com` (your production domain)
   - `https://yourdomain.com/` (with trailing slash)

---

## Testing

1. Visit your live site
2. Click "Login with Battle.net"
3. Should redirect to Battle.net login
4. After login, should redirect back to your site

---

## Troubleshooting

### CORS Errors
If you see CORS errors, check:
- Railway environment variables are set correctly
- Frontend is pointing to correct Railway URL

### OAuth Redirect Error
If Battle.net login fails:
- Verify redirect URIs in Battle.net app settings
- Check that domain matches exactly (http vs https, trailing slash)

### 404 on API Calls
- Confirm Railway server is running (check Railway logs)
- Verify API_PROXY_URL in auth.js matches Railway URL

---

## Cost
- **Railway**: Free tier (500 hours/month, plenty for this app)
- **Frontend hosting**: Whatever you're already paying for web hosting
- **Total extra cost**: $0

---

## Alternative: Skip Railway and Use Vercel

If you prefer Vercel instead:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` in project directory
3. Follow prompts
4. Vercel will deploy both frontend and backend together
5. No need for FTP

But Railway + FTP is simpler if you already have web hosting!
