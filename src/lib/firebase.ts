import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAAXjyijQf8IzxUGc-wl4VqJkf_7UVUZEs',
  authDomain: 'casa-de-cambio-projeto.firebaseapp.com',
  projectId: 'casa-de-cambio-projeto',
  storageBucket: 'casa-de-cambio-projeto.firebasestorage.app',
  messagingSenderId: '551818524930',
  appId: '1:551818524930:web:9c8117ef2c5c9f575e6a1b',
  measurementId: 'G-MMQCD3B624',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
