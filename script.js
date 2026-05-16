s// VARIÁVEIS DO BANCO DE DADOS LOCAL
let posts, usuariosCadastrados, contaLogada, configVisual, lembretes;

// TRAVA DE SEGURANÇA: Se houver dados corrompidos de versões anteriores estruturais, reconstrói limpo.
try {
    posts = JSON.parse(localStorage.getItem('diario_posts_v10')) || [];
    usuariosCadastrados = JSON.parse(localStorage.getItem('diario_usuarios_db_v10')) || [];
    contaLogada = JSON.parse(localStorage.getItem('diario_sessao_ativa_v10')) || null;
    configVisual = JSON.parse(localStorage.getItem('diario_config_v10')) || { tema: 'vintage', fonte: "'Georgia', serif" };
    lembretes = JSON.parse(localStorage.getItem('diario_lembretes_v10')) || [];
} catch (e) {
    // Reset preventivo em caso de quebra de JSON no cache do navegador
    localStorage.clear();
    posts = []; usuariosCadastrados = []; contaLogada = null; lembretes = [];
    configVisual = { tema: 'vintage', fonte: "'Georgia', serif" };
}

let modoAutenticacao = 'login';
let avatarCadastroBase64 = null; 

// PALETAS DE CORES FEMININAS / OUTROS GENEROS (Sem Sapinho e Sem Moranguinho)
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

// PALETAS MASCULINAS (Sem Sapinho e Sem Moranguinho)
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

    // Validação ultra direta e limpa para evitar bugs
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
        const opt = document.createElement('option');
        opt.value = chave;
        opt.innerText = listaTemasUsar[chave].label;
        seletor.appendChild(opt);
    });

    if (!listaTemasUsar[configVisual.tema]) {
        configVisual.tema = 'vintage'; 
    }
    seletor.value = configVisual.tema;
    mudarTema(configVisual.tema);
}

function verificarSessao() {
    if (contaLogada) {
        document.getElementById('tela-inicial').classList.add('desativado');
        document.getElementById('tela-diario').classList.remove('desativado');
        
        carregarOpcoesDeTemasPorGenero();

        const avatarDiv = document.getElementById('avatar-topo-img');
        if (contaLogada.avatar) {
            avatarDiv.style.backgroundImage = `url('${contaLogada.avatar}')`;
            document.getElementById('avatar-letras').innerText = '';
        } else {
            avatarDiv.style.backgroundImage = 'none';
            document.getElementById('avatar-letras').innerText = contaLogada.nome.substring(0,2).toUpperCase();
        }
        
        renderizarLembretes();
        renderizarPosts();
    } else {
        document.getElementById('tela-inicial').classList.remove('desativado');
        document.getElementById('tela-diario').classList.add('desativado');
    }
}

function adicionarLembrete() {
    const campo = document.getElementById('novo-lembrete-txt');
    const campoData = document.getElementById('novo-lembrete-data');
    const campoHora = document.getElementById('novo-lembrete-hora');

    const texto = campo.value.trim();
    if (!texto) {
        lancarToast('Digite a descrição do lembrete!', 'aviso');
        return;
    }

    const dataFormatada = campoData.value ? new Date(campoData.value + 'T00:00:00').toLocaleDateString('pt-BR') : 'Qualquer dia';
    const horaFormatada = campoHora.value || 'Sem hora';

    const novoLembrete = {
        id: Date.now(),
        donoEmail: contaLogada.email,
        texto: texto,
        data: dataFormatada,
        hora: horaFormatada
    };

    lembretes.push(novoLembrete);
    localStorage.setItem('diario_lembretes_v10', JSON.stringify(lembretes));
    
    campo.value = '';
    campoData.value = '';
    campoHora.value = '';
    
    renderizarLembretes();
    lancarToast('Lembrete agendado com sucesso!', 'sucesso');
}

function removerLembrete(id) {
    lembretes = lembretes.filter(l => l.id !== id);
    localStorage.setItem('diario_lembretes_v10', JSON.stringify(lembretes));
    renderizarLembretes();
    lancarToast('Compromisso removido da agenda.', 'aviso');
}

function renderizarLembretes() {
    const lista = document.getElementById('lista-lembretes');
    if (!lista) return;
    lista.innerHTML = '';
    const meusLembretes = lembretes.filter(l => l.donoEmail === contaLogada.email);

    if (meusLembretes.length === 0) {
        lista.innerHTML = '<li style="font-size:0.8rem; opacity:0.5; text-align:center; padding:15px;">Nenhum compromisso agendado.</li>';
        return;
    }

    meusLembretes.forEach(l => {
        const li = document.createElement('li');
        li.className = 'item-lembrete';
        li.innerHTML = `
            <div class="item-lembrete-topo">
                <span>📌 ${l.texto}</span>
                <button class="btn-remover-lembrete" onclick="removerLembrete(${l.id})">❌</button>
            </div>
            <div class="item-lembrete-prazo">🗓️ Para: ${l.data} às ⏰ ${l.hora}</div>
        `;
        lista.appendChild(li);
    });
}

function abrirModalPerfil() {
    document.getElementById('modal-perfil').classList.remove('desativado');
    atualizarElementosModal();
    lancarToast('Visualizando Perfil do Usuário', 'info');
}

function fecharModalPerfil() {
    document.getElementById('modal-perfil').classList.add('desativado');
}

function fecharModalPerfilComCliqueFora(e) {
    if (e.target.id === 'modal-perfil') fecharModalPerfil();
}

function atualizarElementosModal() {
    document.getElementById('perf-nome').innerText = contaLogada.nome;
    document.getElementById('perf-email').innerText = contaLogada.email;
    document.getElementById('perf-genero-editar').value = contaLogada.genero;
    
    const grandeAvatar = document.getElementById('avatar-perfil-grande');
    if (contaLogada.avatar) {
        grandeAvatar.style.backgroundImage = `url('${contaLogada.avatar}')`;
        document.getElementById('avatar-letras-grande').innerText = '';
    } else {
        grandeAvatar.style.backgroundImage = 'none';
        document.getElementById('avatar-letras-grande').innerText = contaLogada.nome.substring(0,2).toUpperCase();
    }
}

function atualizarGeneroPerfil(novoGenero) {
    contaLogada.genero = novoGenero;
    salvarDadosUsuarioNoDB();
    carregarOpcoesDeTemasPorGenero();
    lancarToast(`Gênero modificado para: ${novoGenero}. Paleta atualizada!`, 'sucesso');
}

function salvarDadosUsuarioNoDB() {
    localStorage.setItem('diario_sessao_ativa_v10', JSON.stringify(contaLogada));
    usuariosCadastrados = usuariosCadastrados.map(u => u.email === contaLogada.email ? contaLogada : u);
    localStorage.setItem('diario_usuarios_db_v10', JSON.stringify(usuariosCadastrados));
}

function fazerLogout() {
    localStorage.removeItem('diario_sessao_ativa_v10');
    contaLogada = null;
    fecharModalPerfil();
    verificarSessao();
    lancarToast('Sessão encerrada com segurança!', 'aviso');
}

function salvarPost() {
    const titulo = document.getElementById('titulo').value.trim();
    const conteudo = document.getElementById('conteudo').value.trim();
    const humor = document.querySelector('input[name="humor"]:checked').value;
    const clima = document.querySelector('input[name="clima"]:checked').value;
    const treino = document.querySelector('input[name="treino"]:checked').value;
    const dietaNota = document.getElementById('dieta-escala').value;
    const alimentacaoNota = document.getElementById('alimentacao').value;
    const meta = document.getElementById('meta-dia').value.trim();
    const inputFile = document.getElementById('imagem').files[0];

    if (!conteudo) {
        lancarToast('Escreva algo na memória antes de salvar!', 'aviso');
        return;
    }

    const novoPost = {
        id: Date.now(),
        donoEmail: contaLogada.email,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        titulo: titulo || 'Sem Título',
        conteudo, humor, clima, treino, 
        dietaTexto: padraoEmojisDieta[dietaNota],
        alimentacaoTexto: padraoEmojisAlimentacao[alimentacaoNota],
        meta: meta || 'Não registrada',
        imagem: null
    };

    if (inputFile) {
        const reader = new FileReader();
        reader.onloadend = function() {
            novoPost.imagem = reader.result;
            posts.unshift(novoPost);
            limparFormulario();
        };
        reader.readAsDataURL(inputFile);
    } else {
        posts.unshift(novoPost);
        limparFormulario();
    }
}

function limparFormulario() {
    localStorage.setItem('diario_posts_v10', JSON.stringify(posts));
    renderizarPosts();
    document.getElementById('titulo').value = '';
    document.getElementById('conteudo').value = '';
    document.getElementById('meta-dia').value = '';
    document.getElementById('imagem').value = '';
    document.getElementById('alimentacao').value = 3;
    document.getElementById('dieta-escala').value = 3;
    atualizarEscalaAlimentacao(3);
    atualizarEscalaDieta(3);
    lancarToast('Nova memória arquivada na Linha do Tempo!', 'sucesso');
}

function renderizarPosts() {
    const feed = document.getElementById('feed-posts');
    if (!feed) return;
    feed.innerHTML = '';

    const meusPosts = posts.filter(p => p.donoEmail === contaLogada.email);
    document.getElementById('perf-total').innerText = meusPosts.length;

    if (meusPosts.length === 0) {
        feed.innerHTML = '<p style="text-align:center; opacity:0.4; padding:40px;">Sua Linha do Tempo está limpa.</p>';
        return;
    }

    meusPosts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post';
        div.innerHTML = `
            <div class="post-topo">
                <span>📅 ${post.data} às ${post.hora}</span>
            </div>
            <h3 style="margin-bottom:10px;">${post.titulo}</h3>
            
            <div class="post-tags">
                <span class="tag">Humor: ${post.humor}</span>
                <span class="tag">Clima: ${post.clima}</span>
                <span class="tag">💪 Treino: ${post.treino || 'Não informado'}</span>
                <span class="tag">🍎 Dieta: ${post.dietaTexto || 'Moderada'}</span>
                <span class="tag">🥗 Alimentação: ${post.alimentacaoTexto || 'Equilibrada'}</span>
                <span class="tag">🎯 Meta: ${post.meta}</span>
            </div>

            <p style="white-space:pre-wrap; line-height:1.6;">${post.conteudo}</p>
            ${post.imagem ? `<img src="${post.imagem}" class="post-img">` : ''}
            <br>
            <button class="btn-deletar" onclick="deletarPost(${post.id})">Apagar Registro 🗑️</button>
        `;
        feed.appendChild(div);
    });
}

function deletarPost(id) {
    if (confirm("Quer deletar permanentemente esta memória?")) {
        posts = posts.filter(p => p.id !== id);
        localStorage.setItem('diario_posts_v10', JSON.stringify(posts));
        renderizarPosts();
        lancarToast('Registro removido da Linha do Tempo.', 'aviso');
    }
}

function mudarTema(nomeTema) {
    const listaTemasUsar = (contaLogada && contaLogada.genero === 'Masculino') ? temasMasculinos : temasFemininoEOutros;
    const t = listaTemasUsar[nomeTema] || listaTemasUsar.vintage;
    
    const root = document.documentElement;
    root.style.setProperty('--cor-fundo', t.fundo);
    root.style.setProperty('--cor-texto', t.texto);
    root.style.setProperty('--cor-card', t.card);
    root.style.setProperty('--cor-botao', t.botao);
    
    const escuros = ['oceano', 'dark', 'vintage', 'azulAco', 'verdeExército', 'cinzaUrbano'];
    root.style.setProperty('--cor-botao-texto', (escuros.includes(nomeTema) && contaLogada && contaLogada.genero === 'Masculino') ? '#ffffff' : (nomeTema === 'oceano' || nomeTema === 'dark' ? '#ffffff' : '#2c2c2c'));

    configVisual.tema = nomeTema;
    localStorage.setItem('diario_config_v10', JSON.stringify(configVisual));
    
    if(document.readyState === "complete") {
        lancarToast(`Visual alterado para: ${t.label}`, 'sucesso');
    }
}

function mudarFonte(familiaFonte) {
    document.documentElement.style.setProperty('--fonte-diario', familiaFonte);
    configVisual.fonte = familiaFonte;
    localStorage.setItem('diario_config_v10', JSON.stringify(configVisual));
    
    if(document.readyState === "complete") {
        lancarToast('Fonte tipográfica alterada!', 'sucesso');
    }
}


