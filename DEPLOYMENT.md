# Netlify Deployment Guide

Deploy HistoryWrite to Netlify and get automatic live preview URLs for every GitHub branch.

## Quick Deployment (5 minutes)

### Step 1: Push to GitHub
```bash
git push origin claude/find-html-file-Ckaoq
```

### Step 2: Connect to Netlify
1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Select **GitHub** as your Git provider
4. Authorize Netlify to access your GitHub account
5. Select your repository: `sinonymNA/history-write`
6. Click **Deploy site**

Netlify will automatically:
- Detect build command: `npm run build`
- Detect publish directory: `dist`
- Create your production site

### Step 3: Add Firebase Environment Variables
1. After the first deploy, go to your Netlify site dashboard
2. Click **Site Settings** → **Environment**
3. Click **Add environment variables**
4. Add each Firebase variable from `.env.example`:
   - `VITE_FIREBASE_API_KEY` = [your value]
   - `VITE_FIREBASE_AUTH_DOMAIN` = [your value]
   - `VITE_FIREBASE_PROJECT_ID` = [your value]
   - `VITE_FIREBASE_STORAGE_BUCKET` = [your value]
   - `VITE_FIREBASE_MESSAGING_SENDER_ID` = [your value]
   - `VITE_FIREBASE_APP_ID` = [your value]

5. Click **Save**
6. Go back to **Deploys** → Click **Trigger deploy** → **Deploy site**

### Step 4: Get Your Live URL
Once the deploy completes, you'll see:
- **Production URL**: `https://your-site-name.netlify.app`
- **Deploy logs**: Check for any build errors
- **Status badge**: Shows deployment status

---

## Preview URLs for Every Branch

Every push to GitHub automatically creates a preview deploy:

```
Feature Branch Deploy:
https://your-branch-name--your-site-name.netlify.app

Pull Request Preview:
Auto-comment on PR with preview link
```

### How it Works:
1. Push to `feature-branch`
2. Netlify auto-detects the push
3. Starts build: `npm run build`
4. Deploys to `https://feature-branch--your-site-name.netlify.app`
5. Takes ~2 minutes

You can test features without running anything locally!

---

## Production Checklist

Before going live with real users:

- [ ] Firebase Firestore database is created
- [ ] Firebase authentication is enabled
- [ ] Firestore security rules are configured correctly
- [ ] All Firebase environment variables are set in Netlify
- [ ] Test signup/login flow on production URL
- [ ] Test essay submission and grading
- [ ] Verify light/dark theme toggle works
- [ ] Check responsive design on mobile
- [ ] Test all games and features

---

## Troubleshooting

### Build Fails with "Module not found"
**Solution**: Ensure `package.json` and `package-lock.json` are committed to Git

```bash
git add package.json package-lock.json
git commit -m "Add package files"
git push
```

Then trigger a new deploy on Netlify.

### "Firebase configuration error"
**Solution**: Environment variables not set or incorrect

1. Go to Site Settings → Environment
2. Verify all `VITE_*` variables are set
3. Check values match exactly from Firebase Console
4. Trigger new deploy

### Port 5173 not accessible
**Solution**: This is for local dev only. Netlify uses port 443 (HTTPS)

Your live app is at: `https://your-site-name.netlify.app`

### CSS/styling missing on production
**Solution**: Tailwind CSS needs build step

Netlify automatically runs `npm run build` which includes Tailwind compilation. If styles are missing:
1. Clear browser cache
2. Hard refresh (Cmd+Shift+R)
3. Trigger rebuild on Netlify

---

## Environment Variables Reference

### Required Variables
All must be added to **Netlify Site Settings → Environment**:

| Variable | Source | Example |
|----------|--------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Console | `AIzaSyDxxx...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Console | `myproject.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Console | `myproject-abc123` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Console | `myproject.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase Console | `1:123456789:web:abc123def456` |

### Optional Variables
- `VITE_FIREBASE_MEASUREMENT_ID` - Only if Google Analytics enabled

---

## How Netlify.toml Works

The `netlify.toml` file in the root directory configures:

```toml
[build]
  command = "npm run build"      # Build command
  publish = "dist"               # Output directory

[[redirects]]
  from = "/*"
  to = "/index.html"             # SPA routing fix
  status = 200

[[headers]]
  # Security headers
  # Cache optimization
```

This ensures:
- ✅ Vite builds correctly
- ✅ React Router works properly
- ✅ Security headers are sent
- ✅ Assets are cached efficiently
- ✅ HTML is always fresh

---

## Monitoring Deployments

### View Deploy Logs
1. Netlify Dashboard → **Deploys**
2. Click a deploy timestamp
3. Scroll to **Deploy log** section
4. See real-time build output

### Set Up Notifications
1. **Site Settings** → **Notifications**
2. Add email or Slack notifications for:
   - Successful deploys
   - Failed builds
   - Custom notifications

### Rollback to Previous Deploy
1. **Deploys** → Select a previous deploy
2. Click **...** → **Publish deploy**
3. That version is now live

---

## Domain Configuration

### Using a Custom Domain
1. **Site Settings** → **Domain management**
2. Click **Add custom domain**
3. Enter your domain: `example.com`
4. Follow DNS setup instructions for your registrar
5. Netlify auto-provisions SSL certificate

### Using Netlify Subdomain
Your automatic URL: `https://your-site-name.netlify.app`

No additional configuration needed!

---

## Analytics & Monitoring

### View Site Stats
1. Netlify Dashboard → **Analytics**
2. See deployment frequency, build times, etc.

### Monitor Performance
- Netlify has built-in performance monitoring
- View in Site Settings → **Functions** (if using serverless)

---

## Cost

**Netlify Free Plan** includes:
- ✅ Unlimited sites
- ✅ Automatic Git deploys
- ✅ Branch deploys (preview URLs)
- ✅ HTTPS + CDN
- ✅ 100GB bandwidth/month
- ✅ 300 minutes build time/month

**Perfect for most projects!**

Upgrade to Pro only if you need:
- More build minutes
- Advanced analytics
- Team management features

---

## Next Steps

1. ✅ Deploy to Netlify (see Quick Deployment above)
2. ✅ Get your live preview URL
3. ✅ Test the app on production
4. ✅ Share URL with team for testing
5. ✅ Continue with Phase 2 component development
6. ✅ Every push creates automatic preview deploy

You now have:
- 🌐 Live production environment
- 🔗 Automatic preview URLs for branches
- ⚡ Zero-downtime deploys
- 🔒 HTTPS + security headers
- 📊 Build logs and monitoring

**Happy deploying!** 🚀
