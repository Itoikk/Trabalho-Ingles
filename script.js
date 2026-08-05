const SUPABASE_URL = "https://caajxkxpvlleiilwayzi.supabase.co/rest/v1/";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhYWp4a3hwdmxsZWlpbHdheXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5NjE3NTksImV4cCI6MjEwMTUzNzc1OX0.vYboyaDIsNonsZ1kiTRGiKzIesrJOz6WLcIpEffZjXU";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
async function listarPDFs() {
    const container = document.getElementById('listaPDFs');

    // Busca a lista de arquivos na pasta pública 'arquivos-pdf'
    const { data, error } = await supabase.storage.from('arquivos-pdf').list();

    if (error || !data || data.length === 0) {
        container.innerHTML = "<p>Nenhum PDF enviado ainda.</p>";
        return;
    }

    container.innerHTML = "";
    data.forEach(arquivo => {
        // Gera o link público que funciona em qualquer computador
        const { data: urlData } = supabase.storage.from('arquivos-pdf').getPublicUrl(arquivo.name);

        const item = document.createElement('div');
        item.className = 'pdf-item';
        item.innerHTML = `
                    <span>📄 ${arquivo.name}</span>
                    <a href="${urlData.publicUrl}" target="_blank">Abrir PDF</a>
                `;
        container.appendChild(item);
    });
}
async function enviarPDF() {
    const input = document.getElementById('pdfInput');
    if (input.files.length === 0) return alert("Selecione um arquivo primeiro!");

    const arquivo = input.files[0];
    const nomeUnico = Date.now() + "_" + arquivo.name; // Evita arquivos com nomes repetidos

    // Faz o upload direto para o servidor
    const { error } = await supabase.storage.from('arquivos-pdf').upload(nomeUnico, arquivo);

    if (error) {
        alert("Erro ao enviar: " + error.message);
    } else {
        alert("PDF enviado com sucesso! Visível em qualquer PC.");
        input.value = ""; // Limpa o campo
        listarPDFs(); // Atualiza a lista na tela
    }
}
listarPDFs();