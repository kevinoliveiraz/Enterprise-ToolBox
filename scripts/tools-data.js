/**
 * TOOLS-DATA.JS
 * Fonte única de verdade sobre as ferramentas do Enterprise ToolBox.
 *
 * Cada ferramenta aponta para um arquivo <slug>.html na raiz do projeto,
 * que por sua vez carrega styles/<slug>.css e scripts/<slug>.js
 *
 * Para adicionar uma ferramenta nova:
 *  1. Crie <slug>.html (raiz), styles/<slug>.css, scripts/<slug>.js
 *  2. Adicione um objeto aqui com o mesmo slug
 *  3. Ela aparece automaticamente no index
 *     (categoria + busca + acesso rápido se quickAccess:true)
 */

const CATEGORIES = [
  {
    id: "desenvolvimento",
    label: "Desenvolvimento",
    icon: "code"
  },
  {
    id: "documentos",
    label: "Documentos",
    icon: "doc"
  },
  {
    id: "dados",
    label: "Dados & Planilhas",
    icon: "sheet"
  },
  {
    id: "conversores",
    label: "Conversores",
    icon: "swap"
  },
  {
    id: "devops",
    label: "DevOps & Infra",
    icon: "server"
  },
  {
    id: "seguranca",
    label: "Segurança",
    icon: "shield"
  },
  {
    id: "produtividade",
    label: "Produtividade",
    icon: "check"
  },
  {
    id: "marketing",
    label: "Marketing & SEO",
    icon: "chart"
  },
  {
    id: "utilitarios",
    label: "Utilitários",
    icon: "wrench"
  },
  {
    id: "ia",
    label: "IA & Pesquisa",
    icon: "star"
  }
];


/* ============================================================
   FERRAMENTAS
   ============================================================ */

const TOOLS = [

  /* ==========================================================
     DESENVOLVIMENTO
     ========================================================== */

  {
    slug: "teste-de-codigo",
    name: "Testador de Código",
    desc: "HTML, CSS, JS, Python, PHP...",
    category: "desenvolvimento",
    icon: "code",
    quickAccess: true,
    ready: true
  },

  {
    slug: "formatar-json",
    name: "Formatar JSON",
    desc: "Valide e formate seu JSON",
    category: "desenvolvimento",
    icon: "braces",
    quickAccess: true,
    ready: false
  },


  /* ==========================================================
     DADOS & PLANILHAS
     ========================================================== */

  {
    slug: "testador-de-excel",
    name: "Testador de Excel",
    desc: "Valide fórmulas e analise dados",
    category: "dados",
    icon: "sheet",
    quickAccess: true,
    ready: false
  },

  {
    slug: "unir-planilhas",
    name: "Unir Planilhas",
    desc: "Combine várias planilhas em uma só",
    category: "dados",
    icon: "sheet",
    quickAccess: false,
    ready: false
  },


  /* ==========================================================
     CONVERSORES
     ========================================================== */

  {
    slug: "conversor-markdown",
    name: "Conversor Markdown",
    desc: "Converta documentos, dados, imagens e texto para .md",
    category: "conversores",
    icon: "doc",
    quickAccess: true,
    ready: true
  },

  {
    slug: "conversor-de-documentos",
    name: "Conversor de Documentos",
    desc: "PDF, Word, Excel, PPT e mais",
    category: "conversores",
    icon: "doc",
    quickAccess: true,
    ready: false
  },


  /* ==========================================================
     UTILITÁRIOS
     ========================================================== */

  {
    slug: "remover-fundo",
    name: "Remover Fundo",
    desc: "Remova o fundo de imagens com IA",
    category: "utilitarios",
    icon: "image",
    quickAccess: true,
    ready: true
  },

  {
    slug: "gerador-de-qrcode",
    name: "Gerador de QR Code",
    desc: "Crie QR Codes personalizados",
    category: "utilitarios",
    icon: "qrcode",
    quickAccess: true,
    ready: true
  },

  {
    slug: "compressor-de-imagens",
    name: "Compressor de Imagens",
    desc: "Reduza o tamanho sem perder qualidade",
    category: "utilitarios",
    icon: "image",
    quickAccess: true,
    ready: false
  }

];


/* ============================================================
   CONTAGEM EXIBIDA NAS CATEGORIAS

   Enquanto as categorias ainda possuem poucas ferramentas reais,
   os números permanecem configuráveis manualmente.

   Conforme o Enterprise ToolBox crescer, podemos substituir isso
   posteriormente por uma contagem automática baseada em TOOLS.
   ============================================================ */

const CATEGORY_DISPLAY_COUNT = {
  desenvolvimento: 18,
  documentos: 14,
  dados: 16,
  conversores: 23,
  devops: 12,
  seguranca: 15,
  produtividade: 20,
  marketing: 13,
  utilitarios: 19,
  ia: 11
};
