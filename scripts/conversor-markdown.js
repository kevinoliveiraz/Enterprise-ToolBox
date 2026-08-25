/* ============================================================
   CONVERSOR-MARKDOWN.JS
   Conversão local para Markdown.
   Dependências carregadas no HTML:
   PDF.js, Mammoth.js, Turndown, SheetJS e Tesseract.js
   ============================================================ */

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const selectedFileBox = document.getElementById("selectedFile");
const fileTypeBadge = document.getElementById("fileTypeBadge");
const fileName = document.getElementById("fileName");
const fileMeta = document.getElementById("fileMeta");
const removeFileBtn = document.getElementById("removeFileBtn");
const convertFileBtn = document.getElementById("convertFileBtn");

const urlInput = document.getElementById("urlInput");
const convertUrlBtn = document.getElementById("convertUrlBtn");

const textInput = document.getElementById("textInput");
const convertTextBtn = document.getElementById("convertTextBtn");

const processingBox = document.getElementById("processingBox");
const processingTitle = document.getElementById("processingTitle");
const processingStatus = document.getElementById("processingStatus");
const progressBar = document.getElementById("progressBar");

const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

const resultCard = document.getElementById("resultCard");
const resultTitle = document.getElementById("resultTitle");
const resultDescription = document.getElementById("resultDescription");
const markdownOutput = document.getElementById("markdownOutput");
const charCount = document.getElementById("charCount");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");

const sourceTabs = [...document.querySelectorAll(".source-tab")];
const sourcePanels = [...document.querySelectorAll("[data-source-panel]")];

let selectedFile = null;
let currentMarkdown = "";
let outputFileName = "conteudo.md";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**"
});

turndown.addRule("removeScriptStyle", {
  filter: ["script", "style", "noscript"],
  replacement: () => ""
});

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js";
}

/* ============================================================
   UI
   ============================================================ */

sourceTabs.forEach(tab => {
  tab.addEventListener("click", () => setSource(tab.dataset.source));
});

function setSource(source) {
  sourceTabs.forEach(tab => {
    const active = tab.dataset.source === source;

    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });

  sourcePanels.forEach(panel => {
    const active =
      panel.dataset.sourcePanel === source;

    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });

  hideError();
}

function setProcessing(
  active,
  title = "Convertendo...",
  status = "Preparando conteúdo",
  progress = 8
) {
  processingBox.hidden = !active;

  if (active) {
    processingTitle.textContent = title;
    processingStatus.textContent = status;
    setProgress(progress);
  }
}

function setProgress(value, status) {
  progressBar.style.width =
    `${Math.max(3, Math.min(100, value))}%`;

  if (status) {
    processingStatus.textContent = status;
  }
}

function showError(message) {
  setProcessing(false);

  errorMessage.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorBox.hidden = true;
  errorMessage.textContent = "";
}

function showResult(
  markdown,
  title,
  description,
  filename
) {
  currentMarkdown =
    normalizeMarkdown(markdown);

  outputFileName =
    sanitizeFilename(
      filename || "conteudo.md"
    );

  markdownOutput.value =
    currentMarkdown;

  resultTitle.textContent =
    title || "Markdown gerado";

  resultDescription.textContent =
    description || outputFileName;

  updateCharCount();

  resultCard.hidden = false;

  setProcessing(false);
  hideError();

  resultCard.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
}

markdownOutput.addEventListener(
  "input",
  () => {
    currentMarkdown =
      markdownOutput.value;

    updateCharCount();
  }
);

function updateCharCount() {
  const count =
    markdownOutput.value.length;

  charCount.textContent =
    `${count.toLocaleString("pt-BR")} ${
      count === 1
        ? "caractere"
        : "caracteres"
    }`;
}

/* ============================================================
   ARQUIVOS
   ============================================================ */

dropZone.addEventListener(
  "click",
  () => fileInput.click()
);

dropZone.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault();

      fileInput.click();
    }
  }
);

["dragenter", "dragover"].forEach(type => {
  dropZone.addEventListener(
    type,
    event => {
      event.preventDefault();

      dropZone.classList.add(
        "dragging"
      );
    }
  );
});

["dragleave", "drop"].forEach(type => {
  dropZone.addEventListener(
    type,
    event => {
      event.preventDefault();

      dropZone.classList.remove(
        "dragging"
      );
    }
  );
});

dropZone.addEventListener(
  "drop",
  event => {
    const file =
      event.dataTransfer?.files?.[0];

    if (file) {
      selectFile(file);
    }
  }
);

fileInput.addEventListener(
  "change",
  () => {
    const file =
      fileInput.files?.[0];

    if (file) {
      selectFile(file);
    }
  }
);

removeFileBtn.addEventListener(
  "click",
  resetFile
);

convertFileBtn.addEventListener(
  "click",
  async () => {
    if (!selectedFile) return;

    await convertFile(selectedFile);
  }
);

function selectFile(file) {
  const ext =
    getExtension(file.name);

  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    showError(
      `Formato .${
        ext || "desconhecido"
      } não suportado.`
    );

    return;
  }

  selectedFile = file;

  hideError();

  dropZone.hidden = true;
  selectedFileBox.hidden = false;

  fileTypeBadge.textContent =
    (ext || "FILE")
      .slice(0, 5)
      .toUpperCase();

  fileName.textContent =
    file.name;

  fileMeta.textContent =
    `${formatBytes(file.size)} · ${formatLabel(ext)}`;

  convertFileBtn.disabled = false;
}

function resetFile() {
  selectedFile = null;

  fileInput.value = "";

  dropZone.hidden = false;
  selectedFileBox.hidden = true;

  convertFileBtn.disabled = true;

  hideError();
}

/* ============================================================
   CONVERSÃO DE ARQUIVOS
   ============================================================ */

const SUPPORTED_EXTENSIONS =
  new Set([
    "pdf",
    "docx",
    "rtf",
    "txt",
    "csv",
    "xlsx",
    "xls",
    "json",
    "xml",
    "html",
    "htm",
    "png",
    "jpg",
    "jpeg",
    "webp",
    "srt",
    "vtt",
    "md",
    "markdown"
  ]);

async function convertFile(file) {
  const ext =
    getExtension(file.name);

  hideError();

  setProcessing(
    true,
    "Convertendo arquivo",
    `Lendo ${formatLabel(ext)}...`,
    8
  );

  try {
    let markdown = "";

    switch (ext) {
      case "pdf":
        markdown =
          await convertPdf(file);
        break;

      case "docx":
        markdown =
          await convertDocx(file);
        break;

      case "rtf":
        markdown =
          await convertRtf(file);
        break;

      case "txt":
        markdown =
          await convertPlainText(file);
        break;

      case "csv":
        markdown =
          await convertCsv(file);
        break;

      case "xlsx":
      case "xls":
        markdown =
          await convertWorkbook(file);
        break;

      case "json":
        markdown =
          await convertJson(file);
        break;

      case "xml":
        markdown =
          await convertXml(file);
        break;

      case "html":
      case "htm":
        markdown =
          await convertHtmlFile(file);
        break;

      case "png":
      case "jpg":
      case "jpeg":
      case "webp":
        markdown =
          await convertImage(file);
        break;

      case "srt":
      case "vtt":
        markdown =
          await convertSubtitle(
            file,
            ext
          );
        break;

      case "md":
      case "markdown":
        markdown =
          await file.text();
        break;

      default:
        throw new Error(
          `Formato .${ext} não suportado.`
        );
    }

    if (!markdown.trim()) {
      throw new Error(
        "Nenhum conteúdo legível foi encontrado nesse arquivo."
      );
    }

    setProgress(
      100,
      "Concluído"
    );

    showResult(
      markdown,
      `${formatLabel(ext)} convertido`,
      `${file.name} → Markdown`,
      `${stripExtension(file.name)}.md`
    );

  } catch (error) {
    console.error(
      "[Conversor Markdown]",
      error
    );

    showError(
      humanizeError(error)
    );
  }
}

/* ============================================================
   PDF
   ============================================================ */

async function convertPdf(file) {
  requireGlobal(
    "pdfjsLib",
    "PDF.js"
  );

  const buffer =
    await file.arrayBuffer();

  setProgress(
    15,
    "Abrindo PDF..."
  );

  const pdf =
    await pdfjsLib
      .getDocument({
        data: buffer
      })
      .promise;

  const parts = [];

  for (
    let pageNumber = 1;
    pageNumber <= pdf.numPages;
    pageNumber++
  ) {
    const page =
      await pdf.getPage(
        pageNumber
      );

    const content =
      await page.getTextContent();

    const text =
      pdfItemsToText(
        content.items
      );

    if (text.trim()) {
      if (pdf.numPages > 1) {
        parts.push(
          `## Página ${pageNumber}\n\n${text.trim()}`
        );
      } else {
        parts.push(
          text.trim()
        );
      }
    }

    setProgress(
      15 +
        Math.round(
          (pageNumber / pdf.numPages) *
            75
        ),
      `Extraindo texto · página ${pageNumber} de ${pdf.numPages}`
    );
  }

  return parts.join(
    "\n\n---\n\n"
  );
}

function pdfItemsToText(items) {
  let result = "";
  let lastY = null;

  for (const item of items) {
    const y =
      item.transform?.[5];

    if (
      lastY !== null &&
      y !== undefined &&
      Math.abs(y - lastY) > 4
    ) {
      result += "\n";

    } else if (
      result &&
      !result.endsWith("\n")
    ) {
      result += " ";
    }

    result += item.str || "";

    if (y !== undefined) {
      lastY = y;
    }
  }

  return cleanupExtractedText(
    result
  );
}

/* ============================================================
   DOCX
   ============================================================ */

async function convertDocx(file) {
  requireGlobal(
    "mammoth",
    "Mammoth.js"
  );

  const buffer =
    await file.arrayBuffer();

  setProgress(
    25,
    "Extraindo conteúdo do Word..."
  );

  const result =
    await mammoth.convertToHtml({
      arrayBuffer: buffer
    });

  setProgress(
    75,
    "Convertendo estrutura para Markdown..."
  );

  return htmlToMarkdown(
    result.value
  );
}

/* ============================================================
   RTF
   ============================================================ */

async function convertRtf(file) {
  const raw =
    await file.text();

  setProgress(
    45,
    "Interpretando RTF..."
  );

  return rtfToText(raw);
}

function rtfToText(rtf) {
  let text = rtf;

  text = text.replace(
    /\\'([0-9a-fA-F]{2})/g,
    (_, hex) =>
      String.fromCharCode(
        parseInt(hex, 16)
      )
  );

  text = text.replace(
    /\\u(-?\d+)\??/g,
    (_, num) => {
      let code =
        Number(num);

      if (code < 0) {
        code += 65536;
      }

      return String.fromCharCode(
        code
      );
    }
  );

  text = text
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\line/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\emdash/g, "—")
    .replace(/\\endash/g, "–")
    .replace(/\\bullet/g, "•")
    .replace(
      /\\lquote|\\rquote/g,
      "'"
    )
    .replace(
      /\\ldblquote|\\rdblquote/g,
      '"'
    );

  text = text.replace(
    /\{\\\*[^{}]*\}/g,
    ""
  );

  text = text.replace(
    /\\[a-zA-Z]+-?\d*\s?/g,
    ""
  );

  text = text.replace(
    /[{}]/g,
    ""
  );

  text = text.replace(
    /\\([\\{}])/g,
    "$1"
  );

  return cleanupExtractedText(
    text
  );
}

/* ============================================================
   TXT / TEXTO
   ============================================================ */

async function convertPlainText(file) {
  const text =
    await file.text();

  setProgress(
    65,
    "Organizando texto..."
  );

  return plainTextToMarkdown(
    text,
    stripExtension(file.name)
  );
}

function plainTextToMarkdown(
  text,
  title = ""
) {
  const cleaned =
    cleanupExtractedText(text);

  if (!cleaned) {
    return "";
  }

  const body = cleaned
    .split(/\n{2,}/)
    .map(block =>
      block.trim()
    )
    .filter(Boolean)
    .join("\n\n");

  return title
    ? `# ${escapeMarkdownInline(title)}\n\n${body}`
    : body;
}

/* ============================================================
   CSV / XLSX
   ============================================================ */

async function convertCsv(file) {
  requireGlobal(
    "XLSX",
    "SheetJS"
  );

  const text =
    await file.text();

  setProgress(
    30,
    "Lendo CSV..."
  );

  const workbook =
    XLSX.read(
      text,
      {
        type: "string"
      }
    );

  const sheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const rows =
    XLSX.utils.sheet_to_json(
      sheet,
      {
        header: 1,
        defval: ""
      }
    );

  setProgress(
    75,
    "Criando tabela Markdown..."
  );

  return arrayToMarkdownTable(
    rows
  );
}

async function convertWorkbook(file) {
  requireGlobal(
    "XLSX",
    "SheetJS"
  );

  const buffer =
    await file.arrayBuffer();

  setProgress(
    25,
    "Abrindo planilha..."
  );

  const workbook =
    XLSX.read(
      buffer,
      {
        type: "array"
      }
    );

  const sections = [];

  workbook.SheetNames.forEach(
    (sheetName, index) => {
      const sheet =
        workbook.Sheets[
          sheetName
        ];

      const rows =
        XLSX.utils.sheet_to_json(
          sheet,
          {
            header: 1,
            defval: ""
          }
        );

      const table =
        arrayToMarkdownTable(
          rows
        );

      if (table) {
        sections.push(
          `## ${escapeMarkdownInline(sheetName)}\n\n${table}`
        );
      }

      setProgress(
        25 +
          Math.round(
            ((index + 1) /
              workbook.SheetNames
                .length) *
              65
          ),
        `Convertendo aba ${
          index + 1
        } de ${
          workbook.SheetNames.length
        }`
      );
    }
  );

  return sections.join(
    "\n\n"
  );
}

function arrayToMarkdownTable(
  rows
) {
  const usefulRows = rows
    .map(row =>
      Array
        .from(row || [])
        .map(cell =>
          stringifyCell(cell)
        )
    )
    .filter(row =>
      row.some(
        cell => cell !== ""
      )
    );

  if (!usefulRows.length) {
    return "";
  }

  const columnCount =
    Math.max(
      ...usefulRows.map(
        row => row.length
      )
    );

  const normalized =
    usefulRows.map(row => {
      const copy = [...row];

      while (
        copy.length <
        columnCount
      ) {
        copy.push("");
      }

      return copy;
    });

  const header =
    normalized[0];

  const body =
    normalized.slice(1);

  const headerLine =
    `| ${header
      .map(escapeTableCell)
      .join(" | ")} |`;

  const divider =
    `| ${header
      .map(() => "---")
      .join(" | ")} |`;

  const bodyLines =
    body.map(
      row =>
        `| ${row
          .map(
            escapeTableCell
          )
          .join(" | ")} |`
    );

  return [
    headerLine,
    divider,
    ...bodyLines
  ].join("\n");
}

/* ============================================================
   JSON
   ============================================================ */

async function convertJson(file) {
  const raw =
    await file.text();

  setProgress(
    30,
    "Interpretando JSON..."
  );

  let data;

  try {
    data =
      JSON.parse(raw);

  } catch {
    throw new Error(
      "O arquivo JSON está inválido."
    );
  }

  setProgress(
    70,
    "Criando estrutura Markdown..."
  );

  return jsonToMarkdown(
    data
  );
}

function jsonToMarkdown(
  value,
  level = 1,
  key = null
) {
  const lines = [];

  if (Array.isArray(value)) {
    if (key !== null) {
      lines.push(
        `${"#".repeat(
          Math.min(level, 6)
        )} ${escapeMarkdownInline(
          String(key)
        )}`
      );

      lines.push("");
    }

    value.forEach(
      (item, index) => {
        if (
          isPrimitive(item)
        ) {
          lines.push(
            `- ${formatPrimitive(item)}`
          );

        } else {
          lines.push(
            `${"#".repeat(
              Math.min(
                level + 1,
                6
              )
            )} Item ${index + 1}`
          );

          lines.push("");

          lines.push(
            jsonToMarkdown(
              item,
              level + 2
            )
          );

          lines.push("");
        }
      }
    );

    return lines
      .join("\n")
      .trim();
  }

  if (
    value &&
    typeof value === "object"
  ) {
    if (key !== null) {
      lines.push(
        `${"#".repeat(
          Math.min(level, 6)
        )} ${escapeMarkdownInline(
          String(key)
        )}`
      );

      lines.push("");
    }

    for (
      const [
        childKey,
        childValue
      ] of Object.entries(value)
    ) {
      if (
        isPrimitive(
          childValue
        )
      ) {
        lines.push(
          `- **${escapeMarkdownInline(
            childKey
          )}:** ${formatPrimitive(
            childValue
          )}`
        );

      } else {
        if (
          lines.length &&
          lines.at(-1) !== ""
        ) {
          lines.push("");
        }

        lines.push(
          jsonToMarkdown(
            childValue,
            Math.min(
              level + 1,
              6
            ),
            childKey
          )
        );

        lines.push("");
      }
    }

    return lines
      .join("\n")
      .trim();
  }

  return formatPrimitive(
    value
  );
}

/* ============================================================
   XML
   ============================================================ */

async function convertXml(file) {
  const raw =
    await file.text();

  setProgress(
    30,
    "Interpretando XML..."
  );

  const parser =
    new DOMParser();

  const doc =
    parser.parseFromString(
      raw,
      "application/xml"
    );

  if (
    doc.querySelector(
      "parsererror"
    )
  ) {
    throw new Error(
      "O arquivo XML está inválido."
    );
  }

  setProgress(
    70,
    "Criando estrutura Markdown..."
  );

  return xmlElementToMarkdown(
    doc.documentElement,
    1
  );
}

function xmlElementToMarkdown(
  element,
  level = 1
) {
  const children =
    [...element.children];

  const textOnly =
    [...element.childNodes]
      .filter(
        node =>
          node.nodeType ===
          Node.TEXT_NODE
      )
      .map(node =>
        node.textContent.trim()
      )
      .filter(Boolean)
      .join(" ");

  const lines = [
    `${"#".repeat(
      Math.min(level, 6)
    )} ${escapeMarkdownInline(
      element.tagName
    )}`
  ];

  const attributes =
    [...element.attributes];

  if (attributes.length) {
    lines.push("");

    attributes.forEach(
      attr => {
        lines.push(
          `- **@${escapeMarkdownInline(
            attr.name
          )}:** ${escapeMarkdownInline(
            attr.value
          )}`
        );
      }
    );
  }

  if (textOnly) {
    lines.push("");
    lines.push(textOnly);
  }

  children.forEach(
    child => {
      lines.push("");

      lines.push(
        xmlElementToMarkdown(
          child,
          level + 1
        )
      );
    }
  );

  return lines
    .join("\n")
    .trim();
}

/* ============================================================
   HTML
   ============================================================ */

async function convertHtmlFile(file) {
  const html =
    await file.text();

  setProgress(
    55,
    "Convertendo HTML..."
  );

  return htmlToMarkdown(
    html
  );
}

function htmlToMarkdown(html) {
  const doc =
    new DOMParser()
      .parseFromString(
        html,
        "text/html"
      );

  doc
    .querySelectorAll(
      "script,style,noscript,template,svg"
    )
    .forEach(
      el => el.remove()
    );

  const title =
    (
      doc.querySelector(
        "title"
      )?.textContent || ""
    ).trim();

  const main =
    doc.querySelector(
      "article"
    ) ||
    doc.querySelector(
      "main"
    ) ||
    doc.body;

  let markdown =
    turndown
      .turndown(
        main?.innerHTML ||
          html
      )
      .trim();

  if (
    title &&
    !markdown.startsWith("# ")
  ) {
    markdown =
      `# ${escapeMarkdownInline(
        title
      )}\n\n${markdown}`;
  }

  return markdown;
}

/* ============================================================
   IMAGENS / OCR
   ============================================================ */

async function convertImage(file) {
  requireGlobal(
    "Tesseract",
    "Tesseract.js"
  );

  setProgress(
    5,
    "Preparando OCR..."
  );

  const result =
    await Tesseract.recognize(
      file,
      "por+eng",
      {
        logger(message) {
          if (
            message.status ===
              "recognizing text" &&
            Number.isFinite(
              message.progress
            )
          ) {
            const progress =
              15 +
              Math.round(
                message.progress *
                  75
              );

            setProgress(
              progress,
              `Reconhecendo texto · ${Math.round(
                message.progress *
                  100
              )}%`
            );

          } else if (
            message.status
          ) {
            setProgress(
              10,
              translateOcrStatus(
                message.status
              )
            );
          }
        }
      }
    );

  const text =
    result?.data?.text?.trim() ||
    "";

  if (!text) {
    throw new Error(
      "Não foi encontrado texto legível na imagem."
    );
  }

  return plainTextToMarkdown(
    text,
    stripExtension(file.name)
  );
}

function translateOcrStatus(
  status
) {
  const map = {
    "loading tesseract core":
      "Carregando mecanismo OCR...",

    "initializing tesseract":
      "Inicializando OCR...",

    "loading language traineddata":
      "Carregando idioma do OCR...",

    "initializing api":
      "Preparando reconhecimento...",

    "recognizing text":
      "Reconhecendo texto..."
  };

  return (
    map[status] ||
    "Processando imagem..."
  );
}

/* ============================================================
   SRT / VTT
   ============================================================ */

async function convertSubtitle(
  file,
  ext
) {
  const raw =
    await file.text();

  setProgress(
    45,
    "Lendo legendas..."
  );

  let content =
    raw.replace(/\r/g, "");

  if (ext === "vtt") {
    content = content
      .replace(
        /^WEBVTT[^\n]*\n+/i,
        ""
      )
      .replace(
        /^NOTE[\s\S]*?(?=\n\n|$)/gm,
        ""
      );
  }

  const blocks =
    content.split(/\n{2,}/);

  const output = [];

  for (
    const block of blocks
  ) {
    const lines =
      block
        .split("\n")
        .map(line =>
          line.trim()
        )
        .filter(Boolean);

    if (!lines.length) {
      continue;
    }

    if (
      /^\d+$/.test(
        lines[0]
      )
    ) {
      lines.shift();
    }

    const timeIndex =
      lines.findIndex(
        line =>
          line.includes("-->")
      );

    if (timeIndex === -1) {
      continue;
    }

    const timestamp =
      lines[timeIndex]
        .replace(
          /\s+/g,
          " "
        );

    const textLines =
      lines.slice(
        timeIndex + 1
      );

    if (
      !textLines.length
    ) {
      continue;
    }

    const text =
      textLines
        .join(" ")
        .replace(
          /<[^>]+>/g,
          ""
        )
        .trim();

    output.push(
      `**${timestamp}**\n\n${text}`
    );
  }

  if (!output.length) {
    throw new Error(
      "Nenhuma legenda válida foi encontrada."
    );
  }

  return (
    `# Transcrição\n\n` +
    output.join("\n\n")
  );
}

/* ============================================================
   URL
   ============================================================ */

convertUrlBtn.addEventListener(
  "click",
  convertUrl
);

urlInput.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Enter"
    ) {
      convertUrl();
    }
  }
);

async function convertUrl() {
  hideError();

  let url;

  try {
    url =
      new URL(
        urlInput.value.trim()
      );

  } catch {
    showError(
      "Digite uma URL válida, incluindo https://"
    );

    return;
  }

  if (
    ![
      "http:",
      "https:"
    ].includes(
      url.protocol
    )
  ) {
    showError(
      "A URL precisa usar http:// ou https://"
    );

    return;
  }

  setProcessing(
    true,
    "Convertendo página",
    "Acessando URL...",
    10
  );

  try {
    const response =
      await fetch(
        url.href,
        {
          method: "GET",
          mode: "cors",
          credentials: "omit",
          redirect: "follow",
          headers: {
            Accept:
              "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        `O site respondeu com HTTP ${response.status}.`
      );
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    const text =
      await response.text();

    setProgress(
      55,
      "Convertendo conteúdo..."
    );

    let markdown;

    if (
      contentType.includes(
        "html"
      ) ||
      /<html|<body|<article|<main/i.test(
        text
      )
    ) {
      markdown =
        htmlToMarkdown(text);

    } else {
      markdown =
        plainTextToMarkdown(
          text,
          url.hostname
        );
    }

    setProgress(
      100,
      "Concluído"
    );

    showResult(
      markdown,
      "Página convertida",
      url.href,
      `${sanitizeFilename(
        url.hostname ||
          "pagina"
      )}.md`
    );

  } catch (error) {
    console.error(
      "[Conversor Markdown URL]",
      error
    );

    if (
      error instanceof TypeError &&
      /fetch/i.test(
        error.message
      )
    ) {
      showError(
        "O navegador não conseguiu acessar essa página. " +
        "O site provavelmente bloqueia leitura direta por CORS. " +
        "Sem backend/proxy, esse bloqueio não pode ser contornado pela ferramenta."
      );

      return;
    }

    showError(
      humanizeError(error)
    );
  }
}

/* ============================================================
   TEXTO COLADO / MARKDOWN EXISTENTE
   ============================================================ */

convertTextBtn.addEventListener(
  "click",
  () => {
    hideError();

    const text =
      textInput.value.trim();

    if (!text) {
      showError(
        "Cole algum conteúdo antes de converter."
      );

      return;
    }

    const mode =
      document.querySelector(
        'input[name="textMode"]:checked'
      )?.value || "plain";

    setProcessing(
      true,
      "Preparando Markdown",
      "Organizando conteúdo...",
      35
    );

    try {
      let markdown;

      if (
        mode === "markdown"
      ) {
        markdown = text;

      } else {
        markdown =
          plainTextToMarkdown(
            text
          );
      }

      setProgress(
        100,
        "Concluído"
      );

      showResult(
        markdown,

        mode === "markdown"
          ? "Markdown carregado"
          : "Texto convertido",

        mode === "markdown"
          ? "Markdown existente"
          : "Texto colado → Markdown",

        "texto.md"
      );

    } catch (error) {
      showError(
        humanizeError(error)
      );
    }
  }
);

/* ============================================================
   COPIAR / DOWNLOAD
   ============================================================ */

copyBtn.addEventListener(
  "click",
  async () => {
    const text =
      markdownOutput.value;

    try {
      await navigator.clipboard
        .writeText(text);

      const original =
        copyBtn.innerHTML;

      copyBtn.textContent =
        "Copiado";

      setTimeout(
        () => {
          copyBtn.innerHTML =
            original;
        },
        1400
      );

    } catch {
      markdownOutput.select();

      document.execCommand(
        "copy"
      );
    }
  }
);

downloadBtn.addEventListener(
  "click",
  () => {
    const blob =
      new Blob(
        [
          markdownOutput.value
        ],
        {
          type:
            "text/markdown;charset=utf-8"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      outputFileName;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    setTimeout(
      () =>
        URL.revokeObjectURL(
          url
        ),
      1000
    );
  }
);

/* ============================================================
   HELPERS
   ============================================================ */

function getExtension(
  name = ""
) {
  return name.includes(".")
    ? name
        .split(".")
        .pop()
        .toLowerCase()
    : "";
}

function stripExtension(
  name = ""
) {
  return name.replace(
    /\.[^/.]+$/,
    ""
  );
}

function formatLabel(ext) {
  const labels = {
    pdf: "PDF",
    docx: "Documento Word",
    rtf: "RTF",
    txt: "Texto",
    csv: "CSV",
    xlsx: "Planilha Excel",
    xls: "Planilha Excel",
    json: "JSON",
    xml: "XML",
    html: "HTML",
    htm: "HTML",
    png: "Imagem PNG",
    jpg: "Imagem JPG",
    jpeg: "Imagem JPG",
    webp: "Imagem WEBP",
    srt: "Legenda SRT",
    vtt: "Legenda VTT",
    md: "Markdown",
    markdown: "Markdown"
  };

  return (
    labels[ext] ||
    ext.toUpperCase()
  );
}

function formatBytes(bytes) {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const index =
    Math.min(
      Math.floor(
        Math.log(bytes) /
          Math.log(1024)
      ),
      units.length - 1
    );

  const value =
    bytes /
    (1024 ** index);

  return (
    `${value.toLocaleString(
      "pt-BR",
      {
        maximumFractionDigits:
          index === 0
            ? 0
            : 1
      }
    )} ${units[index]}`
  );
}

function normalizeMarkdown(
  markdown
) {
  return (
    String(markdown || "")
      .replace(
        /\r\n?/g,
        "\n"
      )
      .replace(
        /[ \t]+\n/g,
        "\n"
      )
      .replace(
        /\n{4,}/g,
        "\n\n\n"
      )
      .trim() +
    "\n"
  );
}

function cleanupExtractedText(
  text
) {
  return String(text || "")
    .replace(
      /\u00A0/g,
      " "
    )
    .replace(
      /[ \t]{2,}/g,
      " "
    )
    .replace(
      / *\n */g,
      "\n"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}

function escapeMarkdownInline(
  value
) {
  return String(
    value ?? ""
  ).replace(
    /([\\`*_{}\[\]<>#+.!|-])/g,
    "\\$1"
  );
}

function stringifyCell(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    value instanceof Date
  ) {
    return value.toLocaleString(
      "pt-BR"
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    return JSON.stringify(
      value
    );
  }

  return String(value).trim();
}

function escapeTableCell(
  value
) {
  return String(
    value ?? ""
  )
    .replace(
      /\|/g,
      "\\|"
    )
    .replace(
      /\r?\n/g,
      "<br>"
    );
}

function isPrimitive(
  value
) {
  return (
    value === null ||
    [
      "string",
      "number",
      "boolean"
    ].includes(
      typeof value
    )
  );
}

function formatPrimitive(
  value
) {
  if (value === null) {
    return "`null`";
  }

  if (
    typeof value ===
      "boolean" ||
    typeof value ===
      "number"
  ) {
    return `\`${value}\``;
  }

  const string =
    String(value);

  if (
    string.includes("\n")
  ) {
    return (
      `\n\n${string}\n`
    );
  }

  return escapeMarkdownInline(
    string
  );
}

function sanitizeFilename(
  name
) {
  let safe =
    String(
      name ||
        "conteudo.md"
    )
      .replace(
        /[<>:"/\\|?*\u0000-\u001F]/g,
        "-"
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (
    !safe
      .toLowerCase()
      .endsWith(".md")
  ) {
    safe += ".md";
  }

  return (
    safe ||
    "conteudo.md"
  );
}

function requireGlobal(
  name,
  libraryName
) {
  if (!window[name]) {
    throw new Error(
      `${libraryName} não carregou. ` +
      "Verifique sua conexão com a internet e recarregue a página."
    );
  }
}

function humanizeError(
  error
) {
  if (!error) {
    return (
      "Erro desconhecido durante a conversão."
    );
  }

  return error instanceof Error
    ? error.message
    : String(error);
}

/* ============================================================
   START
   ============================================================ */

console.log(
  "[Conversor Markdown] ferramenta carregada"
);
