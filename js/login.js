// --- Configuração do Supabase ---
const SUPABASE_URL = "https://caajxkxpvlleiilwayzi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYWp4a3hwdmxsZWlpbHdheXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjE3NTksImV4cCI6MjEwMTUzNzc1OX0.vYboyaDIsNonsZ1kiTRGiKzIesrJOz6WLcIpEffZjXU";
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const msgBox = document.getElementById("msg");

function mostrarMsg(texto, tipo = "danger") {
  msgBox.textContent = texto;
  msgBox.className = `alert alert-${tipo}`;
}

// --- LOGIN ---
document.getElementById("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const senha = document.getElementById("login-senha").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    mostrarMsg("Invalid email or password.");
    return;
  }

  // login ok -> volta pra página inicial
  window.location.href = "../index.html";
});

// --- CADASTRO ---
document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("cadastro-email").value;
  const senha = document.getElementById("cadastro-senha").value;
  const confirma = document.getElementById("cadastro-confirma").value;

  if (senha !== confirma) {
    mostrarMsg("The passwords do not match.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password: senha
  });

  if (error) {
    mostrarMsg(error.message);
    return;
  }

  mostrarMsg("Account created successfully! Please check your email to verify your account before logging in.", "success");
});
