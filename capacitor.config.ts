import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.geoswipe.app",
  appName: "GeoSwipe",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    }
  }
};

export default config;
