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

// O Google Docs transforma links relativos digitados (ex: "locais.html#slug")
// em URLs absolutas inválidas (ex: "http://locais.html/#slug"), pois não
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
    }
  });
}

async function carregarDocx(caminhoArquivo, idDestino) {
  const container = document.getElementById(idDestino);
  try {
    const resposta = await fetch(urlDoDocx(caminhoArquivo), { cache: "no-store" });
    if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao buscar ${caminhoArquivo}`);
    const buffer = await resposta.arrayBuffer();

    const opcoes = {
      styleMap: [
        "r[style-name='comentários do mestre'] => span.destaque"
      ]
    };

    const resultado = await mammoth.convertToHtml({ arrayBuffer: buffer }, opcoes);

    container.innerHTML = resultado.value;

    const links = container.querySelectorAll("a");
    links.forEach((link) => {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
    corrigirLinksLocais(container);
  } catch (erro) {
    console.error(erro);
    container.innerHTML = "<p>Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>";
  }
}

async function carregarListaNpc() {
  const resposta = await fetch(urlDoDocx("npc.docx"), { cache: "no-store" });
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