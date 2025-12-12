import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  // ...
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestPermission = async () => {
  const token = await getToken(messaging, { vapidKey: import.meta.env.VITE_FIREBASE_VAPID });
  if (token) {
    await axios.post(`${API_BASE_URL}/api/user/fcm-token`, { token });
  }
};