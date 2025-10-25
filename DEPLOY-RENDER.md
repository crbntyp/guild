# Deploy to Render (Alternative to Railway)

## Why Render?
- Free tier (750 hours/month)
- No credit card required
- Simpler terms of service
- Auto-deploys from GitHub

---

## Step-by-Step Deployment

### 1. Create Render Account
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (easier for deployment)

### 2. Deploy OAuth Server
1. Click "New +" button
2. Select "Web Service"
3. Connect your GitHub repository
4. Select the `guild` repository

### 3. Configure the Service
Render will auto-detect the Node.js app. Set these values:

**Basic Settings:**
- **Name**: `guild-oauth-server` (or whatever you want)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.cjs`
- **Instance Type**: `Free`

**Environment Variables:**
Click "Advanced" and add:
- `BNET_CLIENT_ID` = `86af3b20703442e78f9a90778846ce3b`
- `BNET_CLIENT_SECRET` = `xHpqmVAnuwV8DFcMQncEYxCio35MSUHq`

### 4. Deploy
1. Click "Create Web Service"
2. Wait 2-3 minutes for deployment
3. Your URL will be: `https://guild-oauth-server.onrender.com` (or similar)

**Copy this URL - you'll need it!**

---

## Update Frontend Configuration

### Edit auth.js
Change line 6 in `src/scripts/services/auth.js`:

```javascript
const API_PROXY_URL = 'https://your-app-name.onrender.com';
```

### Rebuild
```bash
npm run build
```

---

## Update Battle.net OAuth Settings

1. Go to https://develop.battle.net/access/clients
2. Click your app
3. Add redirect URIs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/`

---

## FTP Upload

Upload the `/dist` folder contents to your web host.

---

## Important Note: Free Tier Sleep

⚠️ **Render's free tier sleeps after 15 minutes of inactivity.**

**What this means:**
- First login might take 30-60 seconds (waking up the server)
- After that, it's fast until it sleeps again

**Solutions:**
1. **Keep it awake**: Use a free uptime monitor like UptimeRobot to ping your server every 10 minutes
2. **Upgrade**: Pay $7/month for always-on instance (if needed)
3. **Accept it**: Most users won't notice the initial delay

---

## Alternative: Glitch (Even Simpler!)

If Render also has issues, try **Glitch**:

1. Go to https://glitch.com
2. Click "New Project" → "Import from GitHub"
3. Paste your GitHub URL
4. Glitch auto-deploys everything
5. Your URL: `https://your-project.glitch.me`

**Pros:**
- Instant setup
- No configuration needed
- Web-based editor

**Cons:**
- Also sleeps after 5 minutes
- Less professional URL

---

## Cost Comparison

| Service | Free Tier | Sleep Time | Wakeup Time |
|---------|-----------|------------|-------------|
| Railway | 500 hrs/mo | Never | N/A |
| Render | 750 hrs/mo | After 15min | ~30-60s |
| Glitch | Always | After 5min | ~10-20s |

**Recommendation:** Try Render first. If the sleep issue bothers you, upgrade to Render's paid tier ($7/mo) or use Railway if you can accept ToS later.
