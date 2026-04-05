// ========================================
// FIREBASE CONFIGURATION - WOWSY BOT
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyAw1MDYToczfB92-aEHS_5oOqsRGtZkAZQ",
    authDomain: "dc-bot-web.firebaseapp.com",
    projectId: "dc-bot-web",
    storageBucket: "dc-bot-web.firebasestorage.app",
    messagingSenderId: "944385222815",
    appId: "1:944385222815:web:8a6a1e4b4725f9a4299aaa"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firebase servisleri
const db = firebase.firestore();  // ← FIRESTORE KULLAN
const auth = firebase.auth();

console.log('🔥 Firebase Firestore bağlantısı kuruldu!');
console.log('✅ Auth:', auth ? 'Hazır' : 'YOK');
console.log('✅ Firestore:', db ? 'Hazır' : 'YOK');
