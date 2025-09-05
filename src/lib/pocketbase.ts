import PocketBase from 'pocketbase'

const pocketbaseUrl = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'

export const pb = new PocketBase(pocketbaseUrl)

// Enable auto cancellation for duplicate requests
pb.autoCancellation(false)

// Configure authentication settings
pb.beforeSend = function (url, options) {
  // Add any custom headers or request modifications here
  return { url, options }
}