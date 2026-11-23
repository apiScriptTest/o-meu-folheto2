// ============================================
//   A MINHA LISTA — app-v2.js v0.0.17
// ============================================

const modal = document.getElementById('confirmModal');
let idParaApagar = null;
let lojaAlvo     = null;
let acaoPendente = null;

// ============================================
// 1. PRODUTOS
// ============================================
const PRODUTOS = [
    { texto: "Leite",             icone: "🥛" },
    { texto: "Pão",               icone: "🍞" },
    { texto: "Ovos",              icone: "🥚" },
    { texto: "Café",              icone: "☕" },
    { texto: "Arroz",             icone: "🍚" },
    { texto: "Massa",             icone: "🍝" },
    { texto: "Azeite",            icone: "🫒" },
    { texto: "Açúcar",            icone: "🍬" },
    { texto: "Cenouras",          icone: "🥕" },
    { texto: "Batatas",           icone: "🥔" },
    { texto: "Cebolas",           icone: "🧅" },
    { texto: "Tomate",            icone: "🍅" },
    { texto: "Alho francês",      icone: "🧄" },
    { texto: "Bananas",           icone: "🍌" },
    { texto: "Kiwi",              icone: "🥝" },
    { texto: "Fruta",             icone: "🍎" },
    { texto: "Carne",             icone: "🥩" },
    { texto: "Peixe",             icone: "🐟" },
    { texto: "Iogurtes",          icone: "🍦" },
    { texto: "Queijo",            icone: "🧀" },
    { texto: "Feijão frade",      icone: "🫘" },
    { texto: "Cerveja",           icone: "🍺" },
    { texto: "Vinho",             icone: "🍷" },
    { texto: "Água",              icone: "💧" },
    { texto: "Ucal",              icone: "🍫" },
    { texto: "Nesquik",           icone: "🥣" },
    { texto: "Pastilhas Fairy",   icone: "🧼" },
    { texto: "Detergente",        icone: "🧼" },
    { texto: "Detergente roupa",  icone: "🧼" },
    { texto: "Lixívia",           icone: "🧴" },
    { texto: "Papel Higiénico",   icone: "🧻" },
    { texto: "Calças",            icone: "👖" },
    { texto: "Manga",              icone: "🥭" },
    { texto: "Feijão encarnado",   icone: "🫘" },
    { texto: "Líquido verde",      icone: "🟢" },
    { texto: "Farinha",            icone: "🌾" },
    { texto: "Guardanapos",        icone: "🗞️" },
    { texto: "Sal grosso",         icone: "🧂" },
    { texto: "Cebola picada",      icone: "🧅" },
];

// ============================================
// 2. LOJAS
// ============================================
const lojasConfig = [
    { nome: 'LIDL',        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Lidl-Logo.svg' },
    { nome: 'ALDI',        logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/ALDI_Nord_Logo_2015.png/120px-ALDI_Nord_Logo_2015.png' },
    { nome: 'Mercadona',   logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Mercadona_%28color-300-alpha%29.png/250px-Logo_Mercadona_%28color-300-alpha%29.png' },
    { nome: 'Continente',  logo: 'https://images.seeklogo.com/logo-png/19/2/continente-hipermercados-logo-png_seeklogo-198420.png' },
    { nome: 'Pingo Doce',  logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/3/37/PingoDoce.jpg/250px-PingoDoce.jpg' },
    { nome: 'Intermarche', nomeDisplay: 'Intermarché', logo: 'https://intermarche.pt/images/logo-app.png' }
];

// ============================================
// UTILITÁRIOS
// ============================================

function normalizarTexto(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function obterIcone(texto) {
    const palavra = normalizarTexto(texto);
    const match   = PRODUTOS.find(p => palavra.includes(normalizarTexto(p.texto)));
    return match ? match.icone : "🛒";
}

function sanitizar(str) {
    return String(str).replace(/[<>"'`]/g, '');
}

function gerarId() {
    return Date.now() + '-' + Math.floor(Math.random() * 1000000);
}

function vibrar(ms = 30) {
    if ('vibrate' in navigator) navigator.vibrate(ms);
}

function mostrarToast(mensagem) {
    const sheet = document.getElementById('addModal');
    if (sheet && sheet.style.display === 'flex') return;   // dentro da sheet o feedback é o do cabeçalho
    const container = document.getElementById('toast-container');
    const toast     = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<svg class="icon"><use href="#i-check"/></svg> ${mensagem}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// ARMAZENAMENTO — IndexedDB (com fallback localStorage)
// ============================================
// Usamos um cache em memória para que obterItens/guardarItens
// continuem síncronos; o IndexedDB persiste em background.
// O IndexedDB NÃO é apagado quando se limpa o "histórico" do Chrome,
// ao contrário do localStorage.

const DB_NAME    = 'ListaComprasDB';
const DB_VERSION = 1;
const STORE_NAME = 'listas';
let   db         = null;
const _cache     = {}; // { [loja]: itens[] }

function abrirDB() {
    return new Promise((resolve, reject) => {
        if (db) return resolve(db);
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = e => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        req.onsuccess = e => { db = e.target.result; resolve(db); };
        req.onerror   = e => reject(e.target.error);
    });
}

function idbGet(loja) {
    return abrirDB().then(d => new Promise((resolve, reject) => {
        const tx  = d.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(loja);
        req.onsuccess = e => resolve(e.target.result || []);
        req.onerror   = e => reject(e.target.error);
    }));
}

function idbSet(loja, itens) {
    return abrirDB().then(d => new Promise((resolve, reject) => {
        const tx  = d.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(itens, loja);
        req.onsuccess = () => resolve();
        req.onerror   = e => reject(e.target.error);
    }));
}

// Carrega todas as lojas do IndexedDB para o cache em memória
// (e migra dados antigos do localStorage, se existirem)
async function iniciarArmazenamento() {
    const lojas = window.LOJAS_NOMES || [];
    for (const loja of lojas) {
        let itens = await idbGet(loja);
        // Migração: se IndexedDB está vazio mas localStorage tem dados
        if (itens.length === 0) {
            try {
                const ls = JSON.parse(localStorage.getItem(`compras_${loja}`));
                if (ls && ls.length > 0) {
                    itens = ls;
                    await idbSet(loja, itens);
                    localStorage.removeItem(`compras_${loja}`); // limpa LS após migrar
                }
            } catch {}
        }
        _cache[loja] = itens;
    }
}

function obterItens(loja) {
    return _cache[loja] || [];
}

function guardarItens(loja, itens) {
    _cache[loja] = itens;
    idbSet(loja, itens).catch(err => {
        // Fallback para localStorage se IndexedDB falhar
        try { localStorage.setItem(`compras_${loja}`, JSON.stringify(itens)); }
        catch {}
        console.warn('IndexedDB write failed, used localStorage fallback', err);
    });
}

function contarPendentes(loja) {
    return obterItens(loja).filter(i => !i.comprado).length;
}

// ============================================
// ESTADO DA UI
// ============================================
let filtro = 'all';   // 'all' ou nome da loja
let busca  = '';
let verTudo = false;   // true = mostra todas as lojas, mesmo as vazias

const $   = s => document.querySelector(s);
const ICO = id => `<svg class="icon" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const nomeDe = l => l.nomeDisplay || l.nome;

function logoHTML(l, mini = false) {
    const ini = nomeDe(l).slice(0, 2).toUpperCase();
    return `<span class="logo${mini ? ' mini' : ''}" data-marca="${l.nome}"><img src="${l.logo}" alt="" loading="lazy" data-ini="${ini}" onerror="this.outerHTML='<b>'+this.dataset.ini+'</b>'"></span>`;
}

// ============================================
// RENDER
// ============================================
function renderizar() {
    const btnVer = $('#btn-ver-tudo');
    if (btnVer) btnVer.setAttribute('aria-pressed', String(verTudo));
    renderizarLojas();
    renderizarSecoes();
    renderizarResumo();
}

function mostrarGrade() {
    filtro = 'all'; busca = ''; verTudo = false;
    $('#busca').value = '';
    renderizar();
}

// "Ver tudo": repõe filtros e pesquisa e mostra TODAS as lojas (também as vazias); novo toque volta ao normal
function alternarVerTudo() {
    vibrar(15);
    verTudo = !verTudo;
    filtro = 'all'; busca = '';
    $('#busca').value = '';
    renderizar();
    mostrarToast(verTudo ? 'A mostrar todas as lojas' : 'Só lojas com itens');
}

function renderizarResumo() {
    if (!$('#n-total')) return; // cartão de resumo removido do HTML
    let total = 0, feitos = 0;
    lojasConfig.forEach(l => {
        const it = obterItens(l.nome);
        total  += it.length;
        feitos += it.filter(i => i.comprado).length;
    });
    $('#n-total').textContent = total;
    $('#n-todo').textContent  = total - feitos;
    $('#n-cart').textContent  = feitos;
}

function renderizarLojas() {
    const nav = $('#lojas');
    const scrollAntes = nav.scrollLeft;
    const total = lojasConfig.reduce((n, l) => n + obterItens(l.nome).length, 0);
    const todas = `
        <button class="loja" data-loja="all" aria-pressed="${filtro === 'all'}">
            <span class="loja-anel"><span class="logo">${ICO('grid')}</span><span class="badge" data-zero="${total === 0}">${total}</span></span>
            <span class="loja-nome">Todas</span>
        </button>`;

    $('#lojas').innerHTML = todas + lojasConfig.map(l => {
        const n = obterItens(l.nome).length;
        return `
        <button class="loja" data-loja="${l.nome}" aria-pressed="${filtro === l.nome}" aria-label="${nomeDe(l)}, ${n} itens">
            <span class="loja-anel">${logoHTML(l)}<span class="badge" data-zero="${n === 0}">${n}</span></span>
            <span class="loja-nome">${nomeDe(l)}</span>
        </button>`;
    }).join('');

    // innerHTML repõe o scroll a 0: restaura e traz a loja ativa para o meio
    nav.scrollLeft = scrollAntes;
    const ativa = nav.querySelector('[aria-pressed="true"]');
    if (ativa && filtro !== 'all') {
        const alvo = ativa.offsetLeft - (nav.clientWidth - ativa.offsetWidth) / 2;
        nav.scrollTo({ left: Math.max(0, alvo), behavior: 'smooth' });
    } else if (filtro === 'all') {
        nav.scrollTo({ left: 0, behavior: 'smooth' });
    }
}

function renderizarSecoes() {
    const q = normalizarTexto(busca.trim());
    const grupos = lojasConfig
        .filter(l => filtro === 'all' || l.nome === filtro)
        .map(l => {
            const lojaCasa = q && normalizarTexto(nomeDe(l)).includes(q);
            const lista = obterItens(l.nome)
                .filter(i => !q || lojaCasa || normalizarTexto(i.texto).includes(q))
                .slice()
                .sort((a, b) => Number(a.comprado) - Number(b.comprado));
            return { l, lista };
        })
        .filter(g => g.lista.length || (!q && (verTudo || filtro !== 'all')));

    const el = $('#secoes');
    if (!grupos.length) {
        const temItens = lojasConfig.some(l => obterItens(l.nome).length);
        el.innerHTML = `<div class="vazio"><strong>${temItens ? 'Nada encontrado' : 'Lista vazia'}</strong>${
            temItens ? 'Nenhum item corresponde ao filtro.' : 'Toca no botão verde para adicionar o primeiro item.'}</div>`;
        return;
    }

    el.innerHTML = grupos.map(({ l, lista }) => {
        const restam = lista.filter(i => !i.comprado).length;
        const etiqueta = !lista.length ? 'Vazia' : restam === 0 ? 'Tudo no carrinho' : restam + (restam === 1 ? ' restante' : ' restantes');
        const corpo = lista.length
            ? lista.map(i => linhaHTML(i, l.nome)).join('')
            : `<div class="loja-vazia"><span>Sem itens nesta loja.</span><button class="add-loja" data-acao="add-loja" data-loja="${l.nome}">${ICO('plus')}Adicionar</button></div>`;
        return `
        <section aria-label="${nomeDe(l)}">
            <div class="sec-head">
                <h2>${logoHTML(l, true)}${nomeDe(l)}</h2>
                <small data-zero="${restam === 0}">${etiqueta}</small>
            </div>
            <div class="card">${corpo}</div>
        </section>`;
    }).join('');
}

function linhaHTML(item, loja) {
    const qtd = item.qtd || 1;
    return `
    <div class="linha${item.comprado ? ' feito' : ''}" data-id="${item.id}" data-loja="${loja}">
        <button class="check" role="checkbox" aria-checked="${!!item.comprado}" data-acao="toggle" aria-label="Marcar ${item.texto}">${ICO('check')}</button>
        <button class="item-corpo" data-acao="toggle">
            <span class="item-nome">${obterIcone(item.texto)} ${item.texto}</span>
        </button>
        <button class="apagar" data-acao="del" aria-label="Apagar ${item.texto}">${ICO('trash')}</button>
        <span class="item-meta" data-acao="toggle">${item.comprado ? 'No carrinho' : 'Por comprar'}</span>
        <div class="stepper">
            <button class="step" data-acao="dec" aria-label="Diminuir quantidade"${qtd <= 1 ? ' disabled' : ''}>${ICO('minus')}</button>
            <b aria-live="polite">${qtd}</b>
            <button class="step mais" data-acao="inc" aria-label="Aumentar quantidade">${ICO('plus')}</button>
        </div>
    </div>`;
}

// ============================================
// INTERAÇÕES
// ============================================
$('#secoes').addEventListener('click', e => {
    const btn = e.target.closest('[data-acao]');
    if (!btn) return;
    if (btn.dataset.acao === 'add-loja') { abrirSheet(btn.dataset.loja); return; }
    const linha = btn.closest('.linha');
    const { id, loja } = linha.dataset;
    const itens = obterItens(loja);
    const item  = itens.find(i => String(i.id) === id);
    if (!item) return;

    const acao = btn.dataset.acao;
    if (acao === 'toggle') { vibrar(30); item.comprado = !item.comprado; }
    if (acao === 'inc')    { vibrar(15); item.qtd = Math.min(99, (item.qtd || 1) + 1); }
    if (acao === 'dec') {
        if ((item.qtd || 1) <= 1) return;
        vibrar(15); item.qtd--;
    }
    if (acao === 'del') { abrirModalApagar(id, loja); return; }
    guardarItens(loja, itens);
    renderizar();
});

$('#lojas').addEventListener('click', e => {
    const btn = e.target.closest('[data-loja]');
    if (!btn) return;
    vibrar(15);
    filtro = btn.dataset.loja;
    renderizar();
});

$('#busca').addEventListener('input', e => { busca = e.target.value; renderizarSecoes(); });

// ============================================
// SHEET — LOJAS (escolher a loja a ver)
// ============================================
const lojasModal = $('#lojasModal');

function abrirLojas() {
    if (modalBloqueado) return;
    vibrar(15);
    const resumo = nome => {
        const itens = nome === 'all' ? lojasConfig.flatMap(l => obterItens(l.nome)) : obterItens(nome);
        const pend = itens.filter(i => !i.comprado).length;
        return !itens.length ? 'Vazia' : pend === 0 ? 'Tudo no carrinho' : `${pend} por comprar`;
    };
    const linha = (nome, rotulo, logo) => `
        <button type="button" class="loja-op" data-loja="${nome}" aria-current="${filtro === nome}">
            ${logo}
            <span class="loja-op-nome">${rotulo}</span>
            <small>${resumo(nome)}</small>
            ${filtro === nome ? ICO('check') : ''}
        </button>`;
    $('#lojas-lista').innerHTML =
        linha('all', 'Todas as lojas', `<span class="logo mini">${ICO('grid')}</span>`) +
        lojasConfig.map(l => linha(l.nome, nomeDe(l), logoHTML(l, true))).join('');
    lojasModal.style.display = 'flex';
    setTimeout(() => { const a = lojasModal.querySelector('[aria-current="true"]'); if (a) a.focus(); }, 60);
}

function fecharLojas() {
    lojasModal.style.display = 'none';
}

$('#lojas-lista').addEventListener('click', e => {
    const btn = e.target.closest('.loja-op');
    if (!btn) return;
    vibrar(15);
    filtro = btn.dataset.loja;
    busca = ''; $('#busca').value = '';
    fecharLojas();
    renderizar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ============================================
// SHEET — NOVO ITEM + SUGESTÕES
// ============================================
const addModal   = $('#addModal');
const inputProd = $('#lista-input');
const boxSug    = $('#sugestoes');
const statusEl  = $('#sheet-status');
const btnAdd    = $('#btn-add');
let statusTimer = null;

// "Adicionar" só ativo quando há texto escrito
function atualizarBotaoAdicionar() {
    btnAdd.disabled = inputProd.value.trim() === '';
}

// Feedback compacto no cabeçalho da sheet (substitui o anterior de imediato)
function mostrarEstado(msg) {
    clearTimeout(statusTimer);
    statusEl.classList.remove('on');
    void statusEl.offsetWidth;            // reinicia a transição se vier outro item logo a seguir
    statusEl.textContent = msg;
    statusEl.classList.add('on');
    statusTimer = setTimeout(limparEstado, 1400);
}
function limparEstado() {
    clearTimeout(statusTimer);
    statusEl.classList.remove('on');
}

function abrirSheet(loja) {
    if (modalBloqueado) return;
    const sel = $('#sheet-loja');
    if (!sel.options.length) {
        sel.innerHTML = lojasConfig.map(l => `<option value="${l.nome}">${nomeDe(l)}</option>`).join('');
    }
    if (typeof loja === 'string') sel.value = loja;
    else if (filtro !== 'all') sel.value = filtro;
    inputProd.value = '';
    mostrarSugestoes();
    atualizarBotaoAdicionar();
    limparEstado();
    addModal.style.display = 'flex';
    ajustarTeclado();
    setTimeout(() => inputProd.focus(), 60);
}

function fecharSheet() {
    addModal.style.display = 'none';
    inputProd.value = '';
    mostrarSugestoes();
    atualizarBotaoAdicionar();
    limparEstado();
    inputProd.blur();
}

function mostrarSugestoes() {
    const q = normalizarTexto(inputProd.value.trim());
    if (!q) {
        boxSug.innerHTML = '';
        boxSug.dataset.hint = 'Escreve para ver sugestões';
        return;
    }
    boxSug.innerHTML = PRODUTOS
        .filter(p => normalizarTexto(p.texto).startsWith(q))
        .slice(0, 6)
        .map(p => `<button type="button" class="chip" data-texto="${p.texto}">${p.icone} ${p.texto}</button>`)
        .join('');
    boxSug.dataset.hint = 'Sem sugestões: Enter para adicionar';
    boxSug.scrollLeft = 0;
}

inputProd.addEventListener('input', () => { mostrarSugestoes(); atualizarBotaoAdicionar(); });

// Os chips não roubam o foco ao input → o teclado fica aberto para o item seguinte
boxSug.addEventListener('pointerdown', e => { if (e.target.closest('.chip')) e.preventDefault(); });
boxSug.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) adicionarItem(chip.dataset.texto);        // 1 toque = adiciona já
});

// Enter / botão "Adicionar": só o texto escrito à mão (vazio = não faz nada)
$('#form-add').addEventListener('submit', e => {
    e.preventDefault();
    adicionarItem();
});

function adicionarItem(textoChip = null) {
    const bruto = typeof textoChip === 'string' ? textoChip : inputProd.value;
    const texto = sanitizar(bruto).replace(/\s+/g, ' ').trim();
    const loja  = $('#sheet-loja').value;
    if (!texto || !loja) { inputProd.focus(); return; }

    vibrar(25);
    const itens = obterItens(loja);
    const chave = normalizarTexto(texto);
    // Duplicado pendente na mesma loja → qtd + 1 em vez de nova linha
    const existente = itens.find(i => !i.comprado && normalizarTexto(i.texto) === chave);

    if (existente) {
        existente.qtd = Math.min(99, (existente.qtd || 1) + 1);
        mostrarEstado(`${existente.texto} +1`);
    } else {
        itens.push({ id: gerarId(), texto, comprado: false, qtd: 1 });
        mostrarEstado('Adicionado ✓');
    }
    guardarItens(loja, itens);

    inputProd.value = '';
    mostrarSugestoes();
    atualizarBotaoAdicionar();
    inputProd.focus();
    renderizar();
}

// Esc fecha a sheet
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (addModal.style.display === 'flex') fecharSheet();
    else if (lojasModal.style.display === 'flex') fecharLojas();
});

// Teclado móvel: sobe a sheet pelo tamanho do teclado (CSS: #addModal { padding-bottom: var(--kb) })
function ajustarTeclado() {
    const vv = window.visualViewport;
    if (!vv) return;
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    addModal.style.setProperty('--kb', kb + 'px');
}
if (window.visualViewport) {
    visualViewport.addEventListener('resize', ajustarTeclado);
    visualViewport.addEventListener('scroll', ajustarTeclado);
}

// ============================================
// PARTILHA
// ============================================
function partilharAtual() {
    if (filtro === 'all') partilharTudo(); else partilharLojaAtiva();
}

function partilharTudo() {
    const blocos = [];
    let resumo = '';

    lojasConfig.forEach(loja => {
        const pendentes = obterItens(loja.nome).filter(i => !i.comprado);
        if (pendentes.length > 0) {
            blocos.push(`${loja.nome}:${pendentes.map(i => i.texto).join(',')}`);
            resumo += `• *${nomeDe(loja)}* (${pendentes.length})\n`;
        }
    });

    if (blocos.length === 0) { mostrarToast('Nada para partilhar!'); return; }

    const base = window.location.href.split('?')[0];
    const link = `${base}?master=${encodeURIComponent(blocos.join('|'))}`;
    if (link.length > 1800) { mostrarToast('Lista muito longa! Partilha por loja.'); return; }

    window.open(`https://wa.me/?text=${encodeURIComponent(`*📋 AS MINHAS LISTAS*\n\n${resumo}\n🔗 *Importar:* ${link}`)}`, '_blank');
    mostrarToast('WhatsApp aberto!');
}

function partilharLojaAtiva() {
    if (filtro === 'all') { partilharTudo(); return; }
    const pendentes = obterItens(filtro).filter(i => !i.comprado);
    if (pendentes.length === 0) { mostrarToast('Lista vazia!'); return; }

    const base = window.location.href.split('?')[0];
    const link = `${base}?master=${encodeURIComponent(`${filtro}:${pendentes.map(i => i.texto).join(',')}`)}`;
    const loja = lojasConfig.find(l => l.nome === filtro);

    window.open(`https://wa.me/?text=${encodeURIComponent(`*🛒 LISTA ${nomeDe(loja)}*\n🔗 *Importar:* ${link}`)}`, '_blank');
    mostrarToast('WhatsApp aberto!');
}

function verificarLinkPartilhado() {
    const data = new URLSearchParams(window.location.search).get('master');
    if (!data) return;

    let importados = 0;
    data.split('|').forEach(bloco => {
        const sep = bloco.indexOf(':');
        if (sep === -1) return;
        const lojaNome = sanitizar(bloco.substring(0, sep).trim());
        const itensStr = bloco.substring(sep + 1).trim();
        if (!lojaNome || !itensStr) return;
        if (!lojasConfig.some(l => l.nome === lojaNome)) return;

        const itensAtuais = obterItens(lojaNome);
        itensStr.split(',').map(n => sanitizar(n.trim())).filter(Boolean).forEach(nome => {
            if (!itensAtuais.some(i => normalizarTexto(i.texto) === normalizarTexto(nome))) {
                itensAtuais.push({ id: gerarId(), texto: nome, comprado: false, qtd: 1 });
                importados++;
            }
        });
        guardarItens(lojaNome, itensAtuais);
    });

    window.history.replaceState({}, document.title, window.location.pathname);
    mostrarGrade();
    mostrarToast(importados > 0 ? `${importados} item(s) importado(s)!` : 'Sem itens novos para importar.');
}

// ============================================
// MODAL DE CONFIRMAÇÃO
// ============================================
let modalBloqueado = false;

function abrirModalApagar(id, loja) {
    if (modalBloqueado) return;
    vibrar(15);
    idParaApagar = id; lojaAlvo = loja; acaoPendente = 'APAGAR_UM';
    modal.querySelector('h3').innerText = 'Apagar item?';
    modal.querySelector('p').innerText  = 'Remover este produto da lista?';
    modal.style.display = 'flex';
}

function abrirModalLimpeza() {
    if (modalBloqueado) return;
    const alvos = filtro === 'all' ? lojasConfig.map(l => l.nome) : [filtro];
    const n = alvos.reduce((t, l) => t + obterItens(l).filter(i => i.comprado).length, 0);
    if (n === 0) { mostrarToast('Nada para limpar'); return; }
    lojaAlvo = filtro === 'all' ? null : filtro;
    acaoPendente = 'LIMPAR_FEITOS';
    modal.querySelector('h3').innerText = 'Limpar concluídos?';
    modal.querySelector('p').innerText  = `Apagar ${n} ${n === 1 ? 'item' : 'itens'} no carrinho?`;
    modal.style.display = 'flex';
}

// Overlay invisível que absorve toques residuais durante X ms
function bloquearToques(ms = 400) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;';
    ['touchstart', 'touchend', 'click'].forEach(t => overlay.addEventListener(t, e => e.stopPropagation(), true));
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), ms);
}

function confirmarAcao() {
    bloquearToques(450);
    if (acaoPendente === 'APAGAR_UM') {
        guardarItens(lojaAlvo, obterItens(lojaAlvo).filter(i => String(i.id) !== String(idParaApagar)));
    } else {
        const alvos = lojaAlvo ? [lojaAlvo] : lojasConfig.map(l => l.nome);
        alvos.forEach(l => guardarItens(l, obterItens(l).filter(i => !i.comprado)));
    }
    renderizar();
    fecharModal();
    mostrarToast('Concluído!');
}

function fecharModal() {
    if (modalBloqueado) return;
    modalBloqueado = true;
    bloquearToques(450);

    const content = modal.querySelector('.modal-content');
    content.style.transition = 'transform .32s cubic-bezier(.4,0,1,1), opacity .28s ease';
    content.style.transform  = 'translateY(100%)';
    content.style.opacity    = '0';

    setTimeout(() => {
        modal.style.display      = 'none';
        content.style.transition = '';
        content.style.transform  = '';
        content.style.opacity    = '';
        modalBloqueado = false;
    }, 340);
}

// Swipe para baixo no modal + bloqueio de swipe horizontal (exceto no carrossel)
(function () {
    let startX = 0, startY = 0, currentY = 0, dragging = false, isHorizontal = false;

    document.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
        startY = currentY = e.touches[0].clientY;
        isHorizontal = false;
        if (modal.style.display === 'flex') {
            dragging = true;
            modal.querySelector('.modal-content').style.transition = 'none';
        }
    }, { passive: true });

    document.addEventListener('touchmove', e => {
        const dX = e.touches[0].clientX - startX;
        const dY = e.touches[0].clientY - startY;

        if (!isHorizontal && Math.abs(dX) > Math.abs(dY) && Math.abs(dX) > 8) isHorizontal = true;

        if (isHorizontal) {
            // O carrossel de lojas precisa do scroll horizontal nativo
            if (!e.target.closest('.lojas, .chips')) e.preventDefault();
            return;
        }
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const delta = Math.max(0, currentY - startY);
        const content = modal.querySelector('.modal-content');
        content.style.transform = `translateY(${delta}px)`;
        content.style.opacity   = `${1 - delta / 300}`;
        e.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', () => {
        if (!dragging) return;
        dragging = false;
        const delta = Math.max(0, currentY - startY);
        const content = modal.querySelector('.modal-content');
        if (delta > 100) fecharModal();
        else {
            content.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease';
            content.style.transform = '';
            content.style.opacity   = '';
        }
    });
})();

// ============================================
// SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=0.0.17')
            .then(reg => reg.update())
            .catch(err => console.warn('SW:', err));
    });
}

// ============================================
// HISTÓRICO — o botão "voltar" fecha sheets/filtros em vez de sair
// ============================================
window.addEventListener('popstate', () => {
    if (addModal.style.display === 'flex') fecharSheet();
    else if (lojasModal.style.display === 'flex') fecharLojas();
    else if (modal.style.display === 'flex') fecharModal();
    else if (filtro !== 'all' || busca) mostrarGrade();
    history.pushState({ pagina: 'lista' }, '');
});

// ============================================
// ARRANQUE
// ============================================
window.LOJAS_NOMES = lojasConfig.map(l => l.nome);

iniciarArmazenamento().then(() => {
    mostrarGrade();
    verificarLinkPartilhado();
});
history.pushState({ pagina: 'lista' }, '');