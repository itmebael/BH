# 🔧 Remove Next.js Plugin from Netlify (CRA Project)

## ⚠️ Important

This is a **Create React App (CRA)** project, NOT a Next.js project. The Next.js plugin can interfere with CRA builds and should be removed.

## ✅ Step-by-Step Guide

### Option 1: Remove via Netlify UI (Recommended)

1. **Go to Netlify Dashboard**
   - Visit: https://app.netlify.com
   - Select your site

2. **Navigate to Plugins**
   - Go to: **Site settings** → **Build & deploy** → **Plugins**
   - OR: **Site** → **Plugins** (in the left sidebar)

3. **Find and Remove Next.js Plugin**
   - Look for `@netlify/plugin-nextjs` in the list
   - Click the **three dots** (⋯) or **Uninstall** button
   - Confirm removal

4. **Verify Build Settings**
   - Go to: **Site settings** → **Build & deploy** → **Build settings**
   - Verify:
     - **Build command:** `npm run build`
     - **Publish directory:** `build`
   - If incorrect, update and save

5. **Clear Cache and Redeploy**
   - Go to: **Deploys** tab
   - Click **Trigger deploy** → **Clear cache and deploy site**

### Option 2: Verify netlify.toml (Already Done ✅)

The `netlify.toml` file is already configured correctly:
- ✅ No Next.js plugin references
- ✅ Build command: `npm run build`
- ✅ Publish directory: `build`
- ✅ Node version: 18.20.0
- ✅ SPA redirects configured

**No changes needed in the file** - it's already correct for CRA.

## 🔍 How to Check if Plugin is Installed

### In Netlify UI:
1. Go to **Site settings** → **Plugins**
2. Look for any plugin named:
   - `@netlify/plugin-nextjs`
   - `netlify-plugin-nextjs`
   - Any plugin with "next" in the name

### In Build Logs:
If you see messages like:
- "Installing Next.js plugin..."
- "Running Next.js plugin..."
- "Next.js build detected..."

Then the plugin is installed and should be removed.

## ✅ Verification Checklist

After removing the plugin, verify:

- [ ] No Next.js plugin in Plugins list
- [ ] Build command is: `npm run build`
- [ ] Publish directory is: `build`
- [ ] Node version is set to 18.x (via netlify.toml or UI)
- [ ] Build completes successfully
- [ ] Site deploys correctly

## 🚀 After Removal

1. **Clear Build Cache**
   - Netlify Dashboard → Deploys → Trigger deploy → Clear cache and deploy

2. **Monitor Build**
   - Watch the build log for any errors
   - Should see: "Running build command: npm run build"
   - Should NOT see: "Installing Next.js plugin"

3. **Test Deployment**
   - Visit your deployed site
   - Verify all features work
   - Check browser console for errors

## 📝 Current Configuration

Your `netlify.toml` is correctly configured:

```toml
[build]
  command = "npm run build"      # ✅ Correct for CRA
  publish = "build"              # ✅ Correct for CRA

[build.environment]
  NODE_VERSION = "18.20.0"      # ✅ Compatible version

# No plugins section = No Next.js plugin ✅
```

## 🎯 Summary

- **Problem:** Next.js plugin installed but this is a CRA project
- **Solution:** Remove plugin from Netlify UI
- **Config:** `netlify.toml` is already correct (no changes needed)
- **Next:** Clear cache and redeploy

---

**After removing the plugin and redeploying, your CRA build should work correctly!** 🎉


