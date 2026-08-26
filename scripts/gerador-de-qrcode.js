/* ============================================================
   GERADOR-DE-QRCODE.JS
   Enterprise ToolBox

   QR Code gerado integralmente no navegador.

   Dependência carregada no HTML:
   qrcodejs@1.0.0
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
let finalCanvas = null;

let regenerateTimer = null;


/* ============================================================
   CONSTANTES
   ============================================================ */

const DEFAULT_DARK = "#111111";
const DEFAULT_LIGHT = "#FFFFFF";

const MARGIN_SCALE = {
  0: 0,
  1: 0.03,
  2: 0.06,
  4: 0.10
};


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

function init() {
  updateCharacterCounter();
  updateColorLabels();
  updateResolutionLabel();

  if (!window.QRCode) {
    showError(
      "A biblioteca de QR Code não carregou. " +
      "Verifique sua conexão com a internet e recarregue a página."
    );

    console.error(
      "[Gerador QR Code] window.QRCode não encontrado."
    );

    return;
  }

  console.log(
    "[Gerador QR Code] ferramenta carregada"
  );
}


/* ============================================================
   CONTADOR
   ============================================================ */

qrContent.addEventListener(
  "input",
  () => {
    updateCharacterCounter();
    hideError();
  }
);

function updateCharacterCounter() {
  const length = qrContent.value.length;

  characterCounter.textContent =
    `${length.toLocaleString("pt-BR")} / 4000`;
}


/* ============================================================
   CORES
   ============================================================ */

darkColor.addEventListener(
  "input",
  () => {
    updateColorLabels();
    regenerateIfReady();
  }
);

lightColor.addEventListener(
  "input",
  () => {
    updateColorLabels();
    regenerateIfReady();
  }
);

resetColorsBtn.addEventListener(
  "click",
  () => {
    darkColor.value = DEFAULT_DARK;
    lightColor.value = DEFAULT_LIGHT;

    updateColorLabels();

    regenerateIfReady();
  }
);

function updateColorLabels() {
  darkColorValue.textContent =
    darkColor.value.toUpperCase();

  lightColorValue.textContent =
    lightColor.value.toUpperCase();
}


/* ============================================================
   OPÇÕES
   ============================================================ */

qrSize.addEventListener(
  "change",
  () => {
    updateResolutionLabel();
    regenerateIfReady();
  }
);

errorCorrection.addEventListener(
  "change",
  regenerateIfReady
);

qrMargin.addEventListener(
  "change",
  regenerateIfReady
);

function updateResolutionLabel() {
  const size =
    Number(qrSize.value);

  previewResolution.textContent =
    `${size} × ${size} px`;
}


/* ============================================================
   EVENTOS
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


/* ============================================================
   GERAR QR CODE
   ============================================================ */

async function generateQRCode() {
  hideError();

  const content =
    qrContent.value.trim();

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

  const size =
    Number(qrSize.value);

  const marginOption =
    Number(qrMargin.value);

  try {
    setGenerating(true);

    /*
     * Calcula a margem dentro da resolução selecionada.
     *
     * Exemplo:
     *
     * resolução final = 512 × 512
     *
     * o QR ocupa uma área menor e o restante
     * é preenchido com a cor de fundo.
     */

    const marginRatio =
      MARGIN_SCALE[marginOption] ?? 0.06;

    const marginPixels =
      Math.round(
        size * marginRatio
      );

    const innerSize =
      Math.max(
        64,
        size - marginPixels * 2
      );

    /*
     * qrcodejs precisa de um elemento HTML
     * para gerar seu Canvas.
     *
     * Usamos um elemento temporário.
     */

    const temporaryContainer =
      document.createElement("div");

    temporaryContainer.style.position =
      "fixed";

    temporaryContainer.style.left =
      "-99999px";

    temporaryContainer.style.top =
      "-99999px";

    document.body.appendChild(
      temporaryContainer
    );

    const correctionLevels = {
      L: QRCode.CorrectLevel.L,
      M: QRCode.CorrectLevel.M,
      Q: QRCode.CorrectLevel.Q,
      H: QRCode.CorrectLevel.H
    };

    new QRCode(
      temporaryContainer,
      {
        text: content,

        width: innerSize,
        height: innerSize,

        colorDark:
          darkColor.value,

        colorLight:
          lightColor.value,

        correctLevel:
          correctionLevels[
            errorCorrection.value
          ] || QRCode.CorrectLevel.M
      }
    );

    /*
     * A geração do qrcodejs é síncrona,
     * mas aguardamos um frame para garantir
     * que o Canvas já esteja disponível.
     */

    await nextFrame();

    const generatedCanvas =
      temporaryContainer.querySelector(
        "canvas"
      );

    if (!generatedCanvas) {
      temporaryContainer.remove();

      throw new Error(
        "O QR Code foi processado, mas o Canvas não foi gerado."
      );
    }

    /*
     * Criamos nosso próprio Canvas final.
     *
     * Isso permite:
     *
     * - resolução exata
     * - margem configurável
     * - download PNG consistente
     */

    finalCanvas =
      document.createElement("canvas");

    finalCanvas.width = size;
    finalCanvas.height = size;

    const context =
      finalCanvas.getContext(
        "2d",
        {
          alpha: false
        }
      );

    if (!context) {
      temporaryContainer.remove();

      throw new Error(
        "Não foi possível criar o Canvas final."
      );
    }

    /*
     * Fundo
     */

    context.fillStyle =
      lightColor.value;

    context.fillRect(
      0,
      0,
      size,
      size
    );

    /*
     * QR Code
     */

    context.imageSmoothingEnabled = false;

    context.drawImage(
      generatedCanvas,

      marginPixels,
      marginPixels,

      innerSize,
      innerSize
    );

    temporaryContainer.remove();

    /*
     * Coloca o Canvas final na interface.
     */

    qrCanvas.innerHTML = "";

    finalCanvas.className =
      "generated-qr-canvas";

    finalCanvas.style.display =
      "block";

    finalCanvas.style.width =
      "100%";

    finalCanvas.style.height =
      "auto";

    finalCanvas.style.maxWidth =
      "100%";

    finalCanvas.style.imageRendering =
      "pixelated";

    qrCanvas.appendChild(
      finalCanvas
    );

    qrGenerated = true;

    emptyState.hidden = true;

    qrPreviewWrap.hidden = false;

    resultActions.hidden = false;

    previewStatus.textContent =
      "Pronto";

    previewStatus.classList.add(
      "ready"
    );

    console.log(
      "[Gerador QR Code] QR gerado:",
      {
        tamanho: size,
        margem: marginPixels,
        corQr: darkColor.value,
        fundo: lightColor.value,
        correção:
          errorCorrection.value
      }
    );

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

function regenerateIfReady() {
  if (!qrGenerated) {
    return;
  }

  clearTimeout(
    regenerateTimer
  );

  regenerateTimer =
    setTimeout(
      generateQRCode,
      150
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
  if (
    !qrGenerated ||
    !finalCanvas
  ) {
    return;
  }

  try {
    const pngUrl =
      finalCanvas.toDataURL(
        "image/png"
      );

    const link =
      document.createElement("a");

    link.href = pngUrl;

    link.download =
      `${sanitizeFilename(
        fileName.value
      )}.png`;

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

  } catch (error) {
    console.error(
      "[Gerador QR Code] erro no download:",
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
  finalCanvas = null;

  qrCanvas.innerHTML = "";

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

function setGenerating(
  generating
) {
  generateBtn.disabled =
    generating;

  generateBtn.dataset.originalHtml ??=
    generateBtn.innerHTML;

  if (generating) {
    generateBtn.textContent =
      "Gerando QR Code...";

  } else {
    generateBtn.innerHTML =
      generateBtn.dataset.originalHtml;
  }
}


/* ============================================================
   ERRO
   ============================================================ */

function showError(message) {
  errorMessage.textContent =
    message;

  errorBox.hidden = false;
}

function hideError() {
  errorMessage.textContent = "";

  errorBox.hidden = true;
}


/* ============================================================
   HELPERS
   ============================================================ */

function sanitizeFilename(name) {
  const sanitized =
    String(
      name || "qrcode"
    )
      .replace(
        /\.png$/i,
        ""
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

  return (
    sanitized ||
    "qrcode"
  );
}


function humanizeQrError(error) {
  const message =
    error instanceof Error
      ? error.message
      : String(
          error || ""
        );

  if (
    /too long|too big|overflow|code length/i.test(
      message
    )
  ) {
    return (
      "O conteúdo é grande demais para gerar esse QR Code. " +
      "Reduza o texto ou utilize um conteúdo mais curto."
    );
  }

  return (
    message ||
    "Não foi possível gerar o QR Code."
  );
}


function nextFrame() {
  return new Promise(
    resolve =>
      requestAnimationFrame(
        () =>
          requestAnimationFrame(
            resolve
          )
      )
  );
}


/* ============================================================
   START
   ============================================================ */

init();
