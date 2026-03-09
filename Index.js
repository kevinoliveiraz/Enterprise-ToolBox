// Inicializa ícones ao carregar
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
});

// Variável global para gerenciar a fila de PDFs
let selectedPdfFiles = [];

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
                    <select id="barcodeType" onchange="updateBarcodePreview()" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border);">
                        <optgroup label="Alfanumérico (Texto + Números)">
                            <option value="CODE128">CODE128 (Mais versátil)</option>
                            <option value="CODE39">CODE39 (Industrial)</option>
                        </optgroup>
                        <optgroup label="Varejo (Apenas Números)">
                            <option value="EAN13">EAN-13 (Padrão Comercial)</option>
                            <option value="UPC">UPC (Padrão Americano)</option>
                        </optgroup>
                        <optgroup label="Logística">
                            <option value="ITF14">ITF-14 (Caixas/Embarque)</option>
                            <option value="MSI">MSI / Plessey</option>
                        </optgroup>
                    </select>
                    <button onclick="downloadBarcode()" id="dlBtn" class="hidden" style="background: #059669;">Baixar PNG</button>
                </div>
                <div id="barcodeDisplayContainer" style="margin-top: 30px; padding: 25px; background: white; border: 2px dashed var(--border); border-radius: 12px; text-align: center;">
                    <p id="barcodeStatus">Aguardando dados válidos...</p>
                    <svg id="barcodeCanvas"></svg>
                </div>
            `;
            break;

        case 'web-test':
            title.innerText = "Editor HTML Real-time";
            content.innerHTML = `
                <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                    <button onclick="openFullPage()" style="background: var(--primary); display: flex; align-items: center; gap: 8px;">
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
                    <p style="margin-bottom: 15px; color: #64748b;">Selecione os arquivos na ordem que deseja unir.</p>
                    <div class="file-drop-zone" onclick="document.getElementById('pdfFiles').click()">
                        <i data-lucide="file-plus" style="width: 40px; height: 40px; color: var(--accent); margin-bottom: 10px;"></i>
                        <p style="font-weight: 600; margin: 0;">Clique para adicionar PDFs</p>
                        <input type="file" id="pdfFiles" multiple accept="application/pdf" style="display: none;" onchange="handlePdfSelect(event)">
                    </div>
                    <div id="pdfQueue" style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;"></div>
                    <div id="pdfActions" class="hidden" style="margin-top: 20px; display: flex; gap: 10px;">
                        <button onclick="mergePDFs()" style="flex: 1;">Combinar Tudo</button>
                        <button onclick="clearPdfQueue()" style="background: #ef4444;">Limpar</button>
                    </div>
                </div>
            `;
            break;

        case 'anon-data':
            title.innerText = "Anonimizador de Segurança (LGPD)";
            content.innerHTML = `
                <div class="tool-input-group" style="max-width: 850px;">
                    <p style="margin-bottom: 15px; color: #64748b;">
                        1. Cole o texto. 2. Selecione o dado sensível. 3. Clique em <b>Aplicar Tarja (*)</b>.
                    </p>
                    <div id="editorAnon" contenteditable="true" 
                         style="min-height: 300px; padding: 20px; border: 2px solid var(--border); border-radius: 12px; background: white; overflow-y: auto; font-family: sans-serif; line-height: 1.6; outline-color: var(--accent);">
                        Cole os dados aqui...
                    </div>
                    <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
                        <button onclick="applyBlackBar()" style="background: #000;">
                            <i data-lucide="eye-off"></i> Aplicar Tarja (*)
                        </button>
                        <button onclick="window.print()" style="background: var(--primary);">
                            <i data-lucide="printer"></i> Imprimir Relatório
                        </button>
                        <button onclick="copyAnonResult()" style="background: var(--success);">
                            <i data-lucide="copy"></i> Copiar Texto Protegido
                        </button>
                    </div>
                </div>
            `;
            break;

        case 'stegan':
            title.innerText = "Esteganografia (Mensagens Ocultas)";
            content.innerHTML = `
                <div class="tool-input-group" style="max-width: 600px;">
                    <p style="margin-bottom: 15px; color: #64748b;">Oculte mensagens dentro de imagens. Use o formato PNG para garantir a integridade dos dados.</p>
                    <label>1. Escolha a Imagem</label>
                    <input type="file" id="steganInput" accept="image/*" onchange="previewSteganImage(event)" style="margin-bottom:10px;">
                    <img id="steganPreview" style="max-width:100%; border-radius:8px; margin-bottom:15px; display:none; border: 1px solid var(--border);">
                    <canvas id="steganCanvas" style="display:none;"></canvas>
                    
                    <label>2. Mensagem Secreta</label>
                    <textarea id="steganMessage" placeholder="Digite o que deseja esconder..." style="height:100px; margin-bottom:15px;"></textarea>
                    
                    <div style="display: flex; gap: 10px;">
                        <button onclick="encodeMessage()" style="background: var(--success); flex: 1;">
                            <i data-lucide="lock"></i> Esconder e Baixar
                        </button>
                        <button onclick="decodeMessage()" style="background: var(--accent); flex: 1;">
                            <i data-lucide="unlock"></i> Ler da Imagem
                        </button>
                    </div>
                </div>
            `;
            break;

        case 'pdf-exif':
            title.innerText = "Limpar Metadados de PDF";
            content.innerHTML = `
                <p>Remova informações de autor, software e datas do seu arquivo.</p>
                <input type="file" id="pdfExif" accept="application/pdf" style="margin-bottom:15px;">
                <button onclick="stripPdfMetadata()">Limpar Metadados</button>
            `;
            break;

        case 'vid-rec':
            title.innerText = "Gravador de Tela Local";
            content.innerHTML = `
                <div style="margin-bottom:15px;">
                    <button onclick="startCapture()" id="startBtn">Iniciar Gravação</button>
                    <button onclick="stopCapture()" id="stopBtn" disabled style="background:#ef4444">Parar e Salvar</button>
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
            content.innerHTML = `<p>A lógica para <b>${id}</b> está sendo preparada.</p>`;
    }
    lucide.createIcons();
}

// --- FUNÇÕES DE TARJA / ANONIMIZAÇÃO ---
function applyBlackBar() {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) {
        alert("Selecione o texto que deseja ocultar primeiro.");
        return;
    }
    const range = selection.getRangeAt(0);
    const selectedText = selection.toString();
    const span = document.createElement("span");
    span.className = "censored-text";
    span.innerText = "*".repeat(selectedText.length); 
    range.deleteContents();
    range.insertNode(span);
    selection.removeAllRanges();
}

function copyAnonResult() {
    const editor = document.getElementById('editorAnon');
    navigator.clipboard.writeText(editor.innerText).then(() => {
        alert("Texto copiado! Os dados sensíveis foram substituídos por asteriscos.");
    });
}

// --- FUNÇÕES DE ESTEGANOGRAFIA (LSB) ---

function previewSteganImage(event) {
    const reader = new FileReader();
    reader.onload = () => {
        const img = document.getElementById('steganPreview');
        img.src = reader.result;
        img.style.display = 'block';
    }
    if(event.target.files[0]) reader.readAsDataURL(event.target.files[0]);
}

async function encodeMessage() {
    const message = document.getElementById('steganMessage').value;
    const fileInput = document.getElementById('steganInput');
    if (!fileInput.files[0] || !message) return alert("Selecione uma imagem e digite uma mensagem!");

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
        
        if (binaryMessage.length > data.length * 0.75) return alert("Mensagem muito grande para esta imagem!");
        
        for (let i = 0; i < binaryMessage.length; i++) {
            data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[i]);
        }
        ctx.putImageData(imageData, 0, 0);
        downloadBlob(canvas.toDataURL("image/png"), `stegan_${Date.now()}.png`, "image/png", true);
    };
}

function decodeMessage() {
    const fileInput = document.getElementById('steganInput');
    if (!fileInput.files[0]) return alert("Selecione a imagem primeiro.");
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
        document.getElementById('steganMessage').value = msg || "Nenhuma mensagem encontrada.";
    };
}

// --- FUNÇÕES DE PDF ---
function handlePdfSelect(event) {
    const files = Array.from(event.target.files);
    selectedPdfFiles = [...selectedPdfFiles, ...files];
    renderPdfQueue();
}

function renderPdfQueue() {
    const queue = document.getElementById('pdfQueue');
    const actions = document.getElementById('pdfActions');
    if (selectedPdfFiles.length === 0) { queue.innerHTML = ""; actions.classList.add('hidden'); return; }
    actions.classList.remove('hidden');
    queue.innerHTML = selectedPdfFiles.map((file, index) => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: white; border: 1px solid var(--border); border-radius: 8px;">
            <span>${index + 1}. ${file.name}</span>
            <button onclick="removePdfFromQueue(${index})" style="background:none; color:red; border:none; cursor:pointer;"><i data-lucide="trash-2"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function removePdfFromQueue(index) { selectedPdfFiles.splice(index, 1); renderPdfQueue(); }
function clearPdfQueue() { selectedPdfFiles = []; renderPdfQueue(); }

async function mergePDFs() {
    const mergedPdf = await PDFLib.PDFDocument.create();
    for (const file of selectedPdfFiles) {
        const pdf = await PDFLib.PDFDocument.load(await file.arrayBuffer());
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => mergedPdf.addPage(p));
    }
    downloadBlob(await mergedPdf.save(), "documento_combinado.pdf", "application/pdf");
}

// --- BARCODE E WEB EDITOR ---
function updateBarcodePreview() {
    const data = document.getElementById('barcodeData').value;
    const type = document.getElementById('barcodeType').value;
    const canvas = document.getElementById('barcodeCanvas');
    if (!data) { canvas.style.display = "none"; return; }
    try {
        JsBarcode("#barcodeCanvas", data, { format: type, displayValue: true });
        document.getElementById('dlBtn').classList.remove('hidden');
        document.getElementById('barcodeStatus').style.display = "none";
        canvas.style.display = "inline-block";
    } catch (e) { 
        document.getElementById('barcodeStatus').innerText = "Formato incompatível"; 
        canvas.style.display = "none";
    }
}

function downloadBarcode() {
    const svg = document.getElementById("barcodeCanvas");
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = 400; canvas.height = 200;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = "white"; ctx.fillRect(0,0,400,200);
        ctx.drawImage(img, 20, 20);
        downloadBlob(canvas.toDataURL("image/png"), "barcode.png", "image/png", true);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}

function updateWebPreview() {
    const code = document.getElementById('htmlInput').value;
    const preview = document.getElementById('webPreview').contentWindow.document;
    preview.open(); preview.write(code); preview.close();
}

function openFullPage() {
    const code = document.getElementById('htmlInput').value;
    const newWindow = window.open();
    newWindow.document.write(code);
}

// --- OUTROS (EXIF, GRAVAÇÃO, DIFF) ---
async function stripPdfMetadata() {
    const file = document.getElementById('pdfExif').files[0];
    if (!file) return;
    const pdfDoc = await PDFLib.PDFDocument.load(await file.arrayBuffer());
    pdfDoc.setTitle(""); pdfDoc.setAuthor("");
    downloadBlob(await pdfDoc.save(), "pdf_limpo.pdf", "application/pdf");
}

let recorder; let chunks = [];
async function startCapture() {
    window.localStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    document.getElementById('previewVid').srcObject = window.localStream;
    recorder = new MediaRecorder(window.localStream);
    recorder.ondataavailable = e => chunks.push(e.data);
    recorder.onstop = () => downloadBlob(new Blob(chunks, { type: "video/webm" }), "gravacao.webm", "video/webm");
    recorder.start();
    document.getElementById('startBtn').disabled = true; document.getElementById('stopBtn').disabled = false;
}

function stopCapture() {
    recorder.stop(); window.localStream.getTracks().forEach(t => t.stop());
    document.getElementById('startBtn').disabled = false; document.getElementById('stopBtn').disabled = true;
}

function compareTexts() {
    const res = document.getElementById('diffRes');
    const equal = document.getElementById('txt1').value === document.getElementById('txt2').value;
    res.innerText = equal ? "✅ Idênticos" : "❌ Diferentes";
    res.style.color = equal ? "green" : "red";
}

// Função de Download Unificada
function downloadBlob(data, name, type, isDataURL = false) {
    const url = isDataURL ? data : window.URL.createObjectURL(new Blob([data], { type: type }));
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    if(!isDataURL) window.URL.revokeObjectURL(url);
}
