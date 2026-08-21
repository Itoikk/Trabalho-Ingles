// --- Configuração do Supabase ---
    const SUPABASE_URL = "SUA_URL_AQUI";
    const SUPABASE_KEY = "SUA_ANON_KEY_AQUI";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
 
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
 
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha
      });
 
      if (error) {
        mostrarMsg("E-mail ou senha inválidos.");
        return;
      }
 
      // login ok -> manda pra página que decide se tem grupo ou não
      window.location.href = "grupo.html";
    });
 
    // --- CADASTRO ---
    document.getElementById("form-cadastro").addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("cadastro-email").value;
      const senha = document.getElementById("cadastro-senha").value;
      const confirma = document.getElementById("cadastro-confirma").value;
 
      if (senha !== confirma) {
        mostrarMsg("As senhas não coincidem.");
        return;
      }
 
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha
      });
 
      if (error) {
        mostrarMsg(error.message);
        return;
      }
 
      mostrarMsg("Conta criada! Verifique seu e-mail para confirmar antes de entrar.", "success");
    });