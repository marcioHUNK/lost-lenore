const URL_BASE = "https://github.com/marcioHUNK/lost-lenore/raw/refs/heads/master/documentos/";

function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}

async function carregarNpcs() {
  //const resposta = await fetch("documentos/npc.docx");
  const resposta = await fetch(URL_BASE + "npc.docx");
  const buffer = await resposta.arrayBuffer();
  const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer });

  const container = document.getElementById("conteudo-npcs");
  container.innerHTML = resultado.value;

  const headings = container.querySelectorAll("h1, h2, h3");
  headings.forEach((heading) => {
    heading.id = gerarSlug(heading.textContent);
  });

  const secoes = agruparEmSecoes(container);
  montarCabecalhoComImagem(secoes);
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
      secaoAtual.classList.add("npc-secao");
      secaoAtual.dataset.npc = el.id;
      secoes.push(secaoAtual);
    }
    if (secaoAtual) {
      secaoAtual.appendChild(el);
    }
  });

  container.innerHTML = "";
  secoes.forEach((secao) => container.appendChild(secao));

  return secoes;
}

function montarCabecalhoComImagem(secoes) {
  secoes.forEach((secao) => {
    const heading = secao.querySelector("h1, h2, h3");
    const slug = secao.dataset.npc;

    const cabecalho = document.createElement("div");
    cabecalho.classList.add("npc-cabecalho");

    const imagem = document.createElement("img");
    imagem.src = `assets/npcs/${slug}.png`;
    imagem.alt = heading.textContent;
    imagem.classList.add("npc-imagem");
    imagem.onerror = () => {
      imagem.style.display = "none";
    };

    cabecalho.appendChild(imagem);
    cabecalho.appendChild(heading);

    secao.prepend(cabecalho);
  });
}

function criarLinkVerTodos() {
  const container = document.getElementById("conteudo-npcs");
  const link = document.createElement("a");
  link.href = "npcs.html";
  link.textContent = "← Ver todos os NPCs";
  link.id = "link-ver-todos";
  container.parentNode.insertBefore(link, container);
}

function aplicarFiltro() {
  const hash = window.location.hash.replace("#", "");
  const secoes = document.querySelectorAll(".npc-secao");
  const linkVerTodos = document.getElementById("link-ver-todos");

  if (!hash) {
    secoes.forEach((s) => (s.style.display = "block"));
    if (linkVerTodos) linkVerTodos.style.display = "none";
    return;
  }

  secoes.forEach((secao) => {
    secao.style.display = secao.dataset.npc === hash ? "block" : "none";
  });
  if (linkVerTodos) linkVerTodos.style.display = "inline-block";
}

carregarNpcs();