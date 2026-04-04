import { initializeApp, getApps, FirebaseApp } from "firebase/app"
import { getMessaging, Messaging, isSupported } from "firebase/messaging"

const firebaseConfig = {
  apiKey: "AIzaSyCzqRisoaBjOwPgefLTdVszx7I5J1iQX9o",
  authDomain: "dashboard-impulsionai-mkt.firebaseapp.com",
  projectId: "dashboard-impulsionai-mkt",
  storageBucket: "dashboard-impulsionai-mkt.firebasestorage.app",
  messagingSenderId: "273537569477",
  appId: "1:273537569477:web:952881348ae20dfda3d6ac",
}

let app: FirebaseApp | undefined
let messaging: Messaging | undefined

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  }
  return app
}

export async function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null
  
  const supported = await isSupported()
  if (!supported) return null
  
  if (!messaging) {
    const app = getFirebaseApp()
    messaging = getMessaging(app)
  }
  
  return messaging
}
