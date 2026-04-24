/**
 * build.js – Copia arquivos web para a pasta www antes do cap sync
 * Uso: node build.js
 */
const fs   = require('fs');
const path = require('path');

const ARQUIVOS = ['index.html', 'style.css', 'script.js', 'firebase-config.js'];
const IMAGENS  = ['1.png', 'logo.png', 'icon.png'];
const DEST     = path.join(__dirname, 'www');

if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

let copiados = 0;
[...ARQUIVOS, ...IMAGENS].forEach(f => {
  const src = path.join(__dirname, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DEST, f));
    console.log(`✅ Copiado: ${f}`);
    copiados++;
  }
});

console.log(`\n📦 Build concluído: ${copiados} arquivo(s) em ./www`);
console.log('➡️  Agora rode: npx cap sync');
