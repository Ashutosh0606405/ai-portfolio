import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyByf7Mvk5Gqrfha_h_x1MHZFubFilY2Zdw",
  authDomain: "ai-portfolio-63ec7.firebaseapp.com",
  projectId: "ai-portfolio-63ec7",
  storageBucket: "ai-portfolio-63ec7.firebasestorage.app",
  messagingSenderId: "379548928084",
  appId: "1:379548928084:web:6d60df87a0b6c3537e05c1",
  measurementId: "G-CH533EXBDB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper function to send contact details to Firestore collection 'messages'
export async function sendContactMessage(name, email, message) {
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      name: name,
      email: email,
      message: message,
      timestamp: serverTimestamp()
    });
    return { success: true, docId: docRef.id };
  } catch (error) {
    console.error("Firebase submit error: ", error);
    return { success: false, error: error.message };
  }
}
