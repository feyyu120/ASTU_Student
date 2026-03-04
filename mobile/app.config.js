
export default {
  expo: {
    name: "Item",
    slug: "Item",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "Item",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true
    },
    splash: {
      image: "./assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      // This is the key part — use process.env with fallback for local dev
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.feyyu.mobile"
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff"
        }
      ],
      "expo-secure-store",
      // Add expo-notifications plugin here if not already
      ["expo-notifications", {
        // your notification config if needed
      }]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },

    // ────────────────────────────────────────────────
    // ADD THIS BLOCK → required for EAS to link the project
    extra: {
      eas: {
        projectId: "3409f417-1a4d-448e-96c8-9635941c0126"
      }
    }
    // You can add more fields under extra if needed, e.g.:
    // someApiKey: process.env.SOME_API_KEY || 'fallback-value'
    // ────────────────────────────────────────────────
  }
};