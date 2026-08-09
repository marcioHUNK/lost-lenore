// IDs dos documentos do Google Docs (pegue da URL de cada doc: .../document/d/ESSE_ID/edit)
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

// O Google Docs transforma links relativos digitados (ex: "npcs.html#slug")
// em URLs absolutas inválidas (ex: "http://npcs.html/#slug"), pois não
// reconhece caminhos relativos. Esta função detecta esse padrão (host
// terminando em .html) e reescreve o link para apontar corretamente para
// o endereço local atual, seja qual for a porta do Live Server.
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
      // href relativo ou inválido: deixa como está
    }
  });
}

async function carregarLocais() {
  const container = document.getElementById("conteudo-locais");
  try {
    const resposta = await fetch(urlDoDocx("locais.docx"), { cache: "no-store" });
    if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao buscar locais.docx`);
    const buffer = await resposta.arrayBuffer();

    const opcoes = {
      styleMap: [
        "r[style-name='comentários do mestre'] => span.destaque"
      ]
    };

    const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer }, opcoes);

    container.innerHTML = resultado.value;

    const headings = container.querySelectorAll("h1, h2, h3");
    headings.forEach((heading) => {
      heading.id = gerarSlug(heading.textContent);
    });

    agruparEmSecoes(container);
    corrigirLinksLocais(container);
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