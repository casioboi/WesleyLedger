import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

/**
 * Creates a physical backup file on the device's Documents folder.
 * This ensures data is safely written outside the app's internal sandbox.
 */
export async function createLocalDeviceBackup(state: any, isManualExport = false) {
  if (!Capacitor.isNativePlatform()) return

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    // For auto-backups, we overwrite "latest_backup.json". For manual exports, we create a timestamped file.
    const fileName = isManualExport ? `backup_${timestamp}.json` : 'latest_backup.json'
    const path = `WesleyLedger/Backups/${fileName}`

    // We serialize the entire state (transactions, profile, settings)
    const backupData = JSON.stringify(state, null, 2)

    const result = await Filesystem.writeFile({
      path,
      data: backupData,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true
    })

    if (isManualExport) {
      await Share.share({
        title: 'WesleyLedger Backup',
        text: 'Here is your manual data backup file.',
        url: result.uri,
        dialogTitle: 'Save or Share Backup'
      })
    }
  } catch (error) {
    console.error('Failed to create local device backup:', error)
    if (isManualExport) {
      alert('Failed to save backup to device. Check permissions.')
    }
  }
}
