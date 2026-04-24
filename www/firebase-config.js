/* =========================================================
   firebase-config.js
   SENAI – Localizar Professor
   Projeto: aplicativo-e612f
   ========================================================= */

const firebaseConfig = {
  apiKey:            "AIzaSyAl9ogCdXs8-xL4WrmIcBiV_hRsuMMb2vg",
  authDomain:        "aplicativo-e612f.firebaseapp.com",
  databaseURL:       "https://aplicativo-e612f-default-rtdb.firebaseio.com",
  projectId:         "aplicativo-e612f",
  storageBucket:     "aplicativo-e612f.firebasestorage.app",
  messagingSenderId: "232478084247",
  appId:             "1:232478084247:web:b78935623cca2011812dd2",
  measurementId:     "G-6H3WPLYRGB",
};

/* ── Inicialização ── */
let db = null;

try {
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();

  // Monitora status de conexão em tempo real
  db.ref('.info/connected').on('value', (snap) => {
    const conectado = !!snap.val();
    const dot = document.querySelector('.live-dot');
    if (dot) {
      dot.style.background = conectado ? 'var(--green)' : 'var(--yellow)';
    }
    console.log(conectado
      ? '[Firebase] ✅ Conectado ao Realtime Database.'
      : '[Firebase] ⚠️  Sem conexão – tentando reconectar...');
  });

  console.log('[Firebase] 🔥 Projeto aplicativo-e612f inicializado.');

} catch (err) {
  console.error('[Firebase] ❌ Erro na inicialização:', err.message);
  db = null;
}

/* =========================================================
   REGRAS DO BANCO (cole em Realtime Database → Regras):

   {
     "rules": {
       "professores": {
         ".read": true,
         "$registro": {
           ".write": true
         }
       }
     }
   }

   ESTRUTURA DOS DADOS:
   professores/
     RF-00123/
       nome:         "Ana Claudia Ribeiro"
       registro:     "RF-00123"
       area:         "Informática e Tecnologia"
       status:       "Em aula"
       curso:        "Técnico em Informática"
       sala:         "Lab. Informática 1"
       atualizadoEm: 1714000000000
   ========================================================= */
