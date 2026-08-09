const GOOGLE_DOCS_IDS = {
  "historia.docx": "1etVlnKLC1AkMwa27NIwCgx7d7pwktxu_T9-fGMvT2dE",
  "locais.docx": "19qfFxez5tLbouazw3KE0Ttf2XCdYaazUMoSSDAKBRmc",
  "npc.docx": "1jnKbHo_AyEM8whNhSYNXUuW4rxIpoZVSmb2xcEEdzZk"
};

const CORS_PROXY_KEY = "db36ad33";

function urlDoDocx(nomeArquivo) {
  const id = GOOGLE_DOCS_IDS[nomeArquivo];
  const urlExport = `https://docs.google.com/document/d/${id}/export?format=docx&_=${Date.now()}`;
  return `https://corsproxy.io/?key=${CORS_PROXY_KEY}&url=${encodeURIComponent(urlExport)}`;
}

function gerarSlug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-");
}


function corrigirLinksLocais(container) {
  const links = container.querySelectorAll("a");
  links.forEach((link) => {
    const hrefOriginal = link.getAttribute("href");
    if (!hrefOriginal) return;
    try {
      const url = new URL(hrefOriginal);
      if (/\.html$/i.test(url.hostname)) {
        const caminho = url.pathname === "/" ? "" : url.pathname;
        link.setAttribute("href", `${window.location.origin}/${url.hostname}${caminho}${url.search}${url.hash}`);
      }
    } catch (e) {
    }
  });
}

async function carregarNpcs() {
  const container = document.getElementById("conteudo-npcs");
  try {
    const resposta = await fetch(urlDoDocx("npc.docx"), { cache: "no-store" });
    if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao buscar npc.docx`);
    const buffer = await resposta.arrayBuffer();
    const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer });

    container.innerHTML = resultado.value;
        const links = container.querySelectorAll("a");
    links.forEach((link) => {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });

    const headings = container.querySelectorAll("h1, h2, h3");
    headings.forEach((heading) => {
      heading.id = gerarSlug(heading.textContent);
    });

    const secoes = agruparEmSecoes(container);
    corrigirLinksLocais(container);
    montarCabecalhoComImagem(secoes);
    criarLinkVerTodos();
    aplicarFiltro();
  } catch (erro) {
    console.error(erro);
    container.innerHTML = "<p>Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>";
  }
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