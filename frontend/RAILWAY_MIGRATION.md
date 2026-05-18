# Migration Guide: Render → Railway

This guide will help you migrate your frontend (Next.js) to Railway.

## Prerequisites

1. Create a Railway account at https://railway.app
2. Connect your GitHub repository to Railway
3. Have your environment variables ready
4. Note your Railway backend URL (e.g., `https://your-backend.up.railway.app`)

---

## Part 1: Deploy Frontend (Next.js) to Railway

### Step 1: Create a New Project

1. Go to Railway Dashboard → **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your `Birthday-Sadie-Client` repository

### Step 2: Railway Auto-Detection

Railway will automatically:
- Detect Next.js
- Set up build and start commands
- Create a service

### Step 3: Configure Build Settings (if needed)

Railway usually auto-detects, but you can verify:
- **Build Command**: `npm install && npm run build` (auto-detected)
- **Start Command**: `npm start` (auto-detected)
- **Root Directory**: Leave as default (usually `/`)

### Step 4: Add Environment Variables

In Railway Dashboard → Your Service → Variables, add ALL your `NEXT_PUBLIC_*` variables:

**Firebase:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyASAJCGRHhBIVIbtFqDu1DJNq2aYnz9kaU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=birthday-sadie.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=birthday-sadie
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=birthday-sadie.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=750778284703
NEXT_PUBLIC_FIREBASE_APP_ID=1:750778284703:web:228f3a73d7d066b7d700aa
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-P59QM72E7L
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://birthday-sadie.firebaseio.com
```

**Backend API URL (IMPORTANT - Update to Railway URL!):**
```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
```
(Replace with your actual Railway backend URL)

**Frontend URL (Optional - for SMS/QR code pages):**
```
NEXT_PUBLIC_FRONTEND_URL=https://your-frontend.up.railway.app
```
(If not set, it will use the current origin automatically)

**Party Configuration:**
```
NEXT_PUBLIC_PARTY_ID=1
NEXT_PUBLIC_PARTY_NAME=Sadie's 6th Birthday
NEXT_PUBLIC_PARTY_DATE=November 15, 2025
NEXT_PUBLIC_PARTY_TIME=12:00 PM CST
NEXT_PUBLIC_PARTY_VENUE_NAME=Haley Meadows Farm
NEXT_PUBLIC_PARTY_LOCATION=140 Haley Road, Wartrace, TN  37183
NEXT_PUBLIC_PARTY_THEME=6 Years Later
NEXT_PUBLIC_PARTY_LATITUDE=35.5061
NEXT_PUBLIC_PARTY_LONGITUDE=-86.2553
```

**Backgrounds:**
```
NEXT_PUBLIC_BACKGROUND_IMAGE=/images/gary-background.jpg
NEXT_PUBLIC_LOGGED_IN_BACKGROUND_IMAGE=/images/member-background.jpg
```

**Social Links:**
```
NEXT_PUBLIC_FACEBOOK_LIVE_URL=https://fb.me/1N68sW4pC5hCtQr
NEXT_PUBLIC_VENMO_USERNAME=isabellaCarter_18
NEXT_PUBLIC_REGISTRY_URL=https://www.amazon.com/hz/wishlist/ls/31ZU0SPC9RVD?ref_=wl_share&fbclid=IwY2xjawOATS9leHRuA2FlbQIxMABicmlkETFQVW80UDFTUEhrUWFSUno3c3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHjHmS7QHcO8Xux_kHljuZ3ltD_g1Wau0ODgti0AaMoj_j-CvM1SpULuK4c-a_aem_Y6Uo6beWhBq5kMDQ0KsW_g
```

**Messaging:**
```
NEXT_PUBLIC_THANK_YOU_TITLE=Thank You!
NEXT_PUBLIC_THANK_YOU_MESSAGE=Thanks for helping Sadie turn 6 in the most magical way!
NEXT_PUBLIC_THANK_YOU_SUBMESSAGE=Check back soon—we will keep adding fresh photos and memories.
```

**Colors:**
```
NEXT_PUBLIC_PRIMARY_COLOR=#0B4F8C
NEXT_PUBLIC_SECONDARY_COLOR=#58C4F6
NEXT_PUBLIC_ACCENT_COLOR=#FF86C8
NEXT_PUBLIC_LOGGED_IN_PRIMARY_COLOR=#0A2C59
NEXT_PUBLIC_LOGGED_IN_SECONDARY_COLOR=#47B7F2
NEXT_PUBLIC_LOGGED_IN_ACCENT_COLOR=#FF7AB6
```

**Admin:**
```
NEXT_PUBLIC_ADMIN_EMAILS=mkd.princess@gmail.com
```

### Step 5: Deploy

Railway will automatically build and deploy. Note the URL (e.g., `https://your-frontend.up.railway.app`)

---

## Part 2: Update Backend CORS Settings

After deploying the frontend, update your Django backend's `CORS_ALLOWED_ORIGINS` to include your Railway frontend URL:

```python
CORS_ALLOWED_ORIGINS = [
    'https://your-frontend.up.railway.app',
    # Add your custom domain if you have one
]
```

Then redeploy the backend.

---

## Part 3: Update Firebase Authorized Domains

1. Go to Firebase Console → Authentication → Settings
2. Add your Railway frontend domain to **Authorized domains**:
   - `your-frontend.up.railway.app`
   - Or your custom domain if you have one

---

## Important Notes

### Railway Advantages

- **Persistent Storage**: Railway can persist files between deployments (unlike Render)
- **No Sleeping**: Services don't sleep on free tier
- **Auto-Deploy**: Automatically deploys on git push
- **Simple Setup**: Auto-detects frameworks

### Custom Domains

You can add custom domains in Railway Dashboard → Your Service → Settings → Domains

### Environment Variables

- All `NEXT_PUBLIC_*` variables must be set in Railway Dashboard
- They are injected at build time for Next.js
- Changes require a redeploy (automatic on push)

### Database

- Railway PostgreSQL is available and recommended
- Connection string is automatically provided as `DATABASE_URL`
- Files persist between deployments

---

## Troubleshooting

### Frontend Issues

- **Build Fails**: Check build logs in Railway Dashboard → Deployments
- **Environment Variables Not Working**: Ensure they're set in Railway Dashboard → Variables
- **API Calls Fail**: Verify `NEXT_PUBLIC_API_URL` points to your Railway backend URL

### Backend Issues

- **CORS Errors**: Update `CORS_ALLOWED_ORIGINS` to include your Railway frontend URL
- **Database Connection**: Verify `DATABASE_URL` is set correctly
- **Media Files**: Railway persists files, so media should work correctly

---

## Migration Checklist

- [ ] Deploy Next.js frontend to Railway
- [ ] Note frontend Railway URL
- [ ] Set all environment variables in Railway Dashboard
- [ ] Update `NEXT_PUBLIC_API_URL` to Railway backend URL
- [ ] Update backend `CORS_ALLOWED_ORIGINS` to include Railway frontend URL
- [ ] Update Firebase Authorized domains
- [ ] Test photo uploads (should work now with persistent storage!)
- [ ] Test all features
- [ ] Verify images load correctly

---

## Key Differences from Render

1. **No render.yaml needed** - Railway auto-detects everything
2. **Persistent storage** - Media files persist between deployments
3. **No sleeping** - Services stay awake on free tier
4. **Simpler setup** - Less configuration needed
