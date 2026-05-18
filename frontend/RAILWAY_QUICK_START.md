# Railway Quick Start Guide

## Frontend Migration Steps

### 1. Deploy to Railway

1. Go to https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Select `Birthday-Sadie-Client` repository
4. Railway will auto-detect Next.js and start deploying

### 2. Set Environment Variables

In Railway Dashboard → Your Service → **Variables** tab, add:

**Most Important:**
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```
(Replace with your actual Railway backend URL)

**All Other Variables:**
See `RAILWAY_ENV_VARS.md` for the complete list.

### 3. Get Your Railway URLs

After deployment, Railway will provide:
- Frontend URL: `https://your-frontend.up.railway.app`
- Backend URL: `https://your-backend.up.railway.app`

### 4. Update Backend CORS

In your Django backend `settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    'https://your-frontend.up.railway.app',
]
```

### 5. Update Firebase

Firebase Console → Authentication → Settings → Authorized domains:
- Add: `your-frontend.up.railway.app`

### 6. Test!

- Visit your Railway frontend URL
- Test photo uploads (should work now with persistent storage!)
- Verify all features work

---

## Key Benefits of Railway

✅ **Persistent Storage** - Media files persist between deployments  
✅ **No Sleeping** - Services stay awake  
✅ **Auto-Deploy** - Deploys on every git push  
✅ **Simple Setup** - Auto-detects frameworks  

---

## Troubleshooting

**Build fails?** Check Railway Dashboard → Deployments → View logs

**Environment variables not working?** 
- Make sure they're set in Railway Dashboard → Variables
- Redeploy after adding variables

**API calls fail?**
- Verify `NEXT_PUBLIC_API_URL` is set to your Railway backend URL
- Check backend CORS settings

**Images not loading?**
- Railway persists files, so this should work!
- Verify backend media files are being served correctly
