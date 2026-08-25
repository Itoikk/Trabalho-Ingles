// --- Configuração do Supabase ---
const SUPABASE_URL = "https://caajxkxpvlleiilwayzi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYWp4a3hwdmxsZWlpbHdheXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjE3NTksImV4cCI6MjEwMTUzNzc1OX0.vYboyaDIsNonsZ1kiTRGiKzIesrJOz6WLcIpEffZjXU";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let usuarioAtual = null;

function mostrarMsg(texto, tipo = "danger") {
  const msg = document.getElementById("msg");
  msg.textContent = texto;
  msg.className = `alert alert-${tipo}`;
  setTimeout(() => msg.classList.add("d-none"), 3000);
}

// ======================================================
// Carrega os dados do perfil (nome/email) e do grupo atual
// ======================================================
async function carregarPerfil() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  usuarioAtual = user;

  // Dados pessoais
  const { data: perfil, error: erroPerfil } = await supabaseClient
    .from('perfis')
    .select('nome, email')
    .eq('id', user.id)
    .single();

  if (erroPerfil) {
    mostrarMsg("Erro ao carregar perfil: " + erroPerfil.message);
    return;
  }

  document.getElementById("perfil-nome").value = perfil.nome || "";
  document.getElementById("perfil-email").value = perfil.email || "";

  await carregarGrupoAtual();
}

// ======================================================
// Verifica se o usuário já está em algum grupo
// ======================================================
async function carregarGrupoAtual() {
  const { data, error } = await supabaseClient
    .from('membros_grupo')
    .select('grupo_id, grupos(nome, codigo)')
    .eq('user_id', usuarioAtual.id)
    .maybeSingle();

  const areaComGrupo = document.getElementById("area-com-grupo");
  const areaSemGrupo = document.getElementById("area-sem-grupo");

  if (error || !data) {
    areaSemGrupo.classList.remove("d-none");
    areaComGrupo.classList.add("d-none");
    return;
  }

  document.getElementById("nome-grupo-atual").textContent = data.grupos.nome;
  document.getElementById("codigo-grupo-atual").textContent = data.grupos.codigo;
  areaComGrupo.classList.remove("d-none");
  areaSemGrupo.classList.add("d-none");
}

// ======================================================
// Salvar nome/e-mail
// ======================================================
document.getElementById("form-dados").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nome = document.getElementById("perfil-nome").value;
  const email = document.getElementById("perfil-email").value;

  // Atualiza o e-mail no Auth (dispara confirmação, se estiver ativada)
  const { error: erroAuth } = await supabaseClient.auth.updateUser({ email });
  if (erroAuth) {
    mostrarMsg("Erro ao atualizar e-mail: " + erroAuth.message);
    return;
  }

  // Atualiza nome/e-mail na tabela perfis
  const { error: erroPerfil } = await supabaseClient
    .from('perfis')
    .update({ nome, email })
    .eq('id', usuarioAtual.id);

  if (erroPerfil) {
    mostrarMsg("Erro ao salvar dados: " + erroPerfil.message);
    return;
  }

  mostrarMsg("Dados atualizados com sucesso!", "success");
});

// ======================================================
// Trocar senha
// ======================================================
document.getElementById("form-senha").addEventListener("submit", async (e) => {
  e.preventDefault();
  const novaSenha = document.getElementById("nova-senha").value;
  const confirmaSenha = document.getElementById("confirma-senha").value;

  if (novaSenha !== confirmaSenha) {
    mostrarMsg("As senhas não coincidem.");
    return;
  }

  const { error } = await supabaseClient.auth.updateUser({ password: novaSenha });

  if (error) {
    mostrarMsg("Erro ao trocar senha: " + error.message);
    return;
  }

  mostrarMsg("Senha atualizada com sucesso!", "success");
  document.getElementById("form-senha").reset();
});

// ======================================================
// Entrar em um grupo com código
// ======================================================
document.getElementById("form-entrar-grupo").addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = document.getElementById("codigo-grupo").value.trim().toUpperCase();

  const { data: grupo, error: erroGrupo } = await supabaseClient
    .from('grupos')
    .select('id')
    .eq('codigo', codigo)
    .single();

  if (erroGrupo || !grupo) {
    mostrarMsg("Código de grupo inválido.");
    return;
  }

  const { error: erroEntrar } = await supabaseClient
    .from('membros_grupo')
    .insert({ grupo_id: grupo.id, user_id: usuarioAtual.id });

  if (erroEntrar) {
    mostrarMsg("Erro ao entrar no grupo: " + erroEntrar.message);
    return;
  }

  mostrarMsg("Você entrou no grupo!", "success");
  await carregarGrupoAtual();
});

// ======================================================
// Sair do grupo atual
// ======================================================
async function sairDoGrupo() {
  if (!confirm("Tem certeza que deseja sair do grupo?")) return;

  const { error } = await supabaseClient
    .from('membros_grupo')
    .delete()
    .eq('user_id', usuarioAtual.id);

  if (error) {
    mostrarMsg("Erro ao sair do grupo: " + error.message);
    return;
  }

  mostrarMsg("Você saiu do grupo.", "success");
  await carregarGrupoAtual();
}

async function sair() {
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}

// ======================================================
// Início
// ======================================================
carregarPerfil();