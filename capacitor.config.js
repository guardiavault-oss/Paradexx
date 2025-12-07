/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
    appId: 'com.regenx.wallet',
    appName: 'RegenX',
    webDir: 'dist',
    server: {
        androidScheme: 'https',
        iosScheme: 'https',
        // For development, uncomment and set your local IP:
        // url: 'http://192.168.1.x:3000',
        // cleartext: true,
    },
    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#0A0F1E',
            androidSplashResourceName: 'splash',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false,
            androidSpinnerStyle: 'large',
            iosSpinnerStyle: 'small',
            spinnerColor: '#00ADEF',
            splashFullScreen: true,
            splashImmersive: true,
        },
        StatusBar: {
            style: 'DARK',
            backgroundColor: '#0A0F1E',
        },
        Keyboard: {
            resize: 'native',
            style: 'DARK',
            resizeOnFullScreen: true,
        },
        // Biometric authentication
        BiometricAuth: {
            // iOS configuration
            iosBiometryType: 'all', // 'touchId', 'faceId', or 'all'
            // Android configuration
            androidBiometryStrength: 'strong', // 'weak' or 'strong'
            androidBiometryTitle: 'Verify Your Identity',
            androidBiometrySubtitle: 'Use biometrics to authenticate',
            androidBiometryCancelLabel: 'Cancel',
            androidBiometryDescription: 'Authenticate to access your wallet',
        },
        // Secure storage for sensitive data
        SecureStorage: {
            // All data encrypted on device
        },
        // Push notifications
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        // Haptic feedback
        Haptics: {
            // No config needed
        },
        // App badge
        Badge: {
            // For unread notifications
        },
        // Local notifications
        LocalNotifications: {
            smallIcon: 'ic_stat_icon_config_sample',
            iconColor: '#00ADEF',
            sound: 'beep.wav',
        },
        // Screenshot protection
        ScreenOrientation: {
            orientation: 'portrait',
        },
    },
    android: {
        buildOptions: {
            keystorePath: 'release-keystore.jks',
            keystorePassword: process.env.ANDROID_KEYSTORE_PASSWORD,
            keystoreAlias: 'regenx',
            keystoreAliasPassword: process.env.ANDROID_KEY_PASSWORD,
            releaseType: 'APK', // or 'AAB' for bundle
        },
    },
    ios: {
        contentInset: 'always',
        limitsNavigationsToAppBoundDomains: true,
    },
};

module.exports = config;
