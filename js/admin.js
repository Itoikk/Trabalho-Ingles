// ======================================================
// DADOS MOCK — trocar depois pelas chamadas reais do Supabase
// ======================================================
let gruposMock = [
    { id: 1, nome: "Grupo A", codigo: "GRP-A3F9", membros: 3 },
    { id: 2, nome: "Grupo B", codigo: "GRP-X7K2", membros: 4 },
    { id: 3, nome: "Grupo C", codigo: "GRP-M1Q8", membros: 2 }
];

const perfilFakeAdmin = { is_admin: true }; // MOCK — depois vem da tabela 'perfis'

// ======================================================
// Verificação de acesso admin
// ======================================================
function verificarAdmin() {
    // Depois: const { data } = await supabase.from('perfis').select('is_admin').eq('id', user.id).single();
    if (!perfilFakeAdmin.is_admin) {
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
            <button class="btn btn-sm btn-outline-secondary" onclick="abrirEdicao(${g.id})">Editar</button>
            <button class="btn btn-sm btn-outline-danger" onclick="excluirGrupo(${g.id})">Excluir</button>
          </td>
        </tr>
      `).join("");
}

// ======================================================
// Ações: criar / editar / excluir
// ======================================================
function abrirModalNovoGrupo() {
    const nome = prompt("Nome do novo grupo:");
    if (!nome) return;

    const novoGrupo = {
        id: Date.now(),
        nome: nome,
        codigo: "GRP-" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        membros: 0
    };

    // Depois: await supabase.from('grupos').insert(novoGrupo)
    gruposMock.push(novoGrupo);
    renderizarGrupos(gruposMock);
    mostrarMsg("Grupo criado com sucesso.", "success");
}

function abrirEdicao(id) {
    const grupo = gruposMock.find(g => g.id === id);
    if (!grupo) return;

    document.getElementById("edit-id").value = grupo.id;
    document.getElementById("edit-nome").value = grupo.nome;

    const modal = new bootstrap.Modal(document.getElementById("modalEditar"));
    modal.show();
}

function salvarEdicao() {
    const id = Number(document.getElementById("edit-id").value);
    const novoNome = document.getElementById("edit-nome").value;

    const grupo = gruposMock.find(g => g.id === id);
    if (grupo) {
        // Depois: await supabase.from('grupos').update({ nome: novoNome }).eq('id', id)
        grupo.nome = novoNome;
        renderizarGrupos(gruposMock);
        mostrarMsg("Grupo atualizado.", "success");
    }

    bootstrap.Modal.getInstance(document.getElementById("modalEditar")).hide();
}

function excluirGrupo(id) {
    if (!confirm("Tem certeza que deseja excluir esse grupo? Essa ação não pode ser desfeita.")) return;

    // Depois: await supabase.from('grupos').delete().eq('id', id)
    gruposMock = gruposMock.filter(g => g.id !== id);
    renderizarGrupos(gruposMock);
    mostrarMsg("Grupo excluído.", "success");
}

function mostrarMsg(texto, tipo = "danger") {
    const msg = document.getElementById("msg");
    msg.textContent = texto;
    msg.className = `alert alert-${tipo}`;
    setTimeout(() => msg.classList.add("d-none"), 3000);
}

function sair() {
    // Depois: await supabase.auth.signOut()
    window.location.href = "login.html";
}

// ======================================================
// Início
// ======================================================
if (verificarAdmin()) {
    renderizarGrupos(gruposMock);
}