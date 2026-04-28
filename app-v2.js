const folhetoConteudo = document.getElementById('folheto-conteudo');
const modal = document.getElementById('confirmModal');
let idParaApagar = null;
let lojaAlvo = null;
let acaoPendente = null;

const ICONES_PRODUTOS = {
    "leite": "🥛", "pao": "🍞", "pão": "🍞", "ovo": "🥚", "ovos": "🥚",
    "cafe": "☕", "café": "☕", "arroz": "🍚", "massa": "🍝", "fruta": "🍎",
    "maca": "🍎", "maçã": "🍎", "banana": "🍌", "carne": "🥩", "peixe": "🐟",
    "cerveja": "🍺", "vinho": "🍷", "agua": "💧", "água": "💧", "papel": "🧻",
    "detergente": "🧼", "batata": "🥔", "batatas": "🥔", "cebola": "🧅",
    "iogurte": "🍦", "queijo": "🧀"
};

function obterIcone(texto) {
    const palavra = texto.toLowerCase().trim();
    for (const [chave, icone] of Object.entries(ICONES_PRODUTOS)) {
        if (palavra.includes(chave)) return icone;
    }
    return "🛒";
}

const PRODUTOS_COMUNS = ["Leite", "Pão", "Ovos", "Arroz", "Massa", "Café", "Azeite", "Fruta", "Iogurtes", "Papel Higiénico", "Detergente", "Carne", "Peixe", "Batatas", "Cebolas"];

const lojasConfig = [
    { nome: 'LIDL', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Lidl-Logo.svg' },
    { nome: 'ALDI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/ALDI_Nord_Logo_2015.png/120px-ALDI_Nord_Logo_2015.png' },
    { nome: 'Mercadona', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Mercadona_%28color-300-alpha%29.png/250px-Logo_Mercadona_%28color-300-alpha%29.png' },
    { nome: 'Continente', logo: 'https://images.seeklogo.com/logo-png/19/2/continente-hipermercados-logo-png_seeklogo-198420.png' }
];

function init() {
    folhetoConteudo.innerHTML = "";
    lojasConfig.forEach(loja => {
        const section = document.createElement('section');
        section.className = 'loja-section';
        section.innerHTML = `
            <div class="loja-header">
                <div class="loja-info">
                    <img src="${loja.logo}" class="loja-logo">
                    <span class="loja-nome">${loja.nome}</span>
                </div>
                <div class="loja-acoes">
                    <button class="limpar-btn" onclick="abrirModalLimpeza('${loja.nome}')"><i class="fas fa-broom"></i></button>
                    <button class="add-mini-btn" onclick="toggleInput('${loja.nome}')"><i class="fas fa-plus"></i></button>
                </div>
            </div>
            <div class="input-container" id="container-${loja.nome}" style="display:none; position:relative;">
                <input type="text" id="input-${loja.nome}" placeholder="O que falta?" oninput="mostrarSugestoes('${loja.nome}')">
                <div id="sugestoes-${loja.nome}" class="datalist-sugestoes"></div>
                <button class="ok-btn" onclick="adicionarItem('${loja.nome}')">OK</button>
            </div>
            <ul id="lista-${loja.nome}"></ul>
        `;
        folhetoConteudo.appendChild(section);
        carregarItens(loja.nome);
    });
}

function renderizarItem(loja, item) {
    const listaUl = document.getElementById(`lista-${loja}`);
    const li = document.createElement('li');
    li.id = `li-${item.id}`;
    if(item.comprado) li.className = 'comprado';
    const icone = obterIcone(item.texto);
    li.innerHTML = `
        <span class="item-texto" onclick="toggleItem('${loja}', ${item.id})">
            <span class="emoji-icon">${icone}</span> ${item.texto}
        </span>
        <button class="delete-btn" onclick="abrirModalApagar(${item.id}, '${loja}')">
            <i class="fas fa-xmark"></i>
        </button>
    `;
    listaUl.appendChild(li);
}

function toggleItem(loja, id) {
    let itens = JSON.parse(localStorage.getItem(`compras_${loja}`));
    const index = itens.findIndex(i => i.id === id);
    itens[index].comprado = !itens[index].comprado;
    localStorage.setItem(`compras_${loja}`, JSON.stringify(itens));
    const el = document.getElementById(`li-${id}`);
    el.classList.toggle('comprado');
    el.style.opacity = "0.3";
    el.style.transform = "translateX(10px)";
    setTimeout(() => carregarItens(loja), 500);
}

function abrirModalApagar(id, loja) {
    idParaApagar = id; lojaAlvo = loja; acaoPendente = 'APAGAR_UM';
    modal.querySelector('h3').innerText = "Apagar item?";
    modal.querySelector('p').innerText = "Queres remover este produto?";
    modal.style.display = "flex";
}

function abrirModalLimpeza(loja) {
    lojaAlvo = loja; acaoPendente = 'LIMPAR_FEITOS';
    modal.querySelector('h3').innerText = "Limpar feitos?";
    modal.querySelector('p').innerText = "Apagar todos os itens riscados do " + loja + "?";
    modal.style.display = "flex";
}

function confirmarAcao() {
    let itens = JSON.parse(localStorage.getItem(`compras_${lojaAlvo}`)) || [];
    if (acaoPendente === 'APAGAR_UM') {
        itens = itens.filter(i => i.id !== idParaApagar);
    } else {
        itens = itens.filter(i => !i.comprado);
    }
    localStorage.setItem(`compras_${lojaAlvo}`, JSON.stringify(itens));
    carregarItens(lojaAlvo);
    fecharModal();
}

function carregarItens(loja) {
    const listaUl = document.getElementById(`lista-${loja}`);
    if(!listaUl) return;
    listaUl.innerHTML = "";
    let itens = JSON.parse(localStorage.getItem(`compras_${loja}`)) || [];
    itens.sort((a, b) => a.comprado - b.comprado);
    itens.forEach(item => renderizarItem(loja, item));
}

function adicionarItem(loja, textoManual = null) {
    const input = document.getElementById(`input-${loja}`);
    const texto = textoManual || input.value.trim();
    if (!texto) return;
    const item = { id: Date.now(), texto, comprado: false };
    let itens = JSON.parse(localStorage.getItem(`compras_${loja}`)) || [];
    itens.push(item);
    localStorage.setItem(`compras_${loja}`, JSON.stringify(itens));
    input.value = "";
    document.getElementById(`sugestoes-${loja}`).innerHTML = "";
    toggleInput(loja); 
    input.blur(); 
    carregarItens(loja);
}

function mostrarSugestoes(loja) {
    const input = document.getElementById(`input-${loja}`);
    const divSugestoes = document.getElementById(`sugestoes-${loja}`);
    const busca = input.value.toLowerCase().trim();
    if (busca.length < 1) { divSugestoes.innerHTML = ""; return; }
    const filtrados = PRODUTOS_COMUNS.filter(p => p.toLowerCase().startsWith(busca));
    if (filtrados.length === 0) { divSugestoes.innerHTML = ""; return; }
    divSugestoes.innerHTML = filtrados.map(p => `
        <div class="sugestao-item" onclick="adicionarItem('${loja}', '${p}')">
            <span>${obterIcone(p)}</span> <span>${p}</span>
        </div>`).join('');
}

function fecharModal() { modal.style.display = "none"; }
function toggleInput(loja) {
    const el = document.getElementById(`container-${loja}`);
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

// --- REGISTO DO SERVICE WORKER COM AUTO-REFRESH ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                reg.onupdatefound = () => {
                    const worker = reg.installing;
                    worker.onstatechange = () => {
                        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                            // Detetou nova versão -> Atualiza a página
                            window.location.reload();
                        }
                    };
                };
            });
    });
}

init();