const folhetoConteudo = document.getElementById('folheto-conteudo');
const modal = document.getElementById('confirmModal');
let idParaApagar = null;
let lojaAlvo = null;
let acaoPendente = null;

// 1. Base de Dados de Ícones (Expandida)
const ICONES_PRODUTOS = {
    "ucal": "🍫", "fairy": "🧼", "nesquik": "🥣", "detergente": "🧼", 
    "cenoura": "🥕", "batata": "🥔", "calca": "👖", "alho": "🧄", 
    "acucar": "🍬", "açúcar": "🍬", "banana": "🍌", "feijao": "🫘", 
    "lixivia": "🧴", "kiwi": "🥝", "leite": "🥛", "pao": "🍞", 
    "pão": "🍞", "ovo": "🥚", "cafe": "☕", "café": "☕", "arroz": "🍚", 
    "massa": "🍝", "fruta": "🍎", "carne": "🥩", "peixe": "🐟",
    "cerveja": "🍺", "vinho": "🍷", "agua": "💧", "água": "💧", 
    "papel": "🧻", "iogurte": "🍦", "queijo": "🧀"
};

// 2. Lista de Sugestões (Realista v3.1)
const PRODUTOS_COMUNS = [
    "Ucal", "Pastilhas Fairy", "Nesquik", "Detergente", "Cenouras", 
    "Batatas", "Calças", "Alho francês", "Açúcar", "Bananas", 
    "Feijão frade", "Detergente roupa", "Lixívia", "Kiwi",
    "Leite", "Pão", "Ovos", "Arroz", "Massa", "Café", "Azeite", 
    "Fruta", "Iogurtes", "Papel Higiénico", "Carne", "Peixe", "Cebolas"
];

const lojasConfig = [
    { nome: 'LIDL', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Lidl-Logo.svg' },
    { nome: 'ALDI', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/ALDI_Nord_Logo_2015.png/120px-ALDI_Nord_Logo_2015.png' },
    { nome: 'Mercadona', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/90/Logo_Mercadona_%28color-300-alpha%29.png/250px-Logo_Mercadona_%28color-300-alpha%29.png' },
    { nome: 'Continente', logo: 'https://images.seeklogo.com/logo-png/19/2/continente-hipermercados-logo-png_seeklogo-198420.png' },
    { nome: 'Pingo Doce', logo: 'https://upload.wikimedia.org/wikipedia/pt/thumb/3/37/PingoDoce.jpg/250px-PingoDoce.jpg' },
    { nome: 'Intermarché', logo: 'https://intermarche.pt/images/logo-app.png' }
];

// --- UTILITÁRIOS ---

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

function mostrarToast(mensagem) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- LÓGICA DE INTERFACE ---

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
                    <button class="share-btn" onclick="partilharLojaUnica('${loja.nome}')"><i class="fas fa-paper-plane"></i></button>
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

function mostrarSugestoes(loja) {
    const input = document.getElementById(`input-${loja}`);
    const divSugestoes = document.getElementById(`sugestoes-${loja}`);
    const busca = normalizarTexto(input.value);

    if (busca.length < 1) { 
        divSugestoes.innerHTML = ""; 
        return; 
    }

    // Agora usa startsWith para filtrar apenas pela inicial
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
    const texto = textoManual || input.value.trim();
    if (!texto) return;

    const item = { id: Date.now() + Math.random(), texto, comprado: false };
    let itens = JSON.parse(localStorage.getItem(`compras_${loja}`)) || [];
    itens.push(item);
    localStorage.setItem(`compras_${loja}`, JSON.stringify(itens));
    
    input.value = "";
    document.getElementById(`sugestoes-${loja}`).innerHTML = "";
    if(!textoManual) toggleInput(loja);
    carregarItens(loja);
    mostrarToast("Adicionado!");
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
    const li = document.getElementById(`li-${id}`); // Precisamos que os LIs tenham ID
    
    // 1. Adiciona a classe de animação de saída
    li.classList.add('item-saindo');

    // 2. Espera a animação acabar (400ms) para reordenar
    setTimeout(() => {
        let itens = JSON.parse(localStorage.getItem(`compras_${loja}`));
        const index = itens.findIndex(i => i.id === id);
        
        itens[index].comprado = !itens[index].comprado;
        localStorage.setItem(`compras_${loja}`, JSON.stringify(itens));

        // 3. Recarrega a lista já com a nova ordem
        carregarItens(loja);
        
        // 4. Opcional: Adiciona classe de entrada no novo item para efeito visual
        const novoLi = document.getElementById(`li-${id}`);
        if(novoLi) novoLi.classList.add('item-entrando');
    }, 400);
}

// --- PARTILHA MASTER ---

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
        mostrarToast("Nada para partilhar!");
        return;
    }

    const baseUrl = window.location.href.split('?')[0];
    const linkMagico = `${baseUrl}?master=${encodeURIComponent(dadosParaEnvio.join('|'))}`;
    const msg = `*📋 AS MINHAS LISTAS*\n\n${resumoTexto}\n🔗 *Importar:* ${linkMagico}`;

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    mostrarToast("WhatsApp aberto!");
}

function partilharLojaUnica(loja) {
    const itens = JSON.parse(localStorage.getItem(`compras_${loja}`)) || [];
    const pendentes = itens.filter(i => !i.comprado);
    if (pendentes.length === 0) return mostrarToast("Lista vazia!");

    const nomes = pendentes.map(i => i.texto).join(',');
    const baseUrl = window.location.href.split('?')[0];
    const linkMagico = `${baseUrl}?master=${encodeURIComponent(loja + ':' + nomes)}`;
    
    const msg = `*🛒 LISTA ${loja}*\n🔗 *Importar:* ${linkMagico}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

function verificarLinkPartilhado() {
    const urlParams = new URLSearchParams(window.location.search);
    const masterData = urlParams.get('master');

    if (masterData) {
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
        mostrarToast("Listas atualizadas!");
    }
}

// --- MODAIS E AUXILIARES ---

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
    mostrarToast("Concluído!");
}

function fecharModal() { modal.style.display = "none"; }
function toggleInput(loja) {
    const el = document.getElementById(`container-${loja}`);
    el.style.display = el.style.display === 'none' ? 'flex' : 'none';
    if(el.style.display === 'flex') document.getElementById(`input-${loja}`).focus();
}

// Service Worker
if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`./sw.js?v=3.1`).then(reg => {
            reg.update();
        });
    });
}

init();
verificarLinkPartilhado();