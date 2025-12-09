import Constants from 'expo-constants';

type ExtraConfig = {
  apiUrl?: string;
  apiPort?: string | number;
};

const DEFAULT_PORT = 5001;

const getDebuggerHost = (): string | null => {
  const expoConstants: typeof Constants & {
    manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } };
  } = Constants as any;

  const hostUri =
    expoConstants?.expoConfig?.hostUri ||
    expoConstants?.manifest2?.extra?.expoGo?.debuggerHost ||
    (expoConstants as any)?.manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  const [host] = hostUri.split(':');
  return host || null;
};

const getExtraConfig = (): ExtraConfig => {
  const extra = Constants.expoConfig?.extra;
  return (extra ?? {}) as ExtraConfig;
};

const resolveApiUrl = (): string => {
  const extra = getExtraConfig();
  const explicitUrl =
    extra.apiUrl ||
    // @ts-ignore Expo injects EXPO_PUBLIC_* at build time
    process.env?.EXPO_PUBLIC_API_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  const detectedHost = getDebuggerHost();

  if (detectedHost) {
    const port = extra.apiPort ?? DEFAULT_PORT;
    return `http://${detectedHost}:${port}/api`;
  }

  return `http://localhost:${DEFAULT_PORT}/api`;
};

// API Configuration
export const API_URL = resolveApiUrl();

// Other app-wide configuration
export const APP_CONFIG = {
  // Add any other app-wide configuration here
  MAX_RIDE_SEATS: 8,
  MIN_RIDE_SEATS: 1,
  MAX_PRICE: 1000,
  MIN_PRICE: 0,
};
