import { removeBackground } from "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm";

const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");

const uploadState = document.getElementById("uploadState");
const processingState = document.getElementById("processingState");
const resultState = document.getElementById("resultState");
const errorState = document.getElementById("errorState");

const processingImage = document.getElementById("processingImage");
const resultImage = document.getElementById("resultImage");

const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");

const resultName = document.getElementById("resultName");
const resultMeta = document.getElementById("resultMeta");
const errorMessage = document.getElementById("errorMessage");

const downloadBtn = document.getElementById("downloadBtn");
const newImageBtn = document.getElementById("newImageBtn");
const tryAgainBtn = document.getElementById("tryAgainBtn");

const ACCEPTED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp"
];

const MAX_FILE_SIZE = 40 * 1024 * 1024;

let selectedFile = null;
let sourceUrl = null;
let resultUrl = null;
let resultBlob = null;

function setState(state) {
  uploadState.hidden = state !== "upload";
  processingState.hidden = state !== "processing";
  resultState.hidden = state !== "result";
  errorState.hidden = state !== "error";
}

function validateFile(file) {
  if (!file) {
    throw new Error("Nenhuma imagem foi selecionada.");
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    throw new Error(
      "Formato não suportado. Use PNG, JPG ou WEBP."
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      "A imagem ultrapassa o limite de 40 MB."
    );
  }
}

function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const dimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight
      };

      URL.revokeObjectURL(url);

      resolve(dimensions);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);

      reject(
        new Error("Não foi possível carregar a imagem.")
      );
    };

    image.src = url;
  });
}

function createOutputName(name) {
  const baseName =
    name.replace(/\.[^/.]+$/, "") || "imagem";

  return `${baseName}-sem-fundo.png`;
}

function clearUrls() {
  if (sourceUrl) {
    URL.revokeObjectURL(sourceUrl);
    sourceUrl = null;
  }

  if (resultUrl) {
    URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  }
}

function updateProgress(key, current, total) {
  console.log(
    "[Background Removal]",
    key,
    current,
    total
  );

  if (!total) return;

  const progress = current / total;

  let percentage = Math.round(progress * 80);

  percentage = Math.max(
    5,
    Math.min(90, percentage)
  );

  progressBar.style.width = `${percentage}%`;

  const stage = String(key).toLowerCase();

  if (
    stage.includes("model") ||
    stage.includes("fetch") ||
    stage.includes("download")
  ) {
    statusText.textContent =
      "Baixando modelo de IA...";
  } else {
    statusText.textContent =
      "Analisando a imagem...";
  }
}

async function processImage(file) {
  try {
    validateFile(file);

    selectedFile = file;

    clearUrls();

    const dimensions =
      await getImageDimensions(file);

    sourceUrl =
      URL.createObjectURL(file);

    processingImage.src = sourceUrl;

    progressBar.style.width = "5%";

    statusText.textContent =
      "Preparando inteligência artificial...";

    setState("processing");

    const device =
      "gpu" in navigator
        ? "gpu"
        : "cpu";

    console.log(
      "[Remover Fundo] Device:",
      device
    );

    resultBlob = await removeBackground(
      file,
      {
        debug: true,

        device,

        proxyToWorker: false,

        model:
          device === "gpu"
            ? "isnet_fp16"
            : "isnet",

        output: {
          format: "image/png",
          quality: 1
        },

        progress: updateProgress
      }
    );

    progressBar.style.width = "95%";

    statusText.textContent =
      "Preparando PNG transparente...";

    resultUrl =
      URL.createObjectURL(resultBlob);

    resultImage.src = resultUrl;

    resultName.textContent =
      createOutputName(file.name);

    resultMeta.textContent =
      `${dimensions.width.toLocaleString("pt-BR")} × ` +
      `${dimensions.height.toLocaleString("pt-BR")} px · ` +
      `PNG transparente`;

    progressBar.style.width = "100%";

    setState("result");

  } catch (error) {
    console.error(
      "[Remover Fundo] ERRO:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    errorMessage.textContent =
      message ||
      "Não foi possível remover o fundo.";

    setState("error");
  }
}

dropZone.addEventListener(
  "click",
  () => {
    fileInput.click();
  }
);

fileInput.addEventListener(
  "change",
  () => {
    const file =
      fileInput.files?.[0];

    if (file) {
      processImage(file);
    }
  }
);

dropZone.addEventListener(
  "dragover",
  event => {
    event.preventDefault();

    dropZone.classList.add(
      "dragging"
    );
  }
);

dropZone.addEventListener(
  "dragleave",
  () => {
    dropZone.classList.remove(
      "dragging"
    );
  }
);

dropZone.addEventListener(
  "drop",
  event => {
    event.preventDefault();

    dropZone.classList.remove(
      "dragging"
    );

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      processImage(file);
    }
  }
);

downloadBtn.addEventListener(
  "click",
  () => {
    if (!resultBlob) return;

    const link =
      document.createElement("a");

    link.href = resultUrl;

    link.download =
      createOutputName(
        selectedFile.name
      );

    document.body.appendChild(link);

    link.click();

    link.remove();
  }
);

function resetTool() {
  clearUrls();

  selectedFile = null;
  resultBlob = null;

  fileInput.value = "";

  processingImage.removeAttribute(
    "src"
  );

  resultImage.removeAttribute(
    "src"
  );

  progressBar.style.width = "5%";

  statusText.textContent =
    "Preparando o modelo de IA...";

  setState("upload");
}

newImageBtn.addEventListener(
  "click",
  resetTool
);

tryAgainBtn.addEventListener(
  "click",
  resetTool
);

window.addEventListener(
  "beforeunload",
  clearUrls
);

setState("upload");

console.log(
  "[Remover Fundo] ferramenta carregada"
);