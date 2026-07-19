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

// Helper function to send contact details to Firestore and Web3Forms email dispatcher
export async function sendContactMessage(name, email, message) {
  let firestoreId = null;
  let firestoreError = null;

  // 1. Log the entry into Cloud Firestore
  try {
    const docRef = await addDoc(collection(db, 'messages'), {
      name: name,
      email: email,
      message: message,
      timestamp: serverTimestamp()
    });
    firestoreId = docRef.id;
  } catch (error) {
    console.error("Firestore database log failed: ", error);
    firestoreError = error.message;
  }

  // 2. Dispatch the email notification using Web3Forms API
  const web3FormsKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
  let emailSent = false;
  let emailError = null;

  if (web3FormsKey && web3FormsKey.trim() !== "") {
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          access_key: web3FormsKey,
          name: name,
          email: email,
          message: message,
          subject: `AS.PORTFOLIO: New message from ${name}`,
          from_name: "AS.PORTFOLIO Mailer"
        })
      });
      const data = await response.json();
      emailSent = data.success;
      if (!data.success) {
        emailError = data.message || "Failed to trigger email forwarding service.";
      }
    } catch (err) {
      console.error("Email forwarding failed: ", err);
      emailError = err.message;
    }
  }

  // Return final status report
  if (firestoreId) {
    return {
      success: true,
      docId: firestoreId,
      emailSent: emailSent,
      emailError: emailError
    };
  } else {
    return {
      success: false,
      error: firestoreError || emailError || "Transmission failed."
    };
  }
}
