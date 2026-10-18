async function listarDestaques() {
    const lista = document.getElementById("projetosDestaque");
    if (!lista) return;

    const { data, error } = await supabaseClient
        .from("trabalhos")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(3);

    if (error) {
        console.error(error);
        lista.innerHTML = "<p>Could not load projects.</p>";
        return;
    }

    if (!data || data.length === 0) {
        lista.innerHTML = "<p>No projects yet.</p>";
        return;
    }

    lista.innerHTML = data.map(t => `
        <div class="col-md-4">
            <div class="card h-100">
                <div class="card-body">
                    <h3 class="card-title">${t.nome}</h3>
                    <p class="card-text">${t.descricao}</p>
                    <a href="${t.arquivo_url}" target="_blank" class="btn btn botao_top3">View Project</a>
                </div>
            </div>
        </div>
    `).join("");
}

listarDestaques();