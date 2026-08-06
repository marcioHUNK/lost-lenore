const URL_BASE = "https://github.com/marcioHUNK/lost-lenore/raw/refs/heads/master/documentos/";



function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

async function carregarLocais() {
  //const resposta = await fetch("documentos/locais.docx");
   const resposta = await fetch(URL_BASE + "locais.docx");
  const buffer = await resposta.arrayBuffer();

  const opcoes = {
    styleMap: [
      "r[style-name='comentários do mestre'] => span.destaque"
    ]
  };

  const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer }, opcoes);

  const container = document.getElementById("conteudo-locais");
  container.innerHTML = resultado.value;

  const headings = container.querySelectorAll("h1, h2, h3");
  headings.forEach((heading) => {
    heading.id = gerarSlug(heading.textContent);
  });

  agruparEmSecoes(container);
  criarLinkVerTodos();
  aplicarFiltro();
}

function agruparEmSecoes(container) {
  const elementos = Array.from(container.children);
  const secoes = [];
  let secaoAtual = null;

  elementos.forEach((el) => {
    if (["H1", "H2", "H3"].includes(el.tagName)) {
      secaoAtual = document.createElement("section");
      secaoAtual.classList.add("local-secao");
      secaoAtual.dataset.local = el.id;
      secoes.push(secaoAtual);
    }
    if (secaoAtual) {
      secaoAtual.appendChild(el);
    }
  });

  container.innerHTML = "";
  secoes.forEach((secao) => container.appendChild(secao));
}

function criarLinkVerTodos() {
  const container = document.getElementById("conteudo-locais");
  const link = document.createElement("a");
  link.href = "locais.html";
  link.textContent = "← Ver todos os locais";
  link.id = "link-ver-todos";
  container.parentNode.insertBefore(link, container);
}

function aplicarFiltro() {
  const hash = window.location.hash.replace("#", "");
  const secoes = document.querySelectorAll(".local-secao");
  const linkVerTodos = document.getElementById("link-ver-todos");

  if (!hash) {
    secoes.forEach((s) => (s.style.display = "block"));
    if (linkVerTodos) linkVerTodos.style.display = "none";
    return;
  }

  secoes.forEach((secao) => {
    secao.style.display = secao.dataset.local === hash ? "block" : "none";
  });
  if (linkVerTodos) linkVerTodos.style.display = "inline-block";
}

carregarLocais();