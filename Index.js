// Inicializa ícones ao carregar
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});

// Variáveis globais de estado
let selectedPdfFiles = [];
let selectedAudioFile = null;

function searchTools() {
    let input = document.getElementById('toolSearch').value.toLowerCase();
    let cards = document.getElementsByClassName('tool-card');
    for (let card of cards) {
        let title = card.querySelector('h3').innerText.toLowerCase();
        card.classList.toggle('hidden', !title.includes(input));
    }
}

function filterCat(cat) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if (event && event.target.classList.contains('tab')) {
        event.target.classList.add('active');
    }
    
    let cards = document.getElementsByClassName('tool-card');
    for (let card of cards) {
        if (cat === 'all') card.classList.remove('hidden');
        else card.classList.toggle('hidden', card.getAttribute('data-cat') !== cat);
    }
}

function openTool(id) {
    document.getElementById('mainGrid').style.display = 'none';
    document.getElementById('categoryTabs').style.display = 'none';
    document.getElementById('toolView').style.display = 'block';
    loadToolLogic(id);
}

function closeTool() {
    document.getElementById('mainGrid').style.display = 'grid';
    document.getElementById('categoryTabs').style.display = 'flex';
    document.getElementById('toolView').style.display = 'none';
    if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
    }
    selectedPdfFiles = [];
    selectedAudioFile = null;
}

function loadToolLogic(id) {
    const content = document.getElementById('viewContent');
    const title = document.getElementById('viewTitle');
    content.innerHTML = ""; 

    switch (id) {
        case 'barcode-gen':
            title.innerText = "Central de Codificação de Ativos";
            content.innerHTML = `
                <div class="tool-input-group" style="display: flex; flex-direction: column; gap: 10px; max-width: 500px;">
                    <label>Dados para o Código</label>
                    <input type="text" id="barcodeData" placeholder="Digite o conteúdo aqui..." onkeyup="updateBarcodePreview()">
                    <label>Tipo de Simbologia</label>
                    <select id="barcodeType" onchange="updateBarcodePreview()">
                        <optgroup label="Alfanumérico (Texto + Números)">
                            <option value="CODE128">CODE128 (Mais versátil)</option>
                            <option value="CODE39">CODE39 (Industrial)</option>
                        </optgroup>
                        <optgroup label="Varejo (Apenas Números)">
                            <option value="EAN13">EAN-13 (Padrão Comercial)</option>
                            <option value="UPC">UPC (Padrão Americano)</option>
                        </optgroup>
                    </select>
                    <button onclick="downloadBarcode()" id="dlBtn" class="hidden" style="background: var(--success);">Baixar PNG</button>
                </div>
                <div id="barcodeDisplayContainer" style="margin-top: 30px; padding: 25px; background: white; border: 2px dashed var(--border); border-radius: 12px; text-align: center;">
                    <p id="barcodeStatus">Aguardando dados válidos...</p>
                    <svg id="barcodeCanvas"></svg>
                </div>
            `;
            break;

        case 'wav-to-mp3':
            title.innerText = "Conversor de Áudio (WAV para MP3)";
            content.innerHTML = `
                <div class="tool-input-group" style="max-width: 600px;">
                    <p style="margin-bottom: 15px; color: #64748b;">Converta arquivos WAV para MP3 localmente no seu navegador.</p>
                    <div class="file-drop-zone" onclick="document.getElementById('audioInput').click()">
                        <i data-lucide="file-audio" style="width: 40px; height: 40px; color: var(--accent);"></i>
                        <p style="font-weight: 600;">Clique para selecionar arquivo .wav</p>
                        <input type="file" id="audioInput" accept="audio/wav" style="display: none;" onchange="handleAudioSelect(event)">
                    </div>
                    <div id="audioFileInfo" class="hidden" style="margin-top:20px; padding:15px; border:1px solid var(--border); border-radius:8px;">
                        <span id="audioFileName" style="display:block; margin-bottom:10px; font-weight:500;"></span>
                        <div class="progress-container" id="audioProgress" style="display:none; background:#e2e8f0; height:10px; border-radius:5px; overflow:hidden;">
                            <div class="progress-bar" id="audioProgressBar" style="width:0%; height:100%; background:var(--success); transition: width 0.1s;"></div>
                        </div>
                        <button id="convBtn" onclick="convertToMp3()" style="width:100%; margin-top:15px;">Converter para MP3</button>
                    </div>
                </div>
            `;
            break;

        case 'web-test':
            title.innerText = "Editor HTML Real-time";
            content.innerHTML = `
                <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                    <button onclick="openFullPage()" style="background: var(--primary);">
                        <i data-lucide="external-link"></i> Abrir Página Completa
                    </button>
                </div>
                <div class="web-editor-layout">
                    <textarea id="htmlInput" onkeyup="updateWebPreview()" placeholder="Cole seu HTML/CSS aqui..."></textarea>
                    <iframe id="webPreview"></iframe>
                </div>
            `;
            break;

        case 'pdf-merge':
            title.innerText = "Combinar Arquivos PDF";
            content.innerHTML = `
                <div class="tool-input-group" style="max-width: 600px;">
                    <div class="file-drop-zone" onclick="document.getElementById('pdfFiles').click()">
                        <i data-lucide="file-plus" style="width: 40px; height: 40px; color: var(--accent);"></i>
                        <p style="font-weight: 600;">Clique para adicionar PDFs</p>
                        <input type="file" id="pdfFiles" multiple accept="application/pdf" style="display: none;" onchange="handlePdfSelect(event)">
                    </div>
                    <div id="pdfQueue" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;"></div>
                    <div id="pdfActions" class="hidden" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button onclick="mergePDFs()" style="flex: 1;">Combinar Tudo</button>
                        <button onclick="clearPdfQueue()" style="background: var(--danger);">Limpar</button>
                    </div>
                </div>
            `;
            break;

        case 'anon-data':
            title.innerText = "Anonimizador de Segurança (LGPD)";
            content.innerHTML = `
                <div class="tool-input-group" style="max-width: 850px;">
                    <div id="editorAnon" contenteditable="true" style="min-height: 300px; padding: 20px; border: 2px solid var(--border); border-radius: 12px; background: white;">
                        Cole os dados aqui...
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                        <button onclick="applyBlackBar()" style="background: #000;">Aplicar Tarja (*)</button>
                        <button onclick="window.print()" style="background: var(--primary);">Imprimir Relatório</button>
                        <button onclick="copyAnonResult()" style="background: var(--success);">Copiar Texto</button>
                    </div>
                </div>
            `;
            break;

        case 'stegan':
            title.innerText = "Esteganografia (Mensagens Ocultas)";
            content.innerHTML = `
                <div class="tool-input-group" style="max-width: 600px;">
                    <input type="file" id="steganInput" accept="image/*" onchange="previewSteganImage(event)">
                    <img id="steganPreview" style="max-width:100%; display:none; border-radius:8px; margin: 15px 0;">
                    <canvas id="steganCanvas" style="display:none;"></canvas>
                    <textarea id="steganMessage" placeholder="Mensagem secreta..." style="height:100px;"></textarea>
                    <div style="display: flex; gap: 10px; margin-top:10px;">
                        <button onclick="encodeMessage()" style="background: var(--success); flex: 1;">Esconder e Baixar</button>
                        <button onclick="decodeMessage()" style="background: var(--accent); flex: 1;">Ler da Imagem</button>
                    </div>
                </div>
            `;
            break;

        case 'pdf-exif':
            title.innerText = "Limpar Metadados de PDF";
            content.innerHTML = `
                <input type="file" id="pdfExif" accept="application/pdf" style="margin-bottom:15px;">
                <button onclick="stripPdfMetadata()">Limpar Metadados</button>
            `;
            break;

        case 'vid-rec':
            title.innerText = "Gravador de Tela Local";
            content.innerHTML = `
                <div style="margin-bottom:15px; display:flex; gap:10px;">
                    <button onclick="startCapture()" id="startBtn">Iniciar Gravação</button>
                    <button onclick="stopCapture()" id="stopBtn" disabled style="background:var(--danger)">Parar e Salvar</button>
                </div>
                <video id="previewVid" autoplay muted style="width:100%; max-height:400px; background:#000; border-radius:8px;"></video>
            `;
            break;

        case 'txt-diff':
            title.innerText = "Comparador de Textos";
            content.innerHTML = `
                <div style="display:flex; gap:10px; margin-bottom:15px;">
                    <textarea id="txt1" placeholder="Texto Original" style="height:200px;"></textarea>
                    <textarea id="txt2" placeholder="Texto para Comparar" style="height:200px;"></textarea>
                </div>
                <button onclick="compareTexts()">Verificar Diferenças</button>
                <div id="diffRes" style="margin-top:15px; font-weight:bold;"></div>
            `;
            break;

        default:
            title.innerText = "Ferramenta em Desenvolvimento";
            content.innerHTML = `<p>Lógica em breve.</p>`;
    }
    lucide.createIcons();
}

// --- LÓGICA DE CONVERSÃO DE ÁUDIO (WAV -> MP3) ---
function handleAudioSelect(event) {
    selectedAudioFile = event.target.files[0];
    if (selectedAudioFile) {
        document.getElementById('audioFileInfo').classList.remove('hidden');
        document.getElementById('audioFileName').innerText = `Arquivo: ${selectedAudioFile.name}`;
    }
}

async function convertToMp3() {
    if (!selectedAudioFile) return;
    
    const btn = document.getElementById('convBtn');
    const progCont = document.getElementById('audioProgress');
    const progBar = document.getElementById('audioProgressBar');
    
    btn.disabled = true;
    btn.innerText = "Convertendo...";
    progCont.style.display = "block";

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await selectedAudioFile.arrayBuffer();
    
    audioCtx.decodeAudioData(arrayBuffer, (audioBuffer) => {
        const channels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
        const mp3Data = [];

        const sampleBlockSize = 1152;
        const left = audioBuffer.getChannelData(0);
        const right = channels > 1 ? audioBuffer.getChannelData(1) : left;

        // Função para converter Float32 para Int16
        const floatTo16Bit = (input) => {
            let s = Math.max(-1, Math.min(1, input));
            return s < 0 ? s * 0x8000 : s * 0x7FFF;
        };

        for (let i = 0; i < left.length; i += sampleBlockSize) {
            const leftChunk = new Int16Array(sampleBlockSize);
            const rightChunk = new Int16Array(sampleBlockSize);
            for (let j = 0; j < sampleBlockSize; j++) {
                leftChunk[j] = floatTo16Bit(left[i + j]);
                rightChunk[j] = floatTo16Bit(right[i + j]);
            }
            const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) mp3Data.push(mp3buf);
            
            // Atualiza progresso
            progBar.style.width = Math.floor((i / left.length) * 100) + "%";
        }

        const lastData = mp3encoder.flush();
        if (lastData.length > 0) mp3Data.push(lastData);

        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        downloadBlob(blob, selectedAudioFile.name.replace(".wav", ".mp3"), "audio/mp3");
        
        btn.disabled = false;
        btn.innerText = "Concluído!";
        progBar.style.width = "100%";
    });
}

// --- DEMAIS FUNÇÕES AUXILIARES ---
function applyBlackBar() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const span = document.createElement("span");
    span.className = "censored-text";
    span.innerText = "*".repeat(selection.toString().length); 
    range.deleteContents();
    range.insertNode(span);
}

function copyAnonResult() {
    navigator.clipboard.writeText(document.getElementById('editorAnon').innerText);
    alert("Copiado!");
}

function previewSteganImage(event) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = document.getElementById('steganPreview');
        img.src = reader.result;
        img.style.display = 'block';
    }
    reader.readAsDataURL(event.target.files[0]);
}

async function encodeMessage() {
    const message = document.getElementById('steganMessage').value;
    const fileInput = document.getElementById('steganInput');
    if (!fileInput.files[0] || !message) return;

    const img = new Image();
    img.src = URL.createObjectURL(fileInput.files[0]);
    img.onload = function() {
        const canvas = document.getElementById('steganCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const binaryMessage = message.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join('') + '00000000'; 
        
        for (let i = 0; i < binaryMessage.length; i++) {
            data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[i]);
        }
        ctx.putImageData(imageData, 0, 0);
        downloadBlob(canvas.toDataURL("image/png"), "secret.png", "image/png", true);
    };
}

function decodeMessage() {
    const fileInput = document.getElementById('steganInput');
    const img = new Image();
    img.src = URL.createObjectURL(fileInput.files[0]);
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let binary = ""; let msg = "";
        for (let i = 0; i < data.length; i++) {
            binary += (data[i] & 1).toString();
            if (binary.length === 8) {
                if (binary === "00000000") break;
                msg += String.fromCharCode(parseInt(binary, 2));
                binary = "";
            }
        }
        document.getElementById('steganMessage').value = msg;
    };
}

function handlePdfSelect(event) {
    selectedPdfFiles = [...selectedPdfFiles, ...Array.from(event.target.files)];
    renderPdfQueue();
}

function renderPdfQueue() {
    const queue = document.getElementById('pdfQueue');
    document.getElementById('pdfActions').classList.toggle('hidden', selectedPdfFiles.length === 0);
    queue.innerHTML = selectedPdfFiles.map((file, i) => `<div style="padding:10px; border:1px solid #ddd;">${file.name}</div>`).join('');
}

function clearPdfQueue() { selectedPdfFiles = []; renderPdfQueue(); }

async function mergePDFs() {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const file of selectedPdfFiles) {
        const pdf = await PDFLib.PDFDocument.load(await file.arrayBuffer());
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
    }
    downloadBlob(await mergedPdf.save(), "merged.pdf", "application/pdf");
}

function updateBarcodePreview() {
    const data = document.getElementById('barcodeData').value;
    const type = document.getElementById('barcodeType').value;
    if (!data) return;
    try {
        JsBarcode("#barcodeCanvas", data, { format: type });
        document.getElementById('dlBtn').classList.remove('hidden');
    } catch (e) {}
}

function downloadBarcode() {
    const svg = document.getElementById("barcodeCanvas");
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(xml);
    downloadBlob("data:image/svg+xml;base64," + svg64, "barcode.svg", "image/svg+xml", true);
}

function updateWebPreview() {
    const code = document.getElementById('htmlInput').value;
    const preview = document.getElementById('webPreview').contentWindow.document;
    preview.open(); preview.write(code); preview.close();
}

function openFullPage() {
    const newWindow = window.open();
    newWindow.document.write(document.getElementById('htmlInput').value);
}

async function stripPdfMetadata() {
    const file = document.getElementById('pdfExif').files[0];
    const pdfDoc = await PDFLib.PDFDocument.load(await file.arrayBuffer());
    pdfDoc.setTitle(""); pdfDoc.setAuthor("");
    downloadBlob(await pdfDoc.save(), "clean.pdf", "application/pdf");
}

let recorder; let chunks = [];
async function startCapture() {
    window.localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    document.getElementById('previewVid').srcObject = window.localStream;
    recorder = new MediaRecorder(window.localStream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => downloadBlob(new Blob(chunks, { type: "video/webm" }), "recording.webm", "video/webm");
    recorder.start();
    document.getElementById('startBtn').disabled = true; document.getElementById('stopBtn').disabled = false;
}

function stopCapture() {
    recorder.stop(); window.localStream.getTracks().forEach(t => t.stop());
    document.getElementById('startBtn').disabled = false; document.getElementById('stopBtn').disabled = true;
}

function compareTexts() {
    const equal = document.getElementById('txt1').value === document.getElementById('txt2').value;
    document.getElementById('diffRes').innerText = equal ? "✅ Idênticos" : "❌ Diferentes";
}

function downloadBlob(data, name, type, isDataURL = false) {
    const url = isDataURL ? data : window.URL.createObjectURL(new Blob([data], { type: type }));
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
}
