// ============================================
//   A MINHA LISTA — app-v2.js v0.0.6
// ============================================

const modal = document.getElementById('confirmModal');
let idParaApagar = null;
let lojaAlvo     = null;
let acaoPendente = null;
let lojaAtiva    = null;
let modoCompras  = false; // Modo "estou às compras"

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
    const container = document.getElementById('toast-container');
    const toast     = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-check-circle"></i> ${mensagem}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function obterItens(loja) {
    try { return JSON.parse(localStorage.getItem(`compras_${loja}`)) || []; }
    catch { return []; }
}

function guardarItens(loja, itens) {
    localStorage.setItem(`compras_${loja}`, JSON.stringify(itens));
}

function contarPendentes(loja) {
    return obterItens(loja).filter(i => !i.comprado).length;
}

// ============================================
// ECRÃ 1 — GRADE
// ============================================

function mostrarGrade() {
    lojaAtiva   = null;
    modoCompras = false;
    document.removeEventListener('touchstart', fecharSugestoesFora);
    document.removeEventListener('click', fecharSugestoesFora);
    esconderSugestoes();

    document.getElementById('ecra-grade').style.display = 'flex';
    document.getElementById('ecra-lista').style.display = 'none';
    renderizarGrade();
}

function renderizarGrade() {
    const grid = document.getElementById('grid-lojas');
    grid.innerHTML = '';

    lojasConfig.forEach((loja, index) => {
        const nomeDisplay = loja.nomeDisplay || loja.nome;
        const pendentes   = contarPendentes(loja.nome);

        const card  = document.createElement('div');
        card.className = 'loja-card';

        const inner = document.createElement('div');
        inner.className = 'loja-card-inner';
        // Animação escalonada — cada card aparece com delay crescente
        inner.style.animationDelay = `${index * 60}ms`;
        inner.addEventListener('click', () => abrirLoja(loja.nome));

        inner.innerHTML = `
            <div class="loja-logo-wrap">
                <div class="loja-logo-shimmer"></div>
                <img src="${loja.logo}" alt="${nomeDisplay}" class="loja-card-logo"
                     onload="this.previousElementSibling.style.display='none'; this.style.opacity='1'">
            </div>
            <span class="loja-card-nome">${nomeDisplay}</span>
            <span class="loja-card-badge ${pendentes === 0 ? 'badge-vazio' : ''}">
                ${pendentes === 0 ? '✓' : pendentes}
            </span>
        `;

        card.appendChild(inner);
        grid.appendChild(card);
    });
}

// ============================================
// ECRÃ 2 — LISTA
// ============================================

function abrirLoja(nomeLoja) {
    lojaAtiva   = nomeLoja;
    modoCompras = false;
    const loja        = lojasConfig.find(l => l.nome === nomeLoja);
    const nomeDisplay = loja?.nomeDisplay || nomeLoja;

    document.getElementById('lista-loja-logo').src = loja?.logo || '';
    document.getElementById('lista-loja-logo').alt = nomeDisplay;
    document.getElementById('lista-loja-nome').textContent = nomeDisplay;

    document.getElementById('ecra-grade').style.display = 'none';
    document.getElementById('ecra-lista').style.display = 'flex';

    // Garante que botão de modo compras começa no estado correcto
    atualizarBotaoModoCompras();

    document.getElementById('lista-input-container').style.display = 'none';
    document.getElementById('lista-input').value = '';

    carregarItens(nomeLoja);

    document.addEventListener('touchstart', fecharSugestoesFora, { passive: true });
    document.addEventListener('click', fecharSugestoesFora);
}

function voltarGrade() {
    if (!lojaAtiva) { mostrarGrade(); return; }

    const pendentes = contarPendentes(lojaAtiva);
    if (pendentes > 0) {
        lojaAlvo     = lojaAtiva;
        acaoPendente = 'VOLTAR';
        modal.querySelector('.warning-icon').className = 'fas fa-circle-exclamation warning-icon';
        modal.querySelector('.warning-icon').style.color = 'var(--blue)';
        modal.querySelector('.btn-confirm').style.background = 'var(--blue)';
        modal.querySelector('h3').innerText = 'Sair da lista?';
        modal.querySelector('p').innerText  = `Ainda tens ${pendentes} item(s) por comprar.`;
        modal.querySelector('.btn-confirm').innerText = 'Sair';
        modal.querySelector('.btn-cancel').innerText  = 'Ficar';
        modal.style.display = 'flex';
    } else {
        mostrarGrade();
    }
}

function fecharSugestoesFora(e) {
    if (!e.target.closest('#lista-input-container') &&
        !e.target.closest('#sugestoes-floating')) {
        esconderSugestoes();
    }
}

// ============================================
// MODO COMPRAS
// ============================================

function toggleModoCompras() {
    modoCompras = !modoCompras;
    vibrar(20);
    atualizarBotaoModoCompras();
    carregarItens(lojaAtiva);

    if (modoCompras) {
        mostrarToast('Modo compras ativo 🛒');
    }
}

function atualizarBotaoModoCompras() {
    const btn = document.getElementById('btn-modo-compras');
    if (!btn) return;

    if (modoCompras) {
        btn.classList.add('ativo');
        btn.title = 'Mostrar todos';
    } else {
        btn.classList.remove('ativo');
        btn.title = 'Modo compras';
    }
}

// ============================================
// SUGESTÕES
// ============================================

function mostrarSugestoes() {
    const input = document.getElementById('lista-input');
    const busca = normalizarTexto(input.value);

    if (busca.length < 1) { esconderSugestoes(); return; }

    const filtrados = PRODUTOS.filter(p =>
        normalizarTexto(p.texto).startsWith(busca)
    );

    let div = document.getElementById('sugestoes-floating');

    if (filtrados.length === 0) { esconderSugestoes(); return; }

    const rect = input.getBoundingClientRect();

    if (!div) {
        div           = document.createElement('div');
        div.id        = 'sugestoes-floating';
        div.className = 'datalist-sugestoes';
        div.style.cssText = `position:fixed;z-index:99999;`;
        div.addEventListener('click', e => {
            const item = e.target.closest('.sugestao-item');
            if (item) adicionarItem(item.dataset.texto);
        });
        document.body.appendChild(div);
    }

    div.style.top   = `${rect.bottom + 6}px`;
    div.style.left  = `${rect.left}px`;
    div.style.width = `${rect.width}px`;

    div.innerHTML = filtrados.map(p => `
        <div class="sugestao-item" data-texto="${p.texto}">
            <span>${p.icone}</span><span>${p.texto}</span>
        </div>`).join('');
}

function esconderSugestoes() {
    const f = document.getElementById('sugestoes-floating');
    if (f) f.remove();
}

// ============================================
// CRUD
// ============================================

function adicionarItem(textoManual = null) {
    const input = document.getElementById('lista-input');
    const texto = sanitizar(textoManual || input.value.trim());
    if (!texto || !lojaAtiva) return;

    vibrar(25);

    const item  = { id: gerarId(), texto, comprado: false };
    const itens = obterItens(lojaAtiva);
    itens.push(item);
    guardarItens(lojaAtiva, itens);

    input.value = '';
    esconderSugestoes();
    carregarItens(lojaAtiva);
    atualizarBadge(lojaAtiva);
    mostrarToast('Adicionado!');
}

function carregarItens(loja) {
    const listaUl = document.getElementById('lista-itens');
    if (!listaUl) return;
    listaUl.innerHTML = '';

    let itens = obterItens(loja);
    // No modo compras, esconde os comprados
    if (modoCompras) {
        itens = itens.filter(i => !i.comprado);
    } else {
        itens.sort((a, b) => Number(a.comprado) - Number(b.comprado));
    }

    if (itens.length === 0) {
        listaUl.innerHTML = `
            <li class="lista-vazia">
                <span>${modoCompras ? '🎉' : '🛒'}</span>
                <span>${modoCompras ? 'Tudo comprado!' : 'Lista vazia — adiciona o primeiro item!'}</span>
            </li>`;
        // No modo compras, volta automaticamente ao normal após 2s para não ficar preso
        if (modoCompras) {
            setTimeout(() => {
                mostrarToast('🎉 Tudo comprado!');
            }, 100);
        }
        return;
    }

    // Separa pendentes e comprados (só se não estiver em modo compras)
    const pendentes = itens.filter(i => !i.comprado);
    const comprados = itens.filter(i => i.comprado);

    pendentes.forEach(item => listaUl.appendChild(criarItemLi(item, loja)));

    // Divisor visual entre pendentes e comprados
    if (!modoCompras && comprados.length > 0 && pendentes.length > 0) {
        const div = document.createElement('li');
        div.className = 'lista-divisor';
        div.innerHTML = `<span>Já comprado</span>`;
        listaUl.appendChild(div);
    }

    comprados.forEach(item => listaUl.appendChild(criarItemLi(item, loja)));
}

function criarItemLi(item, loja) {
    const li      = document.createElement('li');
    li.className  = item.comprado ? 'comprado' : '';
    li.id         = `li-${item.id}`;

    li.innerHTML = `
        <div class="item-emoji-wrap" onclick="toggleItem('${loja}', '${item.id}')">
            ${obterIcone(item.texto)}
        </div>
        <span class="item-texto" onclick="toggleItem('${loja}', '${item.id}')">
            ${item.texto}
        </span>
        <button class="delete-btn" onclick="abrirModalApagar('${item.id}', '${loja}')">
            <i class="fas fa-xmark"></i>
        </button>
    `;

    return li;
}

function toggleItem(loja, id) {
    const li = document.getElementById(`li-${id}`);
    if (!li) return;

    vibrar(30);

    li.style.transition = 'opacity .2s ease, transform .2s ease';
    li.style.opacity    = '0';
    li.style.transform  = 'translateX(12px)';

    setTimeout(() => {
        const itens = obterItens(loja);
        const item  = itens.find(i => String(i.id) === String(id));
        if (!item) return;

        item.comprado = !item.comprado;
        guardarItens(loja, itens);
        carregarItens(loja);
        atualizarBadge(loja);

        const novoLi = document.getElementById(`li-${id}`);
        if (novoLi) {
            novoLi.style.opacity   = '0';
            novoLi.style.transform = 'translateY(-4px)';
            novoLi.style.transition = 'opacity .25s ease, transform .25s ease';
            requestAnimationFrame(() => requestAnimationFrame(() => {
                novoLi.style.opacity   = '1';
                novoLi.style.transform = 'translateY(0)';
            }));
        }
    }, 200);
}

function atualizarBadge(loja) {
    const pendentes = contarPendentes(loja);
    document.querySelectorAll('.loja-card-inner').forEach(inner => {
        const nome   = inner.querySelector('.loja-card-nome')?.textContent;
        const config = lojasConfig.find(l => (l.nomeDisplay || l.nome) === nome);
        if (config && config.nome === loja) {
            const badge       = inner.querySelector('.loja-card-badge');
            if (!badge) return;
            badge.textContent = pendentes === 0 ? '✓' : pendentes;
            badge.className   = `loja-card-badge ${pendentes === 0 ? 'badge-vazio' : ''}`;
        }
    });
}

// ============================================
// TOGGLE INPUT
// ============================================

function toggleInput() {
    const container = document.getElementById('lista-input-container');
    const aAbrir    = container.style.display === 'none' || container.style.display === '';
    container.style.display = aAbrir ? 'flex' : 'none';
    if (aAbrir) {
        document.getElementById('lista-input').focus();
    } else {
        esconderSugestoes();
    }
}

// ============================================
// PARTILHA
// ============================================

function partilharTudo() {
    const blocos = [];
    let resumo   = '';

    lojasConfig.forEach(loja => {
        const pendentes = obterItens(loja.nome).filter(i => !i.comprado);
        if (pendentes.length > 0) {
            blocos.push(`${loja.nome}:${pendentes.map(i => i.texto).join(',')}`);
            resumo += `• *${loja.nomeDisplay || loja.nome}* (${pendentes.length})\n`;
        }
    });

    if (blocos.length === 0) { mostrarToast('Nada para partilhar!'); return; }

    const base = window.location.href.split('?')[0];
    const link = `${base}?master=${encodeURIComponent(blocos.join('|'))}`;
    if (link.length > 1800) { mostrarToast('⚠️ Lista muito longa! Partilha por loja.'); return; }

    window.open(`https://wa.me/?text=${encodeURIComponent(`*📋 AS MINHAS LISTAS*\n\n${resumo}\n🔗 *Importar:* ${link}`)}`, '_blank');
    mostrarToast('WhatsApp aberto!');
}

function partilharLojaAtiva() {
    if (!lojaAtiva) return;
    const pendentes = obterItens(lojaAtiva).filter(i => !i.comprado);
    if (pendentes.length === 0) { mostrarToast('Lista vazia!'); return; }

    const base  = window.location.href.split('?')[0];
    const link  = `${base}?master=${encodeURIComponent(`${lojaAtiva}:${pendentes.map(i => i.texto).join(',')}`)}`;
    const loja  = lojasConfig.find(l => l.nome === lojaAtiva);

    window.open(`https://wa.me/?text=${encodeURIComponent(`*🛒 LISTA ${loja?.nomeDisplay || lojaAtiva}*\n🔗 *Importar:* ${link}`)}`, '_blank');
    mostrarToast('WhatsApp aberto!');
}

function verificarLinkPartilhado() {
    const params = new URLSearchParams(window.location.search);
    const data   = params.get('master');
    if (!data) return;

    let importados = 0;

    data.split('|').forEach(bloco => {
        const sep      = bloco.indexOf(':');
        if (sep === -1) return;
        const lojaNome = sanitizar(bloco.substring(0, sep).trim());
        const itensStr = bloco.substring(sep + 1).trim();
        if (!lojaNome || !itensStr) return;
        if (!lojasConfig.some(l => l.nome === lojaNome)) return;

        const nomes       = itensStr.split(',').map(n => sanitizar(n.trim())).filter(Boolean);
        const itensAtuais = obterItens(lojaNome);
        nomes.forEach(nome => {
            if (!itensAtuais.some(i => normalizarTexto(i.texto) === normalizarTexto(nome))) {
                itensAtuais.push({ id: gerarId(), texto: nome, comprado: false });
                importados++;
            }
        });
        guardarItens(lojaNome, itensAtuais);
    });

    window.history.replaceState({}, document.title, window.location.pathname);
    mostrarGrade();
    if (importados > 0) mostrarToast(`✅ ${importados} item(s) importado(s)!`);
    else mostrarToast('Sem itens novos para importar.');
}

// ============================================
// MODAIS
// ============================================

function abrirModalApagar(id, loja) {
    if (modalBloqueado) return;
    vibrar(15);
    idParaApagar = id; lojaAlvo = loja; acaoPendente = 'APAGAR_UM';
    modal.querySelector('h3').innerText = 'Apagar item?';
    modal.querySelector('p').innerText  = 'Remover este produto da lista?';
    modal.querySelector('.btn-confirm').innerText = 'Sim';
    modal.querySelector('.btn-cancel').innerText  = 'Não';
    modal.style.display = 'flex';
}

function abrirModalLimpeza() {
    if (modalBloqueado) return;
    if (!lojaAtiva) return;
    lojaAlvo = lojaAtiva; acaoPendente = 'LIMPAR_FEITOS';
    modal.querySelector('h3').innerText = 'Limpar concluídos?';
    modal.querySelector('p').innerText  = 'Apagar todos os itens riscados?';
    modal.querySelector('.btn-confirm').innerText = 'Sim';
    modal.querySelector('.btn-cancel').innerText  = 'Não';
    modal.style.display = 'flex';
}

let modalBloqueado = false;

// Cria um overlay invisível que absorve todos os toques durante X ms
function bloquearToques(ms = 400) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;';
    overlay.addEventListener('touchstart', e => e.stopPropagation(), true);
    overlay.addEventListener('touchend',   e => e.stopPropagation(), true);
    overlay.addEventListener('click',      e => e.stopPropagation(), true);
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), ms);
}

function confirmarAcao() {
    bloquearToques(450); // absorve qualquer toque residual
    if (acaoPendente === 'VOLTAR') {
        fecharModal();
        setTimeout(() => mostrarGrade(), 340);
        return;
    }

    let itens = obterItens(lojaAlvo);
    itens = acaoPendente === 'APAGAR_UM'
        ? itens.filter(i => String(i.id) !== String(idParaApagar))
        : itens.filter(i => !i.comprado);

    guardarItens(lojaAlvo, itens);
    carregarItens(lojaAlvo);
    atualizarBadge(lojaAlvo);
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
    modal.style.transition   = 'background .32s ease';
    modal.style.background   = 'rgba(0,0,0,0)';

    setTimeout(() => {
        modal.style.display      = 'none';
        modal.style.transition   = '';
        modal.style.background   = '';
        content.style.transition = '';
        content.style.transform  = '';
        content.style.opacity    = '';

        // Repõe visual SÓ AGORA — quando o modal já está completamente escondido
        const icon = modal.querySelector('.warning-icon');
        icon.className   = 'fas fa-trash-can warning-icon';
        icon.style.color = '';
        modal.querySelector('.btn-confirm').innerText        = 'Sim';
        modal.querySelector('.btn-confirm').style.background = '';
        modal.querySelector('.btn-cancel').innerText         = 'Não';

        modalBloqueado = false;
    }, 340);
}

function abrirModalSafe(fn) {
    // Garante que não abre modal enquanto outro está a fechar
    if (modalBloqueado) return;
    fn();
}

// Swipe para baixo no modal + bloqueio de swipe horizontal
(function() {
    let startX = 0;
    let startY = 0;
    let currentY = 0;
    let dragging = false;
    let isHorizontal = false; // detecta se é swipe horizontal

    function onTouchStart(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        currentY = startY;
        isHorizontal = false;

        if (modal.style.display === 'flex') {
            dragging = true;
            const content = modal.querySelector('.modal-content');
            content.style.transition = 'none';
        }
    }

    function onTouchMove(e) {
        const deltaX = e.touches[0].clientX - startX;
        const deltaY = e.touches[0].clientY - startY;

        // Determina direcção dominante na primeira jogada
        if (!isHorizontal && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
            isHorizontal = true;
        }

        // Bloqueia swipe horizontal para evitar navegação do browser
        if (isHorizontal) {
            e.preventDefault();
            return;
        }

        // Swipe vertical no modal
        if (!dragging) return;
        currentY = e.touches[0].clientY;
        const delta = Math.max(0, currentY - startY);
        const content = modal.querySelector('.modal-content');
        content.style.transform = `translateY(${delta}px)`;
        content.style.opacity   = `${1 - delta / 300}`;
        // Previne o scroll/refresh da página ao puxar o modal
        e.preventDefault();
    }

    function onTouchEnd() {
        if (!dragging) return;
        dragging = false;
        const delta   = Math.max(0, currentY - startY);
        const content = modal.querySelector('.modal-content');

        if (delta > 100) {
            fecharModal();
        } else {
            content.style.transition = 'transform .35s cubic-bezier(.34,1.56,.64,1), opacity .25s ease';
            content.style.transform  = '';
            content.style.opacity    = '';
        }
    }

    // passive: false é obrigatório para poder chamar preventDefault()
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove',  onTouchMove,  { passive: false });
    document.addEventListener('touchend',   onTouchEnd);
})();

// ============================================
// SERVICE WORKER
// ============================================
if ('serviceWorker' in navigator && !location.hostname.includes('localhost')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js?v=0.0.6')
            .then(reg => reg.update())
            .catch(err => console.warn('SW:', err));
    });
}

// ============================================
// ARRANQUE
// ============================================
mostrarGrade();
verificarLinkPartilhado();