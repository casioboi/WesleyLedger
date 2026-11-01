import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.wesleyledger.app',
  appName: 'WesleyLedger',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
  },
}

export default config
