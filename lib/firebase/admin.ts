import { initializeApp, getApps, cert, App } from "firebase-admin/app"
import { getMessaging, Messaging } from "firebase-admin/messaging"

let adminApp: App | undefined
let adminMessaging: Messaging | undefined

function getAdminApp(): App {
  if (!adminApp) {
    const apps = getApps()
    if (apps.length === 0) {
      const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "{}"
      )
      adminApp = initializeApp({
        credential: cert(serviceAccount),
      })
    } else {
      adminApp = apps[0]
    }
  }
  return adminApp
}

export function getAdminMessaging(): Messaging {
  if (!adminMessaging) {
    const app = getAdminApp()
    adminMessaging = getMessaging(app)
  }
  return adminMessaging
}
