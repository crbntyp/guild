# Quick Deploy Checklist

## ✅ What's Ready
- [x] `/dist` folder built and ready for FTP
- [x] Server configured for Railway deployment
- [x] Frontend configured with API_PROXY_URL variable

## 📋 What YOU Need to Do

### 1. Deploy OAuth Server (5 minutes)
1. Go to https://railway.app and sign up
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Add environment variables:
   - `BNET_CLIENT_ID` = `86af3b20703442e78f9a90778846ce3b`
   - `BNET_CLIENT_SECRET` = `xHpqmVAnuwV8DFcMQncEYxCio35MSUHq`
5. Copy your Railway URL (looks like: `https://guild-production-xxxx.up.railway.app`)

### 2. Update Frontend Config (2 minutes)
Edit `src/scripts/services/auth.js` line 6:
```javascript
const API_PROXY_URL = 'https://your-railway-url-here.railway.app';
```

Then rebuild:
```bash
npm run build
```

### 3. Update Battle.net OAuth (2 minutes)
1. Go to https://develop.battle.net/access/clients
2. Click on your app
3. Add redirect URIs:
   - `https://yourdomain.com`
   - `https://yourdomain.com/`

### 4. FTP Upload (5 minutes)
Upload everything from `/dist` folder to your web host:
- Connect via FTP client (FileZilla, Cyberduck, etc.)
- Navigate to `public_html` or `www` folder
- Upload all files and folders from `/dist`

### 5. Test
Visit your live site and try logging in!

---

## 🔧 Files Modified for Deployment
- `server.cjs` - Now uses environment variables
- `src/scripts/services/auth.js` - Added API_PROXY_URL constant
- Created: `railway.json` - Railway deployment config
- Created: `.railwayignore` - What NOT to deploy to Railway

## 💰 Cost
$0 - Everything is free tier!

## 🆘 Need Help?
Check `DEPLOYMENT.md` for detailed troubleshooting.
