const URL_BASE = "https://github.com/marcioHUNK/lost-lenore/raw/refs/heads/master/documentos/";

function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

async function carregarDocx(caminhoArquivo, idDestino) {
  const resposta = await fetch(URL_BASE + caminhoArquivo);
  const buffer = await resposta.arrayBuffer();

  const opcoes = {
    styleMap: [
      "r[style-name='comentários do mestre'] => span.destaque"
    ]
  };

  const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer }, opcoes);

  const container = document.getElementById(idDestino);
  container.innerHTML = resultado.value;

  const links = container.querySelectorAll("a");
  links.forEach((link) => {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

async function carregarListaNpc() {
  // CORREÇÃO AQUI: agora usa URL_BASE + "npc.docx"
  const resposta = await fetch(URL_BASE + "npc.docx");
  const buffer = await resposta.arrayBuffer();
  const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer });

  const temp = document.createElement("div");
  temp.innerHTML = resultado.value;

  const headings = temp.querySelectorAll("h1, h2, h3, h4, h5, h6");

  const lista = document.createElement("ul");
  headings.forEach((heading) => {
    const slug = gerarSlug(heading.textContent);

    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = `npcs.html#${slug}`;
    link.textContent = heading.textContent;
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    item.appendChild(link);
    lista.appendChild(item);
  });

  const destino = document.getElementById("nome-npc");
  destino.innerHTML = "";
  destino.appendChild(lista);
}

// CORREÇÃO AQUI: tirei o "documentos/"
carregarDocx("historia.docx", "historia");
carregarListaNpc();