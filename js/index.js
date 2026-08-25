// --- Configuração do Supabase ---
const SUPABASE_URL = "https://caajxkxpvlleiilwayzi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYWp4a3hwdmxsZWlpbHdheXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjE3NTksImV4cCI6MjEwMTUzNzc1OX0.vYboyaDIsNonsZ1kiTRGiKzIesrJOz6WLcIpEffZjXU";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ======================================================
// Verifica sessão e ajusta o header (logado x deslogado, admin x comum)
// ======================================================
async function verificarSessao() {
  const { data: { user } } = await supabaseClient.auth.getUser();

  const areaAuth = document.getElementById("area-auth");
  const areaLogado = document.getElementById("area-logado");
  const linkAdmin = document.getElementById("link-admin");

  if (!user) {
    areaAuth.classList.remove("d-none");
    areaLogado.classList.add("d-none");
    return;
  }

  // Logado: esconde Login/Sign-up, mostra Perfil/Sair
  areaAuth.classList.add("d-none");
  areaLogado.classList.remove("d-none");

  // Checa se é admin, pra mostrar (ou não) o link da área admin
  const { data: perfil } = await supabaseClient
    .from('perfis')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (perfil?.is_admin) {
    linkAdmin.classList.remove("d-none");
  }
}

async function sair() {
  await supabaseClient.auth.signOut();
  window.location.reload();
}

// ======================================================
// Início
// ======================================================
verificarSessao();