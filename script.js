// ============================================================
// CONFIGURAÇÃO
// ============================================================

const GOOGLE_DOCS_IDS = {
    "historia.docx": "1etVlnKLC1AkMwa27NIwCgx7d7pwktxu_T9-fGMvT2dE",
    "locais.docx": "19qfFxez5tLbouazw3KE0Ttf2XCdYaazUMoSSDAKBRmc",
    "npc.docx": "1jnKbHo_AyEM8whNhSYNXUuW4rxIpoZVSmb2xcEEdzZk"
};

const CORS_PROXY_KEY = "db36ad33";

// Intervalo de verificação.
// 15 segundos = 15000 ms
const INTERVALO_ATUALIZACAO = 1500;


// ============================================================
// CONTROLE DAS VERSÕES DOS DOCUMENTOS
// ============================================================

// Guarda uma assinatura do conteúdo que foi carregado.
// Assim não substituímos o HTML se nada tiver mudado.
const versoesDocumentos = {};


// Evita que uma nova verificação comece enquanto a anterior
// ainda estiver carregando.
let verificacaoEmAndamento = false;


// ============================================================
// URL DO GOOGLE DOCS
// ============================================================

function urlDoDocx(nomeArquivo) {

    const id = GOOGLE_DOCS_IDS[nomeArquivo];

    if (!id) {
        throw new Error(`Documento não encontrado: ${nomeArquivo}`);
    }

    const urlExport =
        `https://docs.google.com/document/d/${id}/export?format=docx&_=${Date.now()}`;

    return `https://corsproxy.io/?key=${CORS_PROXY_KEY}&url=${encodeURIComponent(urlExport)}`;
}


// ============================================================
// GERA SLUG PARA NPC
// ============================================================

function gerarSlug(texto) {

    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/[^a-z0-9]+/g, "-");
}


// ============================================================
// CORRIGE LINKS DO GOOGLE DOCS
// ============================================================

function corrigirLinksLocais(container) {

    const links = container.querySelectorAll("a");

    links.forEach((link) => {

        const hrefOriginal = link.getAttribute("href");

        if (!hrefOriginal) return;

        try {

            const url = new URL(hrefOriginal);

            // O Google Docs pode transformar:
            //
            // locais.html#cidade
            //
            // em:
            //
            // http://locais.html/#cidade

            if (/\.html$/i.test(url.hostname)) {

                const caminho =
                    url.pathname === "/" ? "" : url.pathname;

                link.setAttribute(
                    "href",
                    `${window.location.origin}/${url.hostname}${caminho}${url.search}${url.hash}`
                );
            }

        } catch (e) {
            // Ignora links que não possam ser interpretados
        }

    });
}


// ============================================================
// CRIA ASSINATURA DO DOCUMENTO
// ============================================================

async function gerarAssinatura(buffer) {

    // SHA-256 cria uma "impressão digital" do arquivo.
    // Se o documento mudar, a assinatura muda.

    const hashBuffer =
        await crypto.subtle.digest("SHA-256", buffer);

    const hashArray =
        Array.from(new Uint8Array(hashBuffer));

    return hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}


// ============================================================
// CARREGA UM DOCUMENTO DOCX
// ============================================================

async function carregarDocx(
    caminhoArquivo,
    idDestino,
    forcarAtualizacao = false
) {

    const container = document.getElementById(idDestino);

    if (!container) {
        console.warn(`Elemento #${idDestino} não encontrado.`);
        return false;
    }

    try {

        const resposta = await fetch(
            urlDoDocx(caminhoArquivo),
            {
                cache: "no-store"
            }
        );

        if (!resposta.ok) {

            throw new Error(
                `Erro ${resposta.status} ao buscar ${caminhoArquivo}`
            );
        }

        const buffer = await resposta.arrayBuffer();

        // Calcula a impressão digital do documento
        const novaVersao = await gerarAssinatura(buffer);

        // Se não mudou, não fazemos absolutamente nada.
        if (
            !forcarAtualizacao &&
            versoesDocumentos[caminhoArquivo] === novaVersao
        ) {

            return false;
        }


        // ====================================================
        // CONVERSÃO DOCX → HTML
        // ====================================================

        const opcoes = {

            styleMap: [
                "r[style-name='comentários do mestre'] => span.destaque"
            ]

        };

        const resultado =
            await mammoth.convertToHtml(
                { arrayBuffer: buffer },
                opcoes
            );


        // ====================================================
        // ATUALIZA O SITE
        // ====================================================

        container.innerHTML = resultado.value;


        // ====================================================
        // CONFIGURAÇÃO DOS LINKS
        // ====================================================

        const links =
            container.querySelectorAll("a");

        links.forEach((link) => {

            link.target = "_blank";
            link.rel = "noopener noreferrer";

        });


        corrigirLinksLocais(container);


        // Guarda a nova versão
        versoesDocumentos[caminhoArquivo] = novaVersao;


        console.log(
            `📖 ${caminhoArquivo} atualizado automaticamente.`
        );


        return true;

    } catch (erro) {

        console.error(
            `Erro ao carregar ${caminhoArquivo}:`,
            erro
        );

        // Só mostra erro se ainda não houver conteúdo.
        // Assim, se o Google estiver temporariamente indisponível,
        // o texto anterior continua na tela.

        if (!container.innerHTML.trim()) {

            container.innerHTML =
                "<p>Não foi possível carregar o conteúdo. Tente novamente mais tarde.</p>";
        }

        return false;
    }
}


// ============================================================
// CARREGA LISTA DE NPCs
// ============================================================

async function carregarListaNpc(
    forcarAtualizacao = false
) {

    const destino =
        document.getElementById("nome-npc");

    if (!destino) {

        console.warn(
            "Elemento #nome-npc não encontrado."
        );

        return false;
    }


    try {

        const resposta =
            await fetch(
                urlDoDocx("npc.docx"),
                {
                    cache: "no-store"
                }
            );


        if (!resposta.ok) {

            throw new Error(
                `Erro ${resposta.status} ao buscar npc.docx`
            );
        }


        const buffer =
            await resposta.arrayBuffer();


        // Verifica se o documento mudou
        const novaVersao =
            await gerarAssinatura(buffer);


        if (
            !forcarAtualizacao &&
            versoesDocumentos["npc.docx"] === novaVersao
        ) {

            return false;
        }


        // ====================================================
        // CONVERTE NPC.DOCX
        // ====================================================

        const resultado =
            await mammoth.convertToHtml(
                {
                    arrayBuffer: buffer
                }
            );


        // Criamos um elemento temporário
        const temp =
            document.createElement("div");

        temp.innerHTML =
            resultado.value;


        // ====================================================
        // ENCONTRA OS TÍTULOS DOS NPCs
        // ====================================================

        const headings =
            temp.querySelectorAll(
                "h1, h2, h3, h4, h5, h6"
            );


        const lista =
            document.createElement("ul");


        headings.forEach((heading) => {

            const nomeNpc =
                heading.textContent.trim();

            if (!nomeNpc) return;


            const slug =
                gerarSlug(nomeNpc);


            const item =
                document.createElement("li");


            const link =
                document.createElement("a");


            link.href =
                `npcs.html#${slug}`;

            link.textContent =
                nomeNpc;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";


            item.appendChild(link);

            lista.appendChild(item);

        });


        // ====================================================
        // ATUALIZA A LISTA
        // ====================================================

        destino.innerHTML = "";

        destino.appendChild(lista);


        // Guarda a versão
        versoesDocumentos["npc.docx"] =
            novaVersao;


        console.log(
            "👤 Lista de NPCs atualizada automaticamente."
        );


        return true;


    } catch (erro) {

        console.error(
            "Erro ao carregar NPCs:",
            erro
        );

        return false;
    }
}


// ============================================================
// ATUALIZA TODOS OS DOCUMENTOS
// ============================================================

async function atualizarDocumentos(
    forcarAtualizacao = false
) {

    // Evita duas verificações acontecendo ao mesmo tempo.
    if (verificacaoEmAndamento) {
        return;
    }

    verificacaoEmAndamento = true;


    try {

        await Promise.all([

            // História
            carregarDocx(
                "historia.docx",
                "historia",
                forcarAtualizacao
            ),

            // Locais
            carregarDocx(
                "locais.docx",
                "locais",
                forcarAtualizacao
            ),

            // NPCs
            carregarListaNpc(
                forcarAtualizacao
            )

        ]);

    } catch (erro) {

        console.error(
            "Erro durante atualização dos documentos:",
            erro
        );

    } finally {

        verificacaoEmAndamento = false;
    }
}


// ============================================================
// PRIMEIRO CARREGAMENTO
// ============================================================

console.log(
    "📚 Minha Eleonora Perdida"
);

console.log(
    "🔄 Sistema de atualização automática iniciado."
);


// Carrega tudo imediatamente
atualizarDocumentos(true);


// ============================================================
// ATUALIZAÇÃO AUTOMÁTICA
// ============================================================

// A cada 15 segundos verifica se algum Google Docs mudou.
//
// Importante:
// o site NÃO recarrega.
// Apenas o conteúdo que mudou é substituído.

setInterval(() => {

    atualizarDocumentos(false);

}, INTERVALO_ATUALIZACAO);