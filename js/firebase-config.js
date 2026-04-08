// ========================================
// FIREBASE CONFIGURATION - WOWSY BOT
// TEK FIREBASE PROJESİ (discord-bot-7f29e)
// ========================================

const firebaseConfig = {
  apiKey: "AIzaSyBrS-d8S5mrKfKatJWaCmfR9TDOL22Pq-U",
  authDomain: "discord-bot-7f29e.firebaseapp.com",
  projectId: "discord-bot-7f29e",
  storageBucket: "discord-bot-7f29e.firebasestorage.app",
  messagingSenderId: "802528512152",
  appId: "1:802528512152:web:040d61ba0c526c522528ed"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firestore (Realtime DB değil!)
const db = firebase.firestore();
const auth = firebase.auth();

// Collection referansları
const homepageRef = db.collection('homepage').doc('settings');
const commandsRef = db.collection('commands');
const statsRef = db.collection('bot_stats').doc('general');

console.log('🔥 Firebase (Firestore) bağlantısı kuruldu!');
console.log('✅ Project:', firebaseConfig.projectId);
console.log('✅ Auth:', auth ? 'Hazır' : 'YOK');
console.log('✅ Firestore:', db ? 'Hazır' : 'YOK');
