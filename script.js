const SUPABASE_URL = "https://caajxkxpvlleiilwayzi.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYWp4a3hwdmxsZWlpbHdheXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjE3NTksImV4cCI6MjEwMTUzNzc1OX0.vYboyaDIsNonsZ1kiTRGiKzIesrJOz6WLcIpEffZjXU";

// Aqui é criado o "cliente" que fala com o Supabase.
// O nome da variável (supabaseClient) é diferente do nome da função (supabase.createClient),
// senão dá erro de usar o nome antes dele existir.
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Enviar um novo trabalho (arquivo + informações) ----------
async function enviarPDF() {
  const nome = document.getElementById('nome-trabalho').value;
  const descricao = document.getElementById('descricao-trabalho').value;
  const colaboradores = document.getElementById('colaboradores-trabalho').value;
  const input = document.getElementById('arquivo-trabalho');

  if (input.files.length === 0) {
    alert("Selecione um arquivo PDF primeiro!");
    return;
  }

  const arquivo = input.files[0];
  const nomeUnico = Date.now() + "_" + arquivo.name; // evita nomes repetidos

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

  // 3. Guarda as informações (nome, descrição, colaboradores, link do arquivo) na tabela
  const { error: erroTabela } = await supabaseClient
    .from('trabalhos')
    .insert([
      {
        nome: nome,
        descricao: descricao,
        colaboradores: colaboradores,
        arquivo_url: urlData.publicUrl
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
}

// ---------- Listar todos os trabalhos enviados ----------
async function listarPDFs() {
  const container = document.getElementById('listaPDFs');
  if (!container) return; // essa função só roda na página que tiver essa div

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
    const coluna = document.createElement('div');
    coluna.className = 'col-md-4';
    coluna.innerHTML = `
      <div class="card h-100">
        <div class="card-body">
          <h5 class="card-title">${trabalho.nome}</h5>
          <p class="card-text">${trabalho.descricao}</p>
          <p class="card-text"><small class="text-muted">Colaboradores: ${trabalho.colaboradores}</small></p>
          <a href="${trabalho.arquivo_url}" target="_blank" class="btn btn-primary btn-sm">
            <i class="bi bi-file-earmark-pdf"></i> Abrir PDF
          </a>
        </div>
      </div>
    `;
    container.appendChild(coluna);
  });
}

// Chama a listagem automaticamente quando a página carrega
// (não dá problema chamar em toda página, porque a função já checa se a div existe)
listarPDFs();