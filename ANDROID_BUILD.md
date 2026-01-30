# Sakinah Path - Android Build Guide

## Prerequisites

1. **Node.js** (v18+) and npm/bun
2. **Android Studio** with:
   - Android SDK (API 33+)
   - Android SDK Build-Tools
   - Android Emulator (optional)
3. **Java JDK 17** (for Gradle)

## Setup Instructions

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd sakinah-path
npm install
# or
bun install
```

### 2. Add Android Platform

```bash
npx cap add android
```

### 3. Configure Android Manifest

After adding Android, update `android/app/src/main/AndroidManifest.xml` to include required permissions:

```xml
<!-- Add inside <manifest> tag, before <application> -->

<!-- Location Permissions -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Notification Permissions (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />

<!-- Boot Completed for rescheduling notifications -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Wake Lock for alarms -->
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Vibration -->
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Foreground Service for location updates -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

Also add the Boot Receiver inside `<application>` tag:

```xml
<!-- Boot Completed Receiver for notifications -->
<receiver android:name="com.capacitorjs.plugins.localnotifications.LocalNotificationRestoreReceiver"
    android:exported="false">
    <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED" />
    </intent-filter>
</receiver>
```

### 4. Build & Sync

```bash
# Build the web app
npm run build

# Sync to Android
npx cap sync android
```

### 5. Open in Android Studio

```bash
npx cap open android
```

### 6. Run on Device/Emulator

```bash
npx cap run android
```

Or use Android Studio to run/debug.

## Hot Reload Development

The `capacitor.config.ts` is configured to use the Lovable preview URL for hot reload during development. When building for production:

1. Edit `capacitor.config.ts`
2. Comment out or remove the `server.url` line:

```typescript
server: {
  // url: 'https://...', // Comment this out for production
  cleartext: true,
},
```

3. Rebuild and sync:

```bash
npm run build
npx cap sync android
```

## Notification Channels

The app creates these notification channels automatically:

| Channel ID | Name | Description |
|------------|------|-------------|
| `prayer-times` | Waktu Sholat | Prayer time reminders (5 min before) |
| `daily-reminder` | Pengingat Harian | Daily task reminders (17:00 & 21:00) |
| `streak-warning` | Peringatan Streak | Streak warning before midnight |

## Permissions Flow

1. **Location Permission**: Required for prayer times and mosque finder
2. **Notification Permission**: Required for prayer/task reminders
3. **GPS Check**: App prompts user to enable GPS if disabled

The permission dialog appears on first launch and can be re-triggered from settings.

## Troubleshooting

### "Location unavailable" error
- Ensure GPS is enabled on device
- Grant location permission in app settings

### Notifications not appearing
- Check notification channel settings in Android
- Ensure "Do Not Disturb" is off
- Verify notification permission is granted

### Build errors
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

## Production Build

1. Update `capacitor.config.ts` to remove dev server URL
2. Build web app: `npm run build`
3. Sync: `npx cap sync android`
4. In Android Studio:
   - Build → Generate Signed Bundle/APK
   - Choose APK
   - Create/select keystore
   - Build release APK

The APK will be in `android/app/release/app-release.apk`
