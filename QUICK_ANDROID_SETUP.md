# 📱 Quick Setup for Android Access

## Your Network Information
- **Your IP Address:** `101.101.100.203`
- **Port:** `3000`
- **Access URL:** `http://101.101.100.203:3000`

## ✅ Steps to Access on Android

### 1. Start the Development Server

Open PowerShell in your project directory and run:

```powershell
npm start
```

You should see output like:
```
Compiled successfully!

You can now view boardinghub in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://101.101.100.203:3000
```

### 2. Allow Through Firewall (If Needed)

If you get "connection refused" on Android, allow Node.js through Windows Firewall:

1. Press `Win + R`, type `wf.msc`, press Enter
2. Click "Inbound Rules" → "New Rule"
3. Select "Program" → Next
4. Browse to Node.js (usually `C:\Program Files\nodejs\node.exe`)
5. Allow the connection
6. Apply to all profiles
7. Name it "Node.js Development Server"

Or temporarily disable firewall to test:
```powershell
# Run as Administrator
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False
```

### 3. Access on Android Device

1. **Make sure your Android device is on the same WiFi network**
   - Check WiFi settings on Android
   - Should be connected to the same network as your computer

2. **Open Chrome browser on Android**

3. **Enter this URL in the address bar:**
   ```
   http://101.101.100.203:3000
   ```

4. **The app should load!** 🎉

## 🔧 Troubleshooting

### Issue: "This site can't be reached"

**Solutions:**
- ✅ Verify both devices are on the same WiFi network
- ✅ Check that the development server is running
- ✅ Try disabling Windows Firewall temporarily
- ✅ Make sure you're using `http://` not `https://`
- ✅ Check if your router has "AP Isolation" enabled (disable it)

### Issue: "Connection refused"

**Solutions:**
- ✅ Make sure `.env` file exists with `HOST=0.0.0.0`
- ✅ Restart the development server after creating `.env`
- ✅ Check Windows Firewall settings

### Issue: App loads but looks broken

**Solutions:**
- ✅ Check browser console on Android (Chrome → Menu → More tools → Remote debugging)
- ✅ Make sure all assets are loading (check Network tab)
- ✅ Try clearing browser cache on Android

## 📝 Quick Reference

**Your Setup:**
- IP: `101.101.100.203`
- Port: `3000`
- URL: `http://101.101.100.203:3000`

**Commands:**
```powershell
# Start server
npm start

# Check if server is accessible (from another device)
# Should return HTML content
curl http://101.101.100.203:3000
```

## 💡 Pro Tips

- **Bookmark the URL** on your Android device for easy access
- **Keep the terminal open** - closing it stops the server
- **Check the terminal** for any errors when accessing from Android
- **Use Chrome DevTools** to debug on Android (chrome://inspect)

---

**Ready to test?** Start the server and open `http://101.101.100.203:3000` on your Android device!


