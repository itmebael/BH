# 📱 How to Run BoardingHub on Android Using WiFi

This guide will help you access your React development server from an Android device on the same WiFi network.

## 🚀 Quick Steps

### Step 1: Find Your Computer's IP Address

**On Windows:**
```bash
ipconfig
```
Look for `IPv4 Address` under your WiFi adapter (usually starts with `192.168.x.x` or `10.0.x.x`)

**On Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```
Look for `inet` address under `wlan0` or `en0` (usually starts with `192.168.x.x`)

**Example IP:** `192.168.1.100`

### Step 2: Configure React to Accept Network Connections

You have two options:

#### **Option A: Set Environment Variable (Recommended)**

Create or update your `.env` file in the project root:

```env
HOST=0.0.0.0
PORT=3000
```

This allows the server to accept connections from any network interface.

#### **Option B: Set HOST via Command Line (Temporary)**

**Windows (PowerShell):**
```bash
$env:HOST="0.0.0.0"; npm start
```

**Windows (CMD):**
```bash
set HOST=0.0.0.0 && npm start
```

**Mac/Linux:**
```bash
HOST=0.0.0.0 npm start
```

**Note:** Option A (`.env` file) is recommended as it persists across restarts.

### Step 3: Start the Development Server

```bash
npm start
```

The server will start and you should see output like:
```
Compiled successfully!

You can now view boardinghub in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.1.100:3000
```

**Note the "On Your Network" URL** - this is what you'll use on your Android device.

### Step 4: Configure Firewall (If Needed)

**Windows:**
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Find "Node.js" and check both "Private" and "Public"
4. If Node.js isn't listed, click "Allow another app" and add Node.js

**Mac:**
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add Node.js if not already allowed

**Linux:**
```bash
sudo ufw allow 3000
```

### Step 5: Access from Android Device

1. **Make sure your Android device is on the same WiFi network** as your computer

2. **Open Chrome or any browser on your Android device**

3. **Enter the network URL** in the address bar:
   ```
   http://192.168.1.100:3000
   ```
   (Replace `192.168.1.100` with your actual IP address)

4. **The app should load!** 🎉

## 🔧 Troubleshooting

### Issue: "This site can't be reached"

**Solutions:**
- ✅ Verify both devices are on the same WiFi network
- ✅ Check that the IP address is correct
- ✅ Make sure the development server is running
- ✅ Try disabling firewall temporarily to test
- ✅ Check if your router has "AP Isolation" enabled (disable it)

### Issue: "Connection refused"

**Solutions:**
- ✅ Make sure `HOST=0.0.0.0` is set in `.env` file
- ✅ Restart the development server after setting HOST
- ✅ Check if port 3000 is already in use

### Issue: App loads but API calls fail

**Solutions:**
- ✅ Check if your Supabase/API endpoints allow requests from your network
- ✅ Verify environment variables are set correctly
- ✅ Check browser console on Android for specific errors

### Issue: Can't find IP address

**Windows:**
```bash
ipconfig /all
```
Look for "Wireless LAN adapter Wi-Fi" section

**Mac:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Linux:**
```bash
hostname -I
```

## 📝 Quick Reference

1. **Find IP:** `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. **Set HOST:** Add `HOST=0.0.0.0` to `.env` file
3. **Start server:** `npm start`
4. **Access on Android:** `http://YOUR_IP:3000`

## 💡 Pro Tips

- **Bookmark the URL** on your Android device for easy access
- **Use a static IP** on your computer to avoid changing the URL
- **Test with another device first** (like a laptop) to verify network access works
- **Keep the terminal open** - closing it will stop the server

## 🎯 Example Workflow

```bash
# 1. Find your IP (example: 192.168.1.100)
ipconfig

# 2. Create/update .env file
echo "HOST=0.0.0.0" >> .env
echo "PORT=3000" >> .env

# 3. Start server
npm start

# 4. On Android, open browser and go to:
# http://192.168.1.100:3000
```

## ⚠️ Security Note

When using `HOST=0.0.0.0`, your development server is accessible to anyone on your local network. This is fine for development, but:
- Only use this on trusted networks (home/work)
- Don't use this on public WiFi
- For production, use proper hosting services

---

**Need help?** Check the browser console on your Android device for specific error messages!

