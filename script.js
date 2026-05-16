let posts, usuariosCadastrados, contaLogada, configVisual, lembretes;

try {
    posts = JSON.parse(localStorage.getItem('diario_posts_v10')) || [];
    usuariosCadastrados = JSON.parse(localStorage.getItem('diario_usuarios_db_v10')) || [];
    contaLogada = JSON.parse(localStorage.getItem('diario_sessao_ativa_v10')) || null;
    configVisual = JSON.parse(localStorage.getItem('diario_config_v10')) || { tema: 'vintage', fonte: "'Georgia', serif" };
    lembretes = JSON.parse(localStorage.getItem('diario_lembretes_v10')) || [];
} catch (e) {
    localStorage.clear();
    posts = []; usuariosCadastrados = []; contaLogada = null; lembretes = [];
    configVisual = { tema: 'vintage', fonte: "'Georgia', serif" };
}

let modoAutenticacao = 'login';
let avatarCadastroBase64 = null; 

const temasFemininoEOutros = {
    vintage: { label: "📜 Vintage Clássico", fundo: '#f4eae1', texto: '#2c2c2c', card: '#ffffff', botao: '#8b5a2b' },
    abelhinha: { label: "🐝 Abelhinha Vibrante", fundo: '#fffde7', texto: '#212121', card: '#ffffff', botao: '#fbc02d' }, 
    pastelRosa: { label: "🌸 Pastel Algodão Doce", fundo: '#ffe5ec', texto: '#6c586e', card: '#ffffff', botao: '#ffb3c6' },
    pastelLavanda: { label: "🍇 Pastel Lavanda Purpurina", fundo: '#f3e8ff', texto: '#4c1d95', card: '#ffffff', botao: '#d8b4fe' },
    pastelMenta: { label: "🍏 Pastel Menta Fresca", fundo: '#e8f5e9', texto: '#1b5e20', card: '#ffffff', botao: '#a5d6a7' },
    pastelAzul: { label: "🦋 Pastel Azul Céu", fundo: '#e3f2fd', texto: '#0d47a1', card: '#ffffff', botao: '#90caf9' },
    pastelAmarelo: { label: "💛 Pastel Sol Suave", fundo: '#fffde7', texto: '#f57f17', card: '#ffffff', botao: '#fff59d' },
    oceano: { label: "🌊 Azul Oceano Deep", fundo: '#0f172a', texto: '#cbd5e1', card: '#1e293b', botao: '#38bdf8' },
    dark: { label: "🌙 Minimalista Noturno", fundo: '#121212', texto: '#e0e0e0', card: '#1e1e1e', botao: '#bb86fc' }
};

const temasMasculinos = {
    azulBebe: { label: "🐳 Azul Bebê Suave", fundo: '#e0f2fe', texto: '#0369a1', card: '#ffffff', botao: '#7dd3fc' },
    cianoPastel: { label: "🧪 Ciano Pastel", fundo: '#e0f7fa', texto: '#006064', card: '#ffffff', botao: '#4dd0e1' },
    abelhinha: { label: "🐝 Abelhinha Vibrante", fundo: '#fffde7', texto: '#212121', card: '#ffffff', botao: '#fbc02d' }, 
    vintage: { label: "📜 Carbono Industrial", fundo: '#2b2d42', texto: '#f8f9fa', card: '#1d1e2c', botao: '#ef233c' },
    azulAco: { label: "⚓ Azul Aço Militar", fundo: '#1e293b', texto: '#f1f5f9', card: '#0f172a', botao: '#3b82f6' },
    verdeExército: { label: "🌲 Verde Camuflagem", fundo: '#242b24', texto: '#e2e8f0', card: '#161b16', botao: '#526e52' },
    cinzaUrbano: { label: "🏙️ Grafite Fosco", fundo: '#333333', texto: '#ffffff', card: '#222222', botao: '#555555' },
    dark: { label: "🌙 Minimalista Noturno", fundo: '#121212', texto: '#e0e0e0', card: '#1e1e1e', botao: '#90caf9' }
};

const padraoEmojisDieta = {
    1: '🤮 Péssimo', 2: '🤢 Ruim', 3: '😐 Moderado', 4: '🙂 Bom', 5: '👑 Perfeito'
};

const padraoEmojisAlimentacao = {
    1: '🍔 Fast Food / Açúcar', 2: '🍕 Massas / Frituras', 3: '🥪 Lanche / Equilibrado', 4: '🍗 Proteínas / Legumes', 5: '🥗 Saladas / Frutas 100% Saudável'
};

window.onload = function() {
    verificarSessao();
    mudarFonte(configVisual.fonte);
    document.getElementById('select-fonte').value = configVisual.fonte;
    mudarAbaAuth('login');
    
    atualizarEscalaAlimentacao(3);
    atualizarEscalaDieta(3);

    document.getElementById('auth-senha').addEventListener('input', function(e) {
        if (this.value.length > 7) {
            lancarToast('Quantidade de caracteres inválida! Máximo de 7 dígitos.', 'aviso');
        }
    });

    document.getElementById('auth-avatar').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = function() {
                avatarCadastroBase64 = reader.result;
                lancarToast('Foto de perfil carregada para o cadastro!', 'sucesso');
                document.getElementById('lbl-auth-avatar').innerText = '✅ Foto Selecionada!';
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('perf-avatar-editar').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = function() {
                contaLogada.avatar = reader.result;
                salvarDadosUsuarioNoDB();
                verificarSessao();
                atualizarElementosModal();
                lancarToast('Foto de perfil adicionada com sucesso!', 'sucesso');
            };
            reader.readAsDataURL(file);
        }
    });
};

function alternarVisibilidadeSenha() {
    const campoSenha = document.getElementById('auth-senha');
    if (campoSenha.type === 'password') {
        campoSenha.type = 'text';
        lancarToast('Senha visível', 'info');
    } else {
        campoSenha.type = 'password';
        lancarToast('Senha oculta', 'info');
    }
}

function atualizarEscalaAlimentacao(val) {
    document.getElementById('valor-escala').innerText = val + " / 5";
    const emojiTexto = padraoEmojisAlimentacao[val].split(' ')[0];
    document.getElementById('emoji-alimentacao-status').innerText = emojiTexto;
}

function atualizarEscalaDieta(val) {
    document.getElementById('valor-dieta').innerText = val + " / 5";
    const emojiTexto = padraoEmojisDieta[val].split(' ')[0];
    document.getElementById('emoji-dieta-status').innerText = emojiTexto;
}

function lancarToast(mensagem, tipo = 'sucesso') {
    const container = document.getElementById('container-toast');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerText = (tipo === 'sucesso' ? '✨ ' : tipo === 'aviso' ? '⚠️ ' : 'ℹ️ ') + mensagem;
    
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

function mudarAbaAuth(modo) {
    modoAutenticacao = modo;
    const camposCadastro = document.querySelectorAll('.campo-cadastro');
    const btnSubmit = document.getElementById('btn-submit-auth');
    
    document.getElementById('aba-entrar').classList.toggle('ativa', modo === 'login');
    document.getElementById('aba-cadastrar').classList.toggle('ativa', modo === 'cadastro');

    camposCadastro.forEach(el => el.style.display = (modo === 'login') ? 'none' : 'block');
    btnSubmit.innerText = (modo === 'login') ? 'Entrar no Diário 🔑' : 'Criar Minha Conta 📝';
}

function processarAutenticacao() {
    const nome = document.getElementById('auth-nome').value.trim();
    const genero = document.getElementById('auth-genero').value;
    const email = document.getElementById('auth-email').value.trim().toLowerCase();
    const senha = document.getElementById('auth-senha').value.trim();

    if (!email || !senha || (modoAutenticacao === 'cadastro' && (!nome || !genero))) {
        lancarToast('Por favor, preencha todos os campos obrigatórios!', 'aviso');
        return;
    }

    if (senha.length < 4 || senha.length > 7) {
        lancarToast('Senha inválida! Deve ter entre 4 e 7 caracteres.', 'aviso');
        return;
    }

    if (modoAutenticacao === 'cadastro') {
        if (usuariosCadastrados.some(u => u.email === email)) {
            lancarToast('Erro: Este e-mail já está registrado!', 'aviso');
            return;
        }
        
        const novoUsuario = { nome, genero, email, senha, avatar: avatarCadastroBase64 };
        usuariosCadastrados.push(novoUsuario);
        localStorage.setItem('diario_usuarios_db_v10', JSON.stringify(usuariosCadastrados));
        
        lancarToast('Conta criada com sucesso! Faça o seu Login.', 'sucesso');
        avatarCadastroBase64 = null;
        document.getElementById('lbl-auth-avatar').innerText = '📸 Adicionar Foto de Perfil (Opcional)';
        mudarAbaAuth('login');
    } else {
        const usuarioEncontrado = usuariosCadastrados.find(u => u.email === email && u.senha === senha);
        if (!usuarioEncontrado) {
            lancarToast('Acesso negado: Credenciais incorretas!', 'aviso');
            return;
        }
        contaLogada = usuarioEncontrado;
        localStorage.setItem('diario_sessao_ativa_v10', JSON.stringify(contaLogada));
        verificarSessao();
        lancarToast(`Acesso concedido! Bem-vindo(a), ${contaLogada.nome}!`, 'sucesso');
    }
}

function carregarOpcoesDeTemasPorGenero() {
    const seletor = document.getElementById('select-tema');
    if (!seletor) return;
    seletor.innerHTML = '';
    
    const listaTemasUsar = (contaLogada && contaLogada.genero === 'Masculino') ? temasMasculinos : temasFemininoEOutros;
    
    Object.keys(listaTemasUsar).forEach(chave => {
        const option = document.createElement('option');
        option.value = chave;
        option.innerText = listaTemasUsar[chave].label;
        seletor.appendChild(option);
    });

    if (configVisual.tema && listaTemasUsar[configVisual.tema]) {
        seletor.value = configVisual.tema;
        mudarTema(configVisual.tema);
    }
}

function verificarSessao() {
    const telaInicial = document.getElementById('tela-inicial');
    const telaDiario = document.getElementById('tela-diario');
    
    if (contaLogada) {
        if (telaInicial) telaInicial.classList.add('desativado');
        if (telaDiario) telaDiario.classList.remove('desativado');
        atualizarElementosModal();
        carregarOpcoesDeTemasPorGenero();
    } else {
        if (telaInicial) telaInicial.classList.remove('desativado');
        if (telaDiario) telaDiario.classList.add('desativado');
    }
}

function atualizarElementosModal() {
    if (!contaLogada) return;
    
    const perfNome = document.getElementById('perf-nome');
    const perfEmail = document.getElementById('perf-email');
    const avatarLetras = document.getElementById('avatar-letras');
    const avatarLetrasGrande = document.getElementById('avatar-letras-grande');
    const perfGeneroEditar = document.getElementById('perf-genero-editar');
    
    if (perfNome) perfNome.innerText = contaLogada.nome;
    if (perfEmail) perfEmail.innerText = contaLogada.email;
    if (perfGeneroEditar) perfGeneroEditar.value = contaLogada.genero;
    
    const primeiraLetra = contaLogada.nome.charAt(0).toUpperCase();
    if (avatarLetras) avatarLetras.innerText = primeiraLetra;
    if (avatarLetrasGrande) avatarLetrasGrande.innerText = primaLetra = primeiraLetra;
    
    const avatarTopoImg = document.getElementById('avatar-topo-img');
    const avatarPerfilGrande = document.getElementById('avatar-perfil-grande');

    if (contaLogada.avatar) {
        if (avatarTopoImg) {
            avatarTopoImg.style.backgroundImage = `url(${contaLogada.avatar})`;
            avatarTopoImg.innerText = '';
        }
        if (avatarPerfilGrande) {
            avatarPerfilGrande.style.backgroundImage = `url(${contaLogada.avatar})`;
            avatarPerfilGrande.innerText = '';
        }
    } else {
        if (avatarTopoImg) {
            avatarTopoImg.style.backgroundImage = 'none';
            avatarTopoImg.innerText = primeiraLetra;
        }
        if (avatarPerfilGrande) {
            avatarPerfilGrande.style.backgroundImage = 'none';
            avatarPerfilGrande.innerText = primeiraLetra;
        }
    }
}

function salvarDadosUsuarioNoDB() {
    if (!contaLogada) return;
    const index = usuariosCadastrados.findIndex(u => u.email === contaLogada.email);
    if (index !== -1) {
        usuariosCadastrados[index] = contaLogada;
        localStorage.setItem('diario_usuarios_db_v10', JSON.stringify(usuariosCadastrados));
        localStorage.setItem('diario_sessao_ativa_v10', JSON.stringify(contaLogada));
    }
}

function fazerLogout() {
    contaLogada = null;
    localStorage.removeItem('diario_sessao_ativa_v10');
    fecharModalPerfil();
    verificarSessao();
    lancarToast('Diário trancado com sucesso!', 'info');
}

function mudarFonte(fonte) {
    document.body.style.fontFamily = fonte; 
    configVisual.fonte = fonte;
    localStorage.setItem('diario_config_v10', JSON.stringify(configVisual));
}

function mudarTema(chaveTema) {
    const listaTemasUsar = (contaLogada && contaLogada.genero === 'Masculino') ? temasMasculinos : temasFemininoEOutros;
    const temaEscolhido = listaTemasUsar[chaveTema] || listaTemasUsar['vintage'];
    
    document.documentElement.style.setProperty('--cor-fundo', temaEscolhido.fundo);
    document.documentElement.style.setProperty('--cor-texto', temaEscolhido.texto);
    document.documentElement.style.setProperty('--cor-card', temaEscolhido.card);
    document.documentElement.style.setProperty('--cor-botao', temaEscolhido.botao);
    
    configVisual.tema = chaveTema;
    localStorage.setItem('diario_config_v10', JSON.stringify(configVisual));
}

function atualizarGeneroPerfil(novoGenero) {
    if (!contaLogada) return;
    contaLogada.genero = novoGenero;
    salvarDadosUsuarioNoDB();
    carregarOpcoesDeTemasPorGenero();
    lancarToast('Gênero e catálogo de temas atualizados!', 'sucesso');
}

function abrirModalPerfil() {
    const modal = document.getElementById('modal-perfil');
    if (modal) modal.classList.remove('desativado');
}

function fecharModalPerfil() {
    const modal = document.getElementById('modal-perfil');
    if (modal) modal.classList.add('desativado');
}

function fecharModalPerfilComCliqueFora(event) {
    if (event.target.id === 'modal-perfil') {
        fecharModalPerfil();
    }
}
