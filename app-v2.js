// ============================================
//   A MINHA LISTA — app-v2.js
// ============================================

const folhetoConteudo = document.getElementById('folheto-conteudo');
const modal = document.getElementById('confirmModal');
let idParaApagar = null;
let lojaAlvo = null;
let acaoPendente = null;

// ============================================
// 1. BASE DE DADOS DE ÍCONES
// ============================================
const ICONES_PRODUTOS = {
    "ucal": "🍫", "fairy": "🧼", "nesquik": "🥣", "detergente": "🧼",
    "cenoura": "🥕", "batata": "🥔", "calca": "👖", "alho": "🧄",
    "acucar": "🍬", "açúcar": "🍬", "banana": "🍌", "feijao": "🫘",
    "lixivia": "🧴", "kiwi": "🥝", "leite": "🥛", "pao": "🍞",
    "pão": "🍞", "ovo": "🥚", "cafe": "☕", "café": "☕", "arroz": "🍚",
    "massa": "🍝", "fruta": "🍎", "carne": "🥩", "peixe": "🐟",
    "cerveja": "🍺", "vinho": "🍷", "agua": "💧", "água": "💧",
    "papel": "🧻", "iogurte": "🍦", "queijo": "🧀", "azeite": "🫒",
    "cebola": "🧅", "tomate": "🍅"
};

// ============================================
// 2. LISTA DE SUGESTÕES
// ============================================
const PRODUTOS_COMUNS = [
    "Ucal", "Pastilhas Fairy", "Nesquik", "Detergente", "Cenouras",
    "Batatas", "Calças", "Alho francês", "Açúcar", "Bananas",
    "Feijão frade", "Detergente roupa", "Lixívia", "Kiwi",
    "Leite", "Pão", "Ovos", "Arroz", "Massa", "Café", "Azeite",
    "Fruta", "Iogurtes", "Papel Higiénico", "Carne", "Peixe", "Cebolas"
];

// ============================================
// 3. CONFIGURAÇÃO DAS LOJAS
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
    for (const [chave, icone] of Object.entries(ICONES_PRODUTOS)) {
        if (palavra.includes(normalizarTexto(chave))) return icone;
    }
    return "🛒";
}

// Sanitiza strings externas — previne XSS
function sanitizar(str) {
    return String(str).replace(/[<>"'`]/g, '');
}

// ID único como string — evita comparações float vs string
function gerarId() {
    return Date.now() + '-' + Math.floor(Math.random() * 1000000);
}

function mostrarToast(mensagem) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// LÓGICA DE INTERFACE
// ============================================

function init() {
    folhetoConteudo.innerHTML = "";

    lojasConfig.forEach(loja => {
        const nomeDisplay = loja.nomeDisplay || loja.nome;
        const section = document.createElement('section');
        section.className = 'loja-section';

        section.innerHTML = `
            <div class="loja-header">
                <div class="loja-info">
                    <img src="${loja.logo}" class="loja-logo" alt="${nomeDisplay}">
                    <span class="loja-nome">${nomeDisplay}</span>
                </div>
                <div class="loja-acoes">
                    <button class="share-btn" onclick="partilharLojaUnica('${loja.nome}')"><i class="fas fa-paper-plane"></i></button>
                    <button class="limpar-btn" onclick="abrirModalLimpeza('${loja.nome}')"><i class="fas fa-broom"></i></button>
                    <button class="add-mini-btn" onclick="toggleInput('${loja.nome}')"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="input-container" id="container-${loja.nome}" style="display:none; position:relative;">
                <input
                    type="text"
                    id="input-${loja.nome}"
                    placeholder="O que falta?"
                    oninput="mostrarSugestoes('${loja.nome}')"
                    onkeydown="if(event.key==='Enter') adicionarItem('${loja.nome}')">
                <div id="sugestoes-${loja.nome}" class="datalist-sugestoes"></div>
                <button class="ok-btn" onclick="adicionarItem('${loja.nome}')">OK</button>
            </div>
            <ul id="lista-${loja.nome}"></ul>
        `;

        folhetoConteudo.appendChild(section);
        carregarItens(loja.nome);
    });

    // Fecha sugestões ao tocar fora (touchstart para mobile)
    document.addEventListener('touchstart', (e) => {
        if (!e.target.closest('.input-container')) {
            document.querySelectorAll('.datalist-sugestoes')
                    .forEach(d => d.innerHTML = '');
        }
    }, { passive: true });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-container')) {
            document.querySelectorAll('.datalist-sugestoes')
                    .forEach(d => d.innerHTML = '');
        }
    });
}

function mostrarSugestoes(loja) {
    const input = document.getElementById(`input-${loja}`);
    const divSugestoes = document.getElementById(`sugestoes-${loja}`);
    const busca = normalizarTexto(input.value);

    if (busca.length < 1) {
        divSugestoes.innerHTML = "";
        return;
    }

    const filtrados = PRODUTOS_COMUNS.filter(p =>
        normalizarTexto(p).startsWith(busca)
    );

    divSugestoes.innerHTML = filtrados.map(p => `
        <div class="sugestao-item" onclick="adicionarItem('${loja}', '${p}')">
            <span>${obterIcone(p)}</span> <span>${p}</span>
        </div>`).join('');
}

function adicionarItem(loja, textoManual = null) {
    const input = document.getElementById(`input-${loja}`);
    const texto = sanitizar(textoManual || input.value.trim());
    if (!texto) return;

    // FIX: ID gerado como string consistente
    const item = { id: gerarId(), texto, comprado: false };
    const itens = obterItens(loja);
    itens.push(item);
    guardarItens(loja, itens);

    input.value = "";
    document.getElementById(`sugestoes-${loja}`).innerHTML = "";
    if (!textoManual) toggleInput(loja);
    carregarItens(loja);
    mostrarToast("Adicionado!");
}

function carregarItens(loja) {
    const listaUl = document.getElementById(`lista-${loja}`);
    if (!listaUl) return;
    listaUl.innerHTML = "";

    const itens = obterItens(loja);
    itens.sort((a, b) => Number(a.comprado) - Number(b.comprado));

    itens.forEach(item => {
        const li = document.createElement('li');
        li.className = item.comprado ? 'comprado' : '';
        li.id = `li-${item.id}`;

        // FIX: IDs passados como strings com aspas simples no onclick
        li.innerHTML = `
            <span class="item-texto" onclick="toggleItem('${loja}', '${item.id}')">
                <span class="emoji-icon">${obterIcone(item.texto)}</span> ${item.texto}
            </span>
            <button class="delete-btn" onclick="abrirModalApagar('${item.id}', '${loja}')">
                <i class="fas fa-xmark"></i>
            </button>
        `;
        listaUl.appendChild(li);
    });
}

function toggleItem(loja, id) {
    const li = document.getElementById(`li-${id}`);
    if (!li) return;

    li.classList.add('item-saindo');

    setTimeout(() => {
        const itens = obterItens(loja);
        // FIX: comparação string === string (antes era float === string, falhava)
        const item = itens.find(i => String(i.id) === String(id));
        if (!item) return;

        item.comprado = !item.comprado;
        guardarItens(loja, itens);
        carregarItens(loja);

        const novoLi = document.getElementById(`li-${id}`);
        if (novoLi) novoLi.classList.add('item-entrando');
    }, 400);
}

// ============================================
// PARTILHA
// ============================================

function partilharTudo() {
    const blocos = [];
    let resumoTexto = "";

    lojasConfig.forEach(loja => {
        const pendentes = obterItens(loja.nome).filter(i => !i.comprado);
        if (pendentes.length > 0) {
            const nomes = pendentes.map(i => i.texto).join(',');
            blocos.push(`${loja.nome}:${nomes}`);
            resumoTexto += `• *${loja.nomeDisplay || loja.nome}* (${pendentes.length})\n`;
        }
    });

    if (blocos.length === 0) {
        mostrarToast("Nada para partilhar!");
        return;
    }

    const baseUrl    = window.location.href.split('?')[0];
    const linkMagico = `${baseUrl}?master=${encodeURIComponent(blocos.join('|'))}`;

    if (linkMagico.length > 1800) {
        mostrarToast("⚠️ Lista muito longa! Partilha por loja.");
        return;
    }

    const msg = `*📋 AS MINHAS LISTAS*\n\n${resumoTexto}\n🔗 *Importar:* ${linkMagico}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    mostrarToast("WhatsApp aberto!");
}

function partilharLojaUnica(loja) {
    const pendentes = obterItens(loja).filter(i => !i.comprado);
    if (pendentes.length === 0) {
        mostrarToast("Lista vazia!");
        return;
    }

    const nomes       = pendentes.map(i => i.texto).join(',');
    const baseUrl     = window.location.href.split('?')[0];
    const linkMagico  = `${baseUrl}?master=${encodeURIComponent(loja + ':' + nomes)}`;
    const nomeDisplay = (lojasConfig.find(l => l.nome === loja) || {}).nomeDisplay || loja;
    const msg         = `*🛒 LISTA ${nomeDisplay}*\n🔗 *Importar:* ${linkMagico}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    mostrarToast("WhatsApp aberto!");
}

function verificarLinkPartilhado() {
    const urlParams  = new URLSearchParams(window.location.search);
    const masterData = urlParams.get('master');
    if (!masterData) return;

    let importados = 0;

    masterData.split('|').forEach(bloco => {
        // FIX: indexOf em vez de split(':') — não parte em ':' dentro do produto
        const separador = bloco.indexOf(':');
        if (separador === -1) return;

        const lojaNome   = sanitizar(bloco.substring(0, separador).trim());
        const itensTexto = bloco.substring(separador + 1).trim();
        if (!lojaNome || !itensTexto) return;

        // Só importa para lojas conhecidas
        if (!lojasConfig.some(l => l.nome === lojaNome)) return;

        const nomes       = itensTexto.split(',').map(n => sanitizar(n.trim())).filter(Boolean);
        const itensAtuais = obterItens(lojaNome);

        nomes.forEach(nome => {
            const jaExiste = itensAtuais.some(
                i => normalizarTexto(i.texto) === normalizarTexto(nome)
            );
            if (!jaExiste) {
                itensAtuais.push({ id: gerarId(), texto: nome, comprado: false });
                importados++;
            }
        });

        guardarItens(lojaNome, itensAtuais);
    });

    window.history.replaceState({}, document.title, window.location.pathname);

    if (importados > 0) {
        init();
        mostrarToast(`${importados} item(s) importado(s)!`);
    } else {
        mostrarToast("Sem itens novos para importar.");
    }
}

// ============================================
// MODAIS
// ============================================

function abrirModalApagar(id, loja) {
    idParaApagar = id;
    lojaAlvo     = loja;
    acaoPendente = 'APAGAR_UM';
    modal.querySelector('h3').innerText = "Apagar item?";
    modal.querySelector('p').innerText  = "Remover este produto da lista?";
    modal.style.display = "flex";
}

function abrirModalLimpeza(loja) {
    lojaAlvo     = loja;
    acaoPendente = 'LIMPAR_FEITOS';
    modal.querySelector('h3').innerText = "Limpar concluídos?";
    modal.querySelector('p').innerText  = `Apagar itens riscados no ${loja}?`;
    modal.style.display = "flex";
}

function confirmarAcao() {
    let itens = obterItens(lojaAlvo);

    if (acaoPendente === 'APAGAR_UM') {
        // FIX: comparação com String() para garantir consistência
        itens = itens.filter(i => String(i.id) !== String(idParaApagar));
    } else {
        itens = itens.filter(i => !i.comprado);
    }

    guardarItens(lojaAlvo, itens);
    carregarItens(lojaAlvo);
    fecharModal();
    mostrarToast("Concluído!");
}

function fecharModal() {
    modal.style.display = "none";
}

function toggleInput(loja) {
    const el = document.getElementById(`container-${loja}`);
    if (!el) return;
    const aAbrir = el.style.display === 'none';
    el.style.display = aAbrir ? 'flex' : 'none';
    if (aAbrir) document.getElementById(`input-${loja}`).focus();
}

// ============================================
// HELPERS DE LOCALSTORAGE
// ============================================

function obterItens(loja) {
    try {
        return JSON.parse(localStorage.getItem(`compras_${loja}`)) || [];
    } catch {
        return [];
    }
}

function guardarItens(loja, itens) {
    localStorage.setItem(`compras_${loja}`, JSON.stringify(itens));
}

// ============================================
// SERVICE WORKER
// ============================================

if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=0.0.3').then(reg => {
            reg.update();
        }).catch(err => {
            console.warn('SW não registado:', err);
        });
    });
}

// ============================================
// ARRANQUE
// ============================================

init();
verificarLinkPartilhado();