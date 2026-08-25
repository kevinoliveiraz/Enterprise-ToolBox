/* ============================================================
   GERADOR-DE-QRCODE.JS
   Enterprise ToolBox

   QR Code gerado integralmente no navegador.
   Dependência: qrcode@1.5.4 carregada no HTML.
   ============================================================ */

const qrContent = document.getElementById("qrContent");
const characterCounter = document.getElementById("characterCounter");

const qrSize = document.getElementById("qrSize");
const errorCorrection = document.getElementById("errorCorrection");
const qrMargin = document.getElementById("qrMargin");

const fileName = document.getElementById("fileName");

const darkColor = document.getElementById("darkColor");
const lightColor = document.getElementById("lightColor");
const darkColorValue = document.getElementById("darkColorValue");
const lightColorValue = document.getElementById("lightColorValue");
const resetColorsBtn = document.getElementById("resetColorsBtn");

const generateBtn = document.getElementById("generateBtn");

const qrCanvas = document.getElementById("qrCanvas");
const emptyState = document.getElementById("emptyState");
const qrPreviewWrap = document.getElementById("qrPreviewWrap");

const previewResolution = document.getElementById("previewResolution");
const previewStatus = document.getElementById("previewStatus");

const resultActions = document.getElementById("resultActions");
const downloadBtn = document.getElementById("downloadBtn");
const clearBtn = document.getElementById("clearBtn");

const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

let qrGenerated = false;

/* ============================================================
   CONSTANTES
   ============================================================ */

const DEFAULT_DARK = "#111111";
const DEFAULT_LIGHT = "#FFFFFF";

/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

function init() {
  updateCharacterCounter();
  updateColorLabels();
  updateResolutionLabel();

  if (!window.QRCode) {
    showError(
      "A biblioteca de QR Code não carregou. Verifique sua conexão com a internet e recarregue a página."
    );
  }

  console.log("[Gerador QR Code] ferramenta carregada");
}

/* ============================================================
   CONTADOR
   ============================================================ */

qrContent.addEventListener("input", () => {
  updateCharacterCounter();
  hideError();
});

function updateCharacterCounter() {
  const length = qrContent.value.length;

  characterCounter.textContent =
    `${length.toLocaleString("pt-BR")} / 4000`;
}

/* ============================================================
   CORES
   ============================================================ */

darkColor.addEventListener("input", () => {
  updateColorLabels();
  regenerateIfReady();
});

lightColor.addEventListener("input", () => {
  updateColorLabels();
  regenerateIfReady();
});

resetColorsBtn.addEventListener("click", () => {
  darkColor.value = DEFAULT_DARK;
  lightColor.value = DEFAULT_LIGHT;

  updateColorLabels();
  regenerateIfReady();
});

function updateColorLabels() {
  darkColorValue.textContent =
    darkColor.value.toUpperCase();

  lightColorValue.textContent =
    lightColor.value.toUpperCase();
}

/* ============================================================
   OPÇÕES
   ============================================================ */

qrSize.addEventListener("change", () => {
  updateResolutionLabel();
  regenerateIfReady();
});

errorCorrection.addEventListener(
  "change",
  regenerateIfReady
);

qrMargin.addEventListener(
  "change",
  regenerateIfReady
);

function updateResolutionLabel() {
  const size = Number(qrSize.value);

  previewResolution.textContent =
    `${size} × ${size} px`;
}

/* ============================================================
   GERAR QR
   ============================================================ */

generateBtn.addEventListener(
  "click",
  generateQRCode
);

qrContent.addEventListener(
  "keydown",
  event => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "Enter"
    ) {
      event.preventDefault();
      generateQRCode();
    }
  }
);

async function generateQRCode() {
  hideError();

  const content = qrContent.value.trim();

  if (!content) {
    showError(
      "Digite o conteúdo que deverá ser armazenado no QR Code."
    );

    qrContent.focus();
    return;
  }

  if (!window.QRCode) {
    showError(
      "A biblioteca responsável por gerar o QR Code não está disponível."
    );
    return;
  }

  const size = Number(qrSize.value);
  const margin = Number(qrMargin.value);

  try {
    setGenerating(true);

    await QRCode.toCanvas(
      qrCanvas,
      content,
      {
        width: size,

        margin,

        errorCorrectionLevel:
          errorCorrection.value,

        color: {
          dark: normalizeQrColor(
            darkColor.value
          ),
          light: normalizeQrColor(
            lightColor.value
          )
        }
      }
    );

    qrGenerated = true;

    emptyState.hidden = true;
    qrPreviewWrap.hidden = false;
    resultActions.hidden = false;

    previewStatus.textContent = "Pronto";
    previewStatus.classList.add("ready");

  } catch (error) {
    console.error(
      "[Gerador QR Code] erro:",
      error
    );

    showError(
      humanizeQrError(error)
    );

  } finally {
    setGenerating(false);
  }
}

/* ============================================================
   REGERAR AUTOMATICAMENTE
   ============================================================ */

let regenerateTimer = null;

function regenerateIfReady() {
  if (!qrGenerated) {
    return;
  }

  clearTimeout(regenerateTimer);

  regenerateTimer = setTimeout(
    generateQRCode,
    120
  );
}

/* ============================================================
   DOWNLOAD
   ============================================================ */

downloadBtn.addEventListener(
  "click",
  downloadQRCode
);

function downloadQRCode() {
  if (!qrGenerated) {
    return;
  }

  try {
    const pngUrl =
      qrCanvas.toDataURL("image/png");

    const link =
      document.createElement("a");

    link.href = pngUrl;

    link.download =
      `${sanitizeFilename(fileName.value)}.png`;

    document.body.appendChild(link);

    link.click();
    link.remove();

  } catch (error) {
    console.error(
      "[Gerador QR Code] download:",
      error
    );

    showError(
      "Não foi possível preparar o PNG para download."
    );
  }
}

/* ============================================================
   LIMPAR
   ============================================================ */

clearBtn.addEventListener(
  "click",
  clearResult
);

function clearResult() {
  qrContent.value = "";

  qrGenerated = false;

  const context =
    qrCanvas.getContext("2d");

  context.clearRect(
    0,
    0,
    qrCanvas.width,
    qrCanvas.height
  );

  qrPreviewWrap.hidden = true;
  resultActions.hidden = true;
  emptyState.hidden = false;

  previewStatus.textContent =
    "Aguardando conteúdo";

  previewStatus.classList.remove(
    "ready"
  );

  updateCharacterCounter();
  hideError();

  qrContent.focus();
}

/* ============================================================
   STATUS DO BOTÃO
   ============================================================ */

function setGenerating(generating) {
  generateBtn.disabled = generating;

  generateBtn.dataset.originalText ??=
    generateBtn.innerHTML;

  if (generating) {
    generateBtn.textContent =
      "Gerando QR Code...";
  } else {
    generateBtn.innerHTML =
      generateBtn.dataset.originalText;
  }
}

/* ============================================================
   ERRO
   ============================================================ */

function showError(message) {
  errorMessage.textContent = message;
  errorBox.hidden = false;
}

function hideError() {
  errorMessage.textContent = "";
  errorBox.hidden = true;
}

/* ============================================================
   HELPERS
   ============================================================ */

function normalizeQrColor(hex) {
  /*
    A biblioteca QRCode aceita:
    #RRGGBB
    #RRGGBBAA

    FF garante opacidade total.
  */

  const value =
    String(hex || "").trim();

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return `${value}FF`;
  }

  return value;
}

function sanitizeFilename(name) {
  const sanitized =
    String(name || "qrcode")
      .replace(/\.png$/i, "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-")
      .replace(/\s+/g, " ")
      .trim();

  return sanitized || "qrcode";
}

function humanizeQrError(error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error || "");

  if (
    /too big|code length overflow|overflow/i.test(
      message
    )
  ) {
    return (
      "O conteúdo é grande demais para essa configuração. " +
      "Reduza o texto ou aumente a correção de erro somente quando necessário."
    );
  }

  return (
    message ||
    "Não foi possível gerar o QR Code."
  );
}

/* ============================================================
   START
   ============================================================ */

init();
