/* =========================================================
   Localizar Professor – SENAI
   script.js – Lógica completa do frontend
   Preparado para integração com Firebase Realtime Database
   ========================================================= */

'use strict';

// ── Estado global ──────────────────────────────────────────
const state = {
  perfil: null,          // 'aluno' | 'professor'
  aluno: null,           // { nome, cpf, curso }
  professor: null,       // { nome, registro, area }
  statusProf: 'Fora',    // status atual do professor
  professores: [],       // lista mock (substituir pelo Firebase listener)
  filtroAtual: '',
};

// ── Dados mock de professores ──────────────────────────────
const MOCK_PROFESSORES = [
  {
    id: 'p1', nome: 'Ana Claudia Ribeiro', area: 'Informática e Tecnologia',
    status: 'Em aula', curso: 'Técnico em Informática', sala: 'Lab. Informática 1',
    atualizadoEm: Date.now() - 5 * 60 * 1000,
  },
  {
    id: 'p2', nome: 'Roberto Mendes', area: 'Eletrotécnica e Automação',
    status: 'Fora', curso: 'Técnico em Eletrotécnica', sala: 'Coordenação',
    atualizadoEm: Date.now() - 12 * 60 * 1000,
  },
  {
    id: 'p3', nome: 'Juliana Ferreira', area: 'Mecânica e Mecatrônica',
    status: 'Em aula', curso: 'Técnico em Mecatrônica', sala: 'Lab. Mecatrônica',
    atualizadoEm: Date.now() - 2 * 60 * 1000,
  },
  {
    id: 'p4', nome: 'Carlos Eduardo Lima', area: 'Logística e Administração',
    status: 'Ausente', curso: 'Técnico em Logística', sala: '—',
    atualizadoEm: Date.now() - 60 * 60 * 1000,
  },
  {
    id: 'p5', nome: 'Fernanda Costa', area: 'Edificações e Infraestrutura',
    status: 'Em aula', curso: 'Técnico em Edificações', sala: 'Sala 03',
    atualizadoEm: Date.now() - 8 * 60 * 1000,
  },
];

// ── Navegação entre telas ──────────────────────────────────
function goToScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const screen = document.getElementById(id);
  if (screen) {
    screen.classList.add('active');
    screen.scrollIntoView({ block: 'start', behavior: 'instant' });
    window.scrollTo(0, 0);
  }
  atualizarHeaderActions(id);
}

function atualizarHeaderActions(screenId) {
  const container = document.getElementById('headerActions');
  container.innerHTML = '';

  const showLogout = ['screenAluno', 'screenProfessor'].includes(screenId);
  if (showLogout) {
    const btn = document.createElement('button');
    btn.className = 'btn-header';
    btn.id = 'btnSair';
    btn.innerHTML = 'Sair';
    btn.onclick = sair;
    container.appendChild(btn);
  }
}

function sair() {
  state.perfil = null;
  state.aluno = null;
  state.professor = null;
  state.statusProf = 'Fora';
  goToScreen('screenHome');
}

// ── CPF: máscara e validação ───────────────────────────────
function aplicarMascaraCpf(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2}).*/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/^(\d{3})(\d{0,3}).*/, '$1.$2');
  input.value = v;
}

function validarCpf(cpf) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1{10}$/.test(n)) return false;
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i);
  let r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(n[9])) return false;
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i);
  r = (soma * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(n[10]);
}

// ── Utilitários ────────────────────────────────────────────
function iniciais(nome) {
  const partes = nome.trim().split(' ').filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function tempoRelativo(timestamp) {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  if (diff < 60) return 'Agora mesmo';
  if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return `${Math.floor(diff / 86400)}d atrás`;
}

function setFieldError(fieldId, errId, msg) {
  const input = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (msg) {
    input && input.classList.add('error');
    err && (err.textContent = msg);
  } else {
    input && input.classList.remove('error');
    err && (err.textContent = '');
  }
}

function setLoading(btnId, loading) {
  const btn    = document.getElementById(btnId);
  const text   = btn && btn.querySelector('.btn-text');
  const loader = btn && btn.querySelector('.btn-loader');
  if (!btn) return;
  btn.disabled = loading;
  text  && (text.style.opacity  = loading ? '0' : '1');
  loader && loader.classList.toggle('hidden', !loading);
}

function showToast(msg, dur = 3000) {
  const t = document.getElementById('globalToast');
  const m = document.getElementById('toastMsg');
  m.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), dur);
}

// ── SUBMIT ALUNO ───────────────────────────────────────────
function submitAluno(e) {
  e.preventDefault();
  let ok = true;

  const nome  = document.getElementById('alunoNome').value.trim();
  const cpf   = document.getElementById('alunoCpf').value.trim();
  const curso = document.getElementById('alunoCurso').value;

  setFieldError('alunoNome',  'errAlunoNome',  '');
  setFieldError('alunoCpf',   'errAlunoCpf',   '');
  setFieldError('alunoCurso', 'errAlunoCurso', '');

  if (nome.length < 3) {
    setFieldError('alunoNome', 'errAlunoNome', 'Informe seu nome completo.');
    ok = false;
  }
  if (!validarCpf(cpf)) {
    setFieldError('alunoCpf', 'errAlunoCpf', 'CPF inválido. Verifique o número digitado.');
    ok = false;
  }
  if (!curso) {
    setFieldError('alunoCurso', 'errAlunoCurso', 'Selecione seu curso.');
    ok = false;
  }
  if (!ok) return;

  setLoading('btnSubmitAluno', true);

  // Simular chamada ao banco (substituir por Firebase)
  setTimeout(() => {
    state.aluno = { nome, cpf, curso };
    state.perfil = 'aluno';
    setLoading('btnSubmitAluno', false);
    carregarDashboardAluno();
    goToScreen('screenAluno');
    showToast(`Bem-vindo(a), ${nome.split(' ')[0]}!`);
  }, 900);
}

// ── SUBMIT PROFESSOR ───────────────────────────────────────
function submitProfessor(e) {
  e.preventDefault();
  let ok = true;

  const nome     = document.getElementById('profNome').value.trim();
  const registro = document.getElementById('profRegistro').value.trim();
  const area     = document.getElementById('profArea').value;

  setFieldError('profNome',     'errProfNome',     '');
  setFieldError('profRegistro', 'errProfRegistro', '');
  setFieldError('profArea',     'errProfArea',     '');

  if (nome.length < 3) {
    setFieldError('profNome', 'errProfNome', 'Informe seu nome completo.');
    ok = false;
  }
  if (registro.length < 3) {
    setFieldError('profRegistro', 'errProfRegistro', 'Informe seu registro funcional.');
    ok = false;
  }
  if (!area) {
    setFieldError('profArea', 'errProfArea', 'Selecione sua área de atuação.');
    ok = false;
  }
  if (!ok) return;

  setLoading('btnSubmitProf', true);

  setTimeout(() => {
    state.professor = { nome, registro, area };
    state.perfil    = 'professor';
    state.statusProf = 'Fora';
    setLoading('btnSubmitProf', false);
    carregarDashboardProfessor();
    goToScreen('screenProfessor');
    showToast(`Painel carregado, ${nome.split(' ')[0]}!`);
  }, 900);
}

// ── DASHBOARD ALUNO ────────────────────────────────────────
function carregarDashboardAluno() {
  state.professores = MOCK_PROFESSORES;
  renderizarProfessores(state.professores);
}

function filtrarProfessores() {
  const filtro = document.getElementById('filtroAluno').value;
  state.filtroAtual = filtro;
  const lista = filtro
    ? state.professores.filter(p => p.curso === filtro)
    : state.professores;
  renderizarProfessores(lista);
}

function renderizarProfessores(lista) {
  const grid  = document.getElementById('profGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('liveCount');

  const ativos = lista.filter(p => p.status !== 'Ausente').length;
  count.textContent = `${lista.length} professor${lista.length !== 1 ? 'es' : ''} (${ativos} ativo${ativos !== 1 ? 's' : ''})`;

  if (lista.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  const statusMap = {
    'Em aula': 'verde',
    'Fora':    'amarelo',
    'Ausente': 'vermelho',
  };

  grid.innerHTML = lista.map(p => {
    const cor    = statusMap[p.status] || 'amarelo';
    const avatar = iniciais(p.nome);
    const tempo  = tempoRelativo(p.atualizadoEm);

    return `
      <article class="prof-card" id="card-${p.id}">
        <div class="prof-card-top">
          <div class="avatar">${avatar}</div>
          <div class="prof-card-info">
            <p class="prof-card-name">${p.nome}</p>
            <p class="prof-card-area">${p.area}</p>
          </div>
          <span class="status-badge status-badge--${cor}">${p.status}</span>
        </div>
        <div class="prof-card-curso">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
          ${p.curso}
        </div>
        <div class="prof-card-details">
          <div class="detail-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>${p.sala}</span>
          </div>
          <div class="detail-row">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>Atualizado ${tempo}</span>
          </div>
        </div>
      </article>`;
  }).join('');
}

// ── DASHBOARD PROFESSOR ────────────────────────────────────
function carregarDashboardProfessor() {
  const p = state.professor;
  document.getElementById('profWelcome').textContent = `Olá, ${p.nome.split(' ')[0]}!`;
  document.getElementById('previewNome').textContent  = p.nome;
  document.getElementById('previewArea').textContent  = p.area;
  document.getElementById('previewAvatar').textContent = iniciais(p.nome);
  atualizarPreview();
  selectStatus('Fora');
}

function selectStatus(status) {
  state.statusProf = status;
  const ids = { 'Em aula': 'statusEmAula', 'Fora': 'statusFora', 'Ausente': 'statusAusente' };
  Object.values(ids).forEach(id => document.getElementById(id).classList.remove('active-status'));
  document.getElementById(ids[status]).classList.add('active-status');

  const corMap = { 'Em aula': 'verde', 'Fora': 'amarelo', 'Ausente': 'vermelho' };
  const cor    = corMap[status];

  // Atualizar badge do header
  const badge = document.getElementById('currentStatusBadge');
  badge.innerHTML = `<span class="status-dot status-dot--${cor}"></span><span>${status}</span>`;

  // Atualizar preview
  const pStatus = document.getElementById('previewStatus');
  pStatus.className = `status-badge status-badge--${cor}`;
  pStatus.textContent = status;
}

function atualizarPreview() {
  const curso = document.getElementById('profCursoAtual').value || '—';
  const sala  = document.getElementById('profSalaAtual').value  || '—';
  document.getElementById('previewCurso').textContent      = curso;
  document.getElementById('previewSala').textContent       = sala;
  document.getElementById('previewAtualizado').textContent = 'Agora mesmo';
}

function atualizarStatus() {
  const curso = document.getElementById('profCursoAtual').value;
  const sala  = document.getElementById('profSalaAtual').value;

  // Se em aula, exigir curso e sala
  if (state.statusProf === 'Em aula' && (!curso || !sala)) {
    showToast('Selecione o curso e a sala para o status "Em aula".');
    return;
  }

  setLoading('btnAtualizar', true);
  hideFeedback();

  // Simular envio ao Firebase
  setTimeout(() => {
    setLoading('btnAtualizar', false);
    atualizarPreview();
    showFeedback(true, 'Status atualizado com sucesso!');
    showToast('Localização atualizada!');

    // TODO: firebase.database().ref('professores/' + state.professor.registro).set({ ... })
  }, 800);
}

function showFeedback(sucesso, msg) {
  const box = document.getElementById('feedbackBox');
  const txt = document.getElementById('feedbackMsg');
  box.classList.remove('hidden', 'error');
  if (!sucesso) box.classList.add('error');
  txt.textContent = msg;
  setTimeout(hideFeedback, 4000);
}

function hideFeedback() {
  document.getElementById('feedbackBox').classList.add('hidden');
}

// ── INICIALIZAÇÃO ──────────────────────────────────────────
function init() {
  // Máscara CPF
  const cpfInput = document.getElementById('alunoCpf');
  if (cpfInput) {
    cpfInput.addEventListener('input', () => aplicarMascaraCpf(cpfInput));
  }

  // Listeners para preview em tempo real
  ['profCursoAtual', 'profSalaAtual'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', atualizarPreview);
  });

  // Tela inicial
  goToScreen('screenHome');
}

document.addEventListener('DOMContentLoaded', init);

/* =========================================================
   INTEGRAÇÃO FIREBASE (template comentado)
   =========================================================

// Substitua a inicialização Firebase com suas credenciais:
//
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, set, onValue } from "firebase/database";
//
// const firebaseConfig = { apiKey: "...", ... };
// const app = initializeApp(firebaseConfig);
// const db  = getDatabase(app);
//
// ESCREVER status do professor:
// set(ref(db, 'professores/' + state.professor.registro), {
//   nome: state.professor.nome,
//   area: state.professor.area,
//   status: state.statusProf,
//   curso: document.getElementById('profCursoAtual').value,
//   sala:  document.getElementById('profSalaAtual').value,
//   atualizadoEm: Date.now(),
// });
//
// LER lista em tempo real (substitui o mock):
// onValue(ref(db, 'professores'), (snapshot) => {
//   const data = snapshot.val() || {};
//   state.professores = Object.values(data);
//   renderizarProfessores(state.professores);
// });
========================================================= */
