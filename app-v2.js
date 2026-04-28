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
    { nome: 'Continente', logo: 'https://images.seeklogo.com/logo-png/19/2/continente-hipermercados-logo-png_seeklogo-198420.png' },
    { nome: 'Pingo Doce', logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/3/37/PingoDoce.jpg/250px-PingoDoce.jpg' },
    { nome: 'Intermarché', logo: 'https://intermarche.pt/images/logo-app.png' }
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
                    <button class="share-btn" onclick="partilharLista('${loja.nome}')"><i class="fas fa-paper-plane"></i></button>
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

function partilharLista(loja) {
    const itens = JSON.parse(localStorage.getItem(`compras_${loja}`)) || [];
    const pendentes = itens.filter(i => !i.comprado);

    if (pendentes.length === 0) {
        alert("Não há itens para partilhar!");
        return;
    }

    // Criar a lista de nomes separada por vírgulas
    const nomesItens = pendentes.map(i => i.texto).join(',');
    
    // Gerar o Link Mágico (usa a URL atual da página)
    const baseUrl = window.location.href.split('?')[0];
    const linkMagico = `${baseUrl}?loja=${encodeURIComponent(loja)}&itens=${encodeURIComponent(nomesItens)}`;

    // Mensagem bonita para o WhatsApp
    let msg = `*🛒 LISTA DO ${loja.toUpperCase()}*\n`;
    msg += `Clica no link para adicionar à tua app:\n\n`;
    msg += `${linkMagico}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function verificarLinkPartilhado() {
    const urlParams = new URLSearchParams(window.location.search);
    const masterData = urlParams.get('master');

    if (masterData) {
        // Formato: LIDL:Pão,Leite|ALDI:Ovos
        const blocosLoja = masterData.split('|');

        blocosLoja.forEach(bloco => {
            const [lojaNome, itensTexto] = bloco.split(':');
            if (lojaNome && itensTexto) {
                const nomes = itensTexto.split(',');
                let itensAtuais = JSON.parse(localStorage.getItem(`compras_${lojaNome}`)) || [];

                nomes.forEach(nome => {
                    if (!itensAtuais.some(i => i.texto.toLowerCase() === nome.toLowerCase())) {
                        itensAtuais.push({ id: Date.now() + Math.random(), texto: nome, comprado: false });
                    }
                });
                localStorage.setItem(`compras_${lojaNome}`, JSON.stringify(itensAtuais));
            }
        });

        window.history.replaceState({}, document.title, window.location.pathname);
        init();
        mostrarToast("Todas as listas foram atualizadas!");
    }
}

function partilharTudo() {
    let dadosParaEnvio = [];
    let resumoTexto = "";

    lojasConfig.forEach(loja => {
        const itens = JSON.parse(localStorage.getItem(`compras_${loja.nome}`)) || [];
        const pendentes = itens.filter(i => !i.comprado);
        
        if (pendentes.length > 0) {
            const nomes = pendentes.map(i => i.texto).join(',');
            dadosParaEnvio.push(`${loja.nome}:${nomes}`);
            resumoTexto += `• *${loja.nome}* (${pendentes.length})\n`;
        }
    });

    if (dadosParaEnvio.length === 0) {
        mostrarToast("Não há nada para partilhar!"); // Feedback caso esteja vazio
        return;
    }

    const baseUrl = window.location.href.split('?')[0];
    const linkMagico = `${baseUrl}?master=${encodeURIComponent(dadosParaEnvio.join('|'))}`;

    let msg = `*📋 AS MINHAS LISTAS*\n\n${resumoTexto}\n🔗 *Importar:* ${linkMagico}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    
    mostrarToast("A abrir o WhatsApp..."); // Feedback de sucesso
}

function carregarItens(loja) {
    const listaUl = document.getElementById(`lista-${loja}`);
    if(!listaUl) return;
    listaUl.innerHTML = "";
    let itens = JSON.parse(localStorage.getItem(`compras_${loja}`)) || [];
    itens.sort((a, b) => a.comprado - b.comprado);
    itens.forEach(item => {
        const li = document.createElement('li');
        li.className = item.comprado ? 'comprado' : '';
        li.id = `li-${item.id}`;
        li.innerHTML = `
            <span class="item-texto" onclick="toggleItem('${loja}', ${item.id})">
                <span class="emoji-icon">${obterIcone(item.texto)}</span> ${item.texto}
            </span>
            <button class="delete-btn" onclick="abrirModalApagar(${item.id}, '${loja}')"><i class="fas fa-xmark"></i></button>
        `;
        listaUl.appendChild(li);
    });
}

function toggleItem(loja, id) {
    let itens = JSON.parse(localStorage.getItem(`compras_${loja}`));
    const index = itens.findIndex(i => i.id === id);
    itens[index].comprado = !itens[index].comprado;
    localStorage.setItem(`compras_${loja}`, JSON.stringify(itens));
    carregarItens(loja);
}

function abrirModalApagar(id, loja) {
    idParaApagar = id; lojaAlvo = loja; acaoPendente = 'APAGAR_UM';
    modal.querySelector('h3').innerText = "Apagar item?";
    modal.querySelector('p').innerText = "Remover este produto?";
    modal.style.display = "flex";
}

function abrirModalLimpeza(loja) {
    lojaAlvo = loja; acaoPendente = 'LIMPAR_FEITOS';
    modal.querySelector('h3').innerText = "Limpar feitos?";
    modal.querySelector('p').innerText = `Apagar itens riscados no ${loja}?`;
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
    carregarItens(loja);
}

function mostrarSugestoes(loja) {
    const input = document.getElementById(`input-${loja}`);
    const divSugestoes = document.getElementById(`sugestoes-${loja}`);
    const busca = input.value.toLowerCase().trim();
    if (busca.length < 1) { divSugestoes.innerHTML = ""; return; }
    const filtrados = PRODUTOS_COMUNS.filter(p => p.toLowerCase().startsWith(busca));
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

if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`./sw.js?v=2.9`).then(reg => {
            reg.update();
            reg.onupdatefound = () => {
                const worker = reg.installing;
                worker.onstatechange = () => {
                    if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                        window.location.reload();
                    }
                };
            };
        });
    });
}

function mostrarToast(mensagem) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    
    container.appendChild(toast);

    // Remove do HTML depois da animação acabar
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

init();
verificarLinkPartilhado();