import type { CapacitorConfig } from '@capacitor/cli';

// For development hot-reload, uncomment the server.url line
// For production APK, keep it commented out
const config: CapacitorConfig = {
  appId: 'app.lovable.cfb2346140fa4f20ba86856e5aca0aa2',
  appName: 'sakinah-path',
  webDir: 'dist',
  // PRODUCTION: Comment out server block for production builds
  // server: {
  //   url: 'https://cfb23461-40fa-4f20-ba86-856e5aca0aa2.lovableproject.com?forceHideBadge=true',
  //   cleartext: true,
  // },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#10B981',
      sound: 'beep.wav',
    },
    Geolocation: {
      enableBackgroundTracking: true,
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
  },
};

export default config;
