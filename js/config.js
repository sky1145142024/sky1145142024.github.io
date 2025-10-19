const config = {
  firebase: {
 apiKey: "AIzaSyA7hNGBhJAe34tybE0iCphlps_4AP78Gpg",
  authDomain: "pideweb-50b61.firebaseapp.com",
  projectId: "pideweb-50b61",
  storageBucket: "pideweb-50b61.firebasestorage.app",
  messagingSenderId: "600392139713",
  appId: "1:600392139713:web:2627688a5fbba20fc5a540",
  measurementId: "G-ZS7HXH1F72"
  },
  github: {
    clientId: "Ov23liUHw8DobU7utxCH", // 从 GitHub OAuth 应用获取
    redirectUri: "https://sky1145142024.github.io/login.html" // 回调URL
  }
};

// 初始化 Firebase
firebase.initializeApp(config.firebase);
const db = firebase.firestore();
const auth = firebase.auth();


