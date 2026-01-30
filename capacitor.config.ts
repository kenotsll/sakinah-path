import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.cfb2346140fa4f20ba86856e5aca0aa2',
  appName: 'sakinah-path',
  webDir: 'dist',
  server: {
    url: 'https://cfb23461-40fa-4f20-ba86-856e5aca0aa2.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      // Android notification channel configuration
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#10B981',
      sound: 'beep.wav',
    },
    Geolocation: {
      // Enable background location updates
      enableBackgroundTracking: true,
    },
  },
  android: {
    // Allow mixed content for development
    allowMixedContent: true,
    // Capture input for better UX
    captureInput: true,
  },
};

export default config;
