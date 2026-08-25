// A configuração do Supabase (supabaseClient) já vem do header.js,
// que precisa ser carregado ANTES deste arquivo no HTML.

// ---------- Remove acentos, espaços e caracteres especiais do nome do arquivo ----------
// A Supabase só aceita letras, números, ponto, traço e underline na "key" do storage.
function sanitizarNome(nome) {
  return nome
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove acentos (ó, ã, ç, etc)
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")                  // troca espaço, °, —, (), etc por _
    .replace(/_+/g, "_");                               // colapsa vários _ seguidos em um só
}

// ---------- Enviar um novo trabalho (arquivo + informações) ----------
async function enviarPDF() {
  const botaoEnviar = document.getElementById('btn-enviar');
  if (botaoEnviar) botaoEnviar.disabled = true; // evita clique duplo

  try {
    const nome = document.getElementById('nome-trabalho').value;
    const descricao = document.getElementById('descricao-trabalho').value;
    const colaboradores = document.getElementById('colaboradores-trabalho').value;
    const input = document.getElementById('arquivo-trabalho');

    if (input.files.length === 0) {
      alert("Selecione um arquivo PDF primeiro!");
      return;
    }

    // 0. Confirma que o usuário está logado e pega o grupo dele
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      alert("Você precisa estar logado para enviar um trabalho.");
      window.location.href = "/pages/login.html";
      return;
    }

    const { data: membro, error: erroMembro } = await supabaseClient
      .from('membros_grupo')
      .select('grupo_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (erroMembro || !membro) {
      alert("Você precisa fazer parte de um grupo antes de enviar um trabalho. Vá em 'Meu perfil' e entre em um grupo com o código.");
      return;
    }

    const arquivo = input.files[0];
    const nomeUnico = Date.now() + "_" + sanitizarNome(arquivo.name); // evita nomes repetidos e caracteres inválidos

    // 1. Envia o PDF em si pro "Storage" (o espaço de arquivos do Supabase)
    const { error: erroUpload } = await supabaseClient
      .storage
      .from('arquivos-pdf')
      .upload(nomeUnico, arquivo);

    if (erroUpload) {
      alert("Erro ao enviar o arquivo: " + erroUpload.message);
      return;
    }

    // 2. Pega o link público desse arquivo que acabou de subir
    const { data: urlData } = supabaseClient
      .storage
      .from('arquivos-pdf')
      .getPublicUrl(nomeUnico);

    // 3. Guarda as informações (nome, descrição, colaboradores, link do arquivo, grupo) na tabela
    const { error: erroTabela } = await supabaseClient
      .from('trabalhos')
      .insert([
        {
          nome: nome,
          descricao: descricao,
          colaboradores: colaboradores,
          arquivo_url: urlData.publicUrl,
          grupo_id: membro.grupo_id
        }
      ]);

    if (erroTabela) {
      alert("Arquivo enviado, mas houve erro ao salvar as informações: " + erroTabela.message);
      return;
    }

    alert("Trabalho enviado com sucesso!");
    input.value = "";
    document.getElementById('nome-trabalho').value = "";
    document.getElementById('descricao-trabalho').value = "";
    document.getElementById('colaboradores-trabalho').value = "";
  } finally {
    if (botaoEnviar) botaoEnviar.disabled = false; // reabilita ao final, com sucesso ou erro
  }
}

// ---------- Listar todos os trabalhos enviados ----------
async function listarPDFs() {
  const container = document.getElementById('listaPDFs');
  if (!container) return; // essa função só roda na página que tiver essa div

  // Descobre se tem usuário logado, seu grupo e se é admin (pra saber quem pode excluir)
  const { data: { user } } = await supabaseClient.auth.getUser();
  let grupoDoUsuario = null;
  let ehAdmin = false;

  if (user) {
    const { data: membro } = await supabaseClient
      .from('membros_grupo')
      .select('grupo_id')
      .eq('user_id', user.id)
      .maybeSingle();
    grupoDoUsuario = membro?.grupo_id ?? null;

    const { data: perfil } = await supabaseClient
      .from('perfis')
      .select('is_admin')
      .eq('id', user.id)
      .single();
    ehAdmin = perfil?.is_admin === true;
  }

  const { data, error } = await supabaseClient
    .from('trabalhos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    container.innerHTML = "<p>Nenhum PDF enviado ainda.</p>";
    return;
  }

  container.innerHTML = "";
  data.forEach(trabalho => {
    const podeExcluir = ehAdmin || (grupoDoUsuario && grupoDoUsuario === trabalho.grupo_id);

    const coluna = document.createElement('div');
    coluna.className = 'col-md-4';
    coluna.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${trabalho.nome}</h5>
          <p class="card-text">${trabalho.descricao}</p>
          <p class="card-text"><small class="text-muted">Colaboradores: ${trabalho.colaboradores}</small></p>
          <div class="d-flex gap-2">
            <a href="${trabalho.arquivo_url}" target="_blank" class="btn btn-primary btn-sm">
              <i class="bi bi-file-earmark-pdf"></i> Abrir PDF
            </a>
            ${podeExcluir ? `
              <button class="btn btn-outline-danger btn-sm" onclick="excluirTrabalho('${trabalho.id}', '${trabalho.arquivo_url}')">
                <i class="bi bi-trash"></i> Excluir
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    container.appendChild(coluna);
  });
}

// ---------- Excluir um trabalho (arquivo do Storage + linha da tabela) ----------
async function excluirTrabalho(id, arquivoUrl) {
  if (!confirm("Tem certeza que deseja excluir esse trabalho? Essa ação não pode ser desfeita.")) return;

  // Extrai o nome do arquivo a partir da URL pública, pra apagar do Storage também
  const nomeArquivo = decodeURIComponent(arquivoUrl.split('/arquivos-pdf/')[1]);

  const { error: erroStorage } = await supabaseClient
    .storage
    .from('arquivos-pdf')
    .remove([nomeArquivo]);

  if (erroStorage) {
    alert("Erro ao excluir o arquivo: " + erroStorage.message);
    return;
  }

  const { error: erroTabela } = await supabaseClient
    .from('trabalhos')
    .delete()
    .eq('id', id);

  if (erroTabela) {
    alert("Erro ao excluir o registro: " + erroTabela.message);
    return;
  }

  alert("Trabalho excluído com sucesso.");
  listarPDFs();
}

// Chama a listagem automaticamente quando a página carrega
// (não dá problema chamar em toda página, porque a função já checa se a div existe)
listarPDFs();