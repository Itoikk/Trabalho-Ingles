// --- Configuração do Supabase ---
// const SUPABASE_URL = "https://caajxkxpvlleiilwayzi.supabase.co";
// const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYWp4a3hwdmxsZWlpbHdheXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjE3NTksImV4cCI6MjEwMTUzNzc1OX0.vYboyaDIsNonsZ1kiTRGiKzIesrJOz6WLcIpEffZjXU";
// const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ======================================================
// Grupos carregados do Supabase (preenchido por carregarGrupos)
// ======================================================
let gruposMock = [];

// ======================================================
// Busca os grupos reais e conta os membros de cada um
// ======================================================
async function carregarGrupos() {
    const { data: grupos, error } = await supabaseClient
        .from('grupos')
        .select('id, nome, codigo')
        .order('criado_em', { ascending: false });

    if (error) {
        mostrarMsg("Erro ao carregar grupos: " + error.message);
        return;
    }

    // Pra cada grupo, conta quantas linhas existem em membros_grupo
    const gruposComContagem = await Promise.all(
        grupos.map(async (g) => {
            const { count } = await supabaseClient
                .from('membros_grupo')
                .select('*', { count: 'exact', head: true })
                .eq('grupo_id', g.id);

            return { ...g, membros: count ?? 0 };
        })
    );

    gruposMock = gruposComContagem;
    renderizarGrupos(gruposMock);
}

// ======================================================
// Verificação de acesso admin (agora real, via Supabase)
// ======================================================
async function verificarAdmin() {
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return false;
    }

    const { data } = await supabaseClient
        .from('perfis')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!data?.is_admin) {
        window.location.href = "index.html";
        return false;
    }

    return true;
}

// ======================================================
// Renderização da tabela
// ======================================================
function renderizarGrupos(grupos) {
    const tbody = document.getElementById("tabela-grupos");

    if (grupos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Nenhum grupo cadastrado</td></tr>`;
        return;
    }

    tbody.innerHTML = grupos.map(g => `
        <tr>
          <td>${g.nome}</td>
          <td><code>${g.codigo}</code></td>
          <td>${g.membros}</td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-secondary" onclick="abrirEdicao('${g.id}')">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="excluirGrupo('${g.id}')">Excluir</button>
          </td>
        </tr>
      `).join("");
}

// ======================================================
// Ações: criar / editar / excluir
// ======================================================
async function abrirModalNovoGrupo() {
    const nome = prompt("Name of the new group: ");
    if (!nome) return;

    const { data: { user } } = await supabaseClient.auth.getUser();
    const codigo = "GRP-" + Math.random().toString(36).substring(2, 7).toUpperCase();

    const { error } = await supabaseClient
        .from('grupos')
        .insert({ nome, codigo, criado_por: user.id });

    if (error) {
        mostrarMsg("Error creating group:" + error.message);
        return;
    }

    mostrarMsg("Group created successfully.", "success");
    carregarGrupos();
}

function abrirEdicao(id) {
    const grupo = gruposMock.find(g => g.id === id);
    if (!grupo) return;

    document.getElementById("edit-id").value = grupo.id;
    document.getElementById("edit-nome").value = grupo.nome;

    const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
    modal.show();
}

async function salvarEdicao() {
    const id = document.getElementById("edit-id").value;
    const novoNome = document.getElementById("edit-nome").value;

    const { error } = await supabaseClient
        .from('grupos')
        .update({ nome: novoNome })
        .eq('id', id);

    if (error) {
        mostrarMsg("Error updating group: " + error.message);
    } else {
        mostrarMsg("Group updated.", "success");
        carregarGrupos();
    }

    bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
}

async function excluirGrupo(id) {
    if (!confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;

    const { error } = await supabaseClient
        .from('grupos')
        .delete()
        .eq('id', id);

    if (error) {
        mostrarMsg("Error deleting group:" + error.message);
        return;
    }

    mostrarMsg("Group excluded.", "success");
    carregarGrupos();
}

function mostrarMsg(texto, tipo = "danger") {
    const msg = document.getElementById("msg");
    msg.textContent = texto;
    msg.className = `alert alert-${tipo}`;
    setTimeout(() => msg.classList.add("d-none"), 3000);
}

async function sair() {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
}

// ======================================================
// Início
// ======================================================
verificarAdmin().then((ehAdmin) => {
    if (ehAdmin) {
        carregarGrupos();
    }
});
