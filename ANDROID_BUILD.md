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

### 3. Configure Android Manifest (CRITICAL!)

After adding Android, update `android/app/src/main/AndroidManifest.xml`:

**Add these permissions BEFORE `<application>` tag:**

```xml
<!-- Location Permissions (CRITICAL for Prayer Times) -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

<!-- Notification Permissions (Android 13+) -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Exact Alarm for precise notifications -->
<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />
<uses-permission android:name="android.permission.USE_EXACT_ALARM" />

<!-- Boot Completed - reschedule notifications after restart -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

<!-- Keep CPU awake for alarms -->
<uses-permission android:name="android.permission.WAKE_LOCK" />

<!-- Vibration for notifications -->
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Foreground Service for background location -->
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />

<!-- Internet for API calls -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**Add these attributes to the `<application>` tag for storage permissions:**

```xml
<application
    android:requestLegacyExternalStorage="true"
    ... other existing attributes ...>
```

**Add Boot Completed Receiver inside `<application>` tag:**

```xml
<!-- Boot Completed Receiver for rescheduling notifications -->
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

The app automatically creates these notification channels:

| Channel ID | Name | Description | Importance |
|------------|------|-------------|------------|
| `prayer-times` | Jadwal Sholat | Notifikasi waktu sholat (Adzan) | HIGH (5) - Sound + Heads-up |
| `daily-reminder` | Pengingat Ibadah | Tugas harian, dzikir | DEFAULT (4) |
| `quran-reminder` | Pengingat Al-Quran | Pengingat membaca Al-Quran | DEFAULT (4) |
| `streak-warning` | Peringatan Streak | Peringatan sebelum streak hilang | HIGH (5) |
| `reflection` | Refleksi Malam | Muhasabah dan taubat | LOW (3) |

## Notification Schedule

| Type | Time | Description |
|------|------|-------------|
| Prayer Times | 5 min before | Pengingat sebelum waktu sholat |
| Task Reminder | 17:00 | Cek target harian (7 jam sebelum reset) |
| Task Reminder | 21:00 | Pengingat terakhir (3 jam sebelum reset) |
| Reflection | 21:30 | Waktu muhasabah malam |
| Tahajjud | 03:30 | Panggilan tahajjud |
| Quran | 06:00 | Pengingat membaca Al-Quran |
| Dzikir Pagi | 05:30 | Pengingat dzikir pagi |
| Dzikir Petang | 16:30 | Pengingat dzikir petang |
| Streak Warning | 22:30 | Peringatan streak |
| Streak Final | 23:30 | Peringatan terakhir sebelum reset |

## Permissions Flow

1. **First Launch**: App shows PermissionDialog with explanation
2. **Location Permission**: Required for prayer times and mosque finder
3. **Notification Permission**: Required for all reminders
4. **GPS Check**: App prompts user to enable GPS if disabled
5. **Settings Fallback**: If user denies, app provides button to open Android Settings

## Troubleshooting

### Location dialog not appearing
- Check if `ACCESS_FINE_LOCATION` permission is in AndroidManifest.xml
- Make sure you're testing on a real device or emulator with Google Play Services
- Check logcat for `[AndroidPermissions]` logs

### "GPS Tidak Aktif" error
- Enable Location/GPS in Android Settings
- The app will prompt to open Location Settings

### Notifications not appearing
- Check notification channel settings in Android Settings > Apps > Sakinah Path > Notifications
- Ensure "Do Not Disturb" is off
- Check if notification permission was granted
- Check logcat for `[Notifications]` logs

### Build errors
```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npx cap sync android
```

## Verifying Notifications (Debugging)

The app logs all notification scheduling. Check logcat for:
- `[AndroidPermissions ...]` - Permission status and requests
- `[Notifications ...]` - Notification scheduling

Example logcat filter:
```bash
adb logcat | grep -E "AndroidPermissions|Notifications"
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

## Important Notes

- **Battery Optimization**: Tell users to disable battery optimization for this app to ensure notifications work reliably
- **Xiaomi/MIUI**: Users may need to enable "Autostart" and disable "Battery Saver" for the app
- **Samsung**: Users may need to add app to "Unmonitored apps" in Device Care

