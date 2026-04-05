// ========================================
// FIREBASE CONFIGURATION - WOWSY BOT
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyAw1MDYToczfB92-aEHS_5oOqsRGtZkAZQ",
    authDomain: "dc-bot-web.firebaseapp.com",
    databaseURL: "https://dc-bot-web-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dc-bot-web",
    storageBucket: "dc-bot-web.firebasestorage.app",
    messagingSenderId: "944385222815",
    appId: "1:944385222815:web:8a6a1e4b4725f9a4299aaa"
};

// Firebase'i başlat
firebase.initializeApp(firebaseConfig);

// Firebase servisleri (GLOBAL olarak tanımla)
const db = firebase.database();
const auth = firebase.auth();

// Database referansları
const homepageRef = db.ref('homepage');
const commandsRef = db.ref('commands');
const featuresRef = db.ref('features');
const statsRef = db.ref('botStats');
const serversRef = db.ref('servers');
const messagesRef = db.ref('pendingMessages');
const sectionsRef = db.ref('sectionOrder');

console.log('🔥 Firebase bağlantısı kuruldu!');
console.log('✅ Auth:', auth ? 'Hazır' : 'YOK');
console.log('✅ Database:', db ? 'Hazır' : 'YOK');
