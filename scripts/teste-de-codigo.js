/**
 * TESTE-DE-CODIGO.JS
 * Lógica completa da ferramenta: editores com números de linha,
 * preview ao vivo (HTML+CSS+JS) em iframe isolado, execução de
 * JavaScript isolada, execução real de Python via Pyodide (WASM,
 * carregado sob demanda) e um editor "somente escrita" para PHP
 * (PHP roda no servidor, então aqui só ajudamos a escrever/organizar
 * o código e linkamos para um sandbox online).
 */

(function () {
  "use strict";

  /* ================================================================
     TEMPLATES PADRÃO / EXEMPLOS
     ================================================================ */

  const DEFAULTS = {
    html: `<h1>Olá, mundo!</h1>\n<p>Edite o código ao lado e clique em <strong>Executar</strong>.</p>\n<button id="btn">Clique aqui</button>`,
    css: `body {\n  font-family: sans-serif;\n  padding: 24px;\n  color: #222;\n}\n\nh1 {\n  color: #5B3FE0;\n}\n\nbutton {\n  padding: 8px 14px;\n  border-radius: 8px;\n  border: none;\n  background: #5B3FE0;\n  color: #fff;\n  cursor: pointer;\n}`,
    js: `console.log("Testando JavaScript!");\n\ndocument.getElementById("btn").addEventListener("click", () => {\n  console.log("Botão clicado às", new Date().toLocaleTimeString());\n});`,
    javascript: `function soma(a, b) {\n  return a + b;\n}\n\nconsole.log("2 + 3 =", soma(2, 3));\n\nconst lista = [1, 2, 3, 4, 5];\nconsole.log("Dobro de cada item:", lista.map(n => n * 2));`,
    python: `def saudacao(nome):\n    return f"Olá, {nome}!"\n\nprint(saudacao("mundo"))\n\nfor i in range(3):\n    print("Contando:", i)`,
    php: `<?php\n\n$nome = "mundo";\necho "Olá, " . $nome . "!";\n\nfunction soma($a, $b) {\n    return $a + $b;\n}\n\necho "\\n2 + 3 = " . soma(2, 3);\n`,
  };

  const STORAGE_PREFIX = "etb_codigo_";

  function loadCode(key) {
    try {
      const saved = localStorage.getItem(STORAGE_PREFIX + key);
      return saved !== null ? saved : DEFAULTS[key];
    } catch (e) {
      return DEFAULTS[key];
    }
  }

  function saveCode(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, value);
    } catch (e) {
      /* localStorage indisponível: segue sem persistir */
    }
  }

  /* ================================================================
     EDITOR GENÉRICO: números de linha + tecla Tab + auto-indent
     ================================================================ */

  function setupEditor(textarea, gutter, storageKey) {
    textarea.value = loadCode(storageKey);

    function updateGutter() {
      const lines = textarea.value.split("\n").length;
      let out = "";
      for (let i = 1; i <= lines; i++) out += i + "\n";
      gutter.textContent = out.trimEnd();
    }

    function syncScroll() {
      gutter.scrollTop = textarea.scrollTop;
    }

    textarea.addEventListener("input", () => {
      updateGutter();
      saveCode(storageKey, textarea.value);
    });
    textarea.addEventListener("scroll", syncScroll);

    textarea.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        textarea.value = textarea.value.slice(0, start) + "  " + textarea.value.slice(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        updateGutter();
        saveCode(storageKey, textarea.value);
      } else if (e.key === "Enter") {
        // auto-indent: mantém a indentação da linha anterior
        const start = textarea.selectionStart;
        const before = textarea.value.slice(0, start);
        const lineStart = before.lastIndexOf("\n") + 1;
        const currentLine = before.slice(lineStart);
        const indentMatch = currentLine.match(/^[ \t]*/);
        const indent = indentMatch ? indentMatch[0] : "";
        if (indent) {
          e.preventDefault();
          const end = textarea.selectionEnd;
          textarea.value = textarea.value.slice(0, start) + "\n" + indent + textarea.value.slice(end);
          textarea.selectionStart = textarea.selectionEnd = start + 1 + indent.length;
          updateGutter();
          saveCode(storageKey, textarea.value);
        }
      }
    });

    updateGutter();
    return { updateGutter, get value() { return textarea.value; }, set value(v) { textarea.value = v; updateGutter(); } };
  }

  /* ================================================================
     SCRIPT INJETADO NO IFRAME: intercepta console.* e erros,
     repassando tudo para a página pai via postMessage.
     ================================================================ */

  const CONSOLE_BRIDGE = `
    <script>
      (function () {
        function serialize(arg) {
          try {
            if (arg instanceof Error) return arg.name + ": " + arg.message;
            if (typeof arg === "object" && arg !== null) return JSON.stringify(arg, null, 2);
            return String(arg);
          } catch (e) { return String(arg); }
        }
        function post(level, args) {
          try {
            window.parent.postMessage({
              source: "etb-console",
              level: level,
              text: Array.prototype.map.call(args, serialize).join(" ")
            }, "*");
          } catch (e) {}
        }
        ["log", "info", "warn", "error"].forEach(function (level) {
          var original = console[level];
          console[level] = function () {
            post(level === "info" ? "log" : level, arguments);
            original.apply(console, arguments);
          };
        });
        window.addEventListener("error", function (e) {
          post("error", [e.message + " (linha " + e.lineno + ")"]);
        });
        window.addEventListener("unhandledrejection", function (e) {
          post("error", ["Promise rejeitada: " + serialize(e.reason)]);
        });
      })();
    <\/script>
  `;

  /* ================================================================
     PAINEL DE CONSOLE (área de saída na direita)
     ================================================================ */

  function appendConsoleLine(container, level, text) {
    const placeholder = container.querySelector(".console-placeholder");
    if (placeholder) placeholder.remove();

    const line = document.createElement("div");
    line.className = "console-line level-" + level;

    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = level === "log" ? "log" : level === "warn" ? "warn" : level === "result" ? "saída" : "erro";

    const msg = document.createElement("span");
    msg.textContent = text;

    line.appendChild(tag);
    line.appendChild(msg);
    container.appendChild(line);
    container.scrollTop = container.scrollHeight;
  }

  function clearConsole(container, placeholderText) {
    container.innerHTML = placeholderText
      ? `<p class="console-placeholder">${placeholderText}</p>`
      : "";
  }

  /* ================================================================
     MODO WEB (HTML + CSS + JS com preview ao vivo)
     ================================================================ */

  function initWebMode() {
    const editorEl = document.getElementById("webEditor");
    const gutterEl = document.getElementById("webGutter");
    const tabs = document.querySelectorAll("#webEditorTabs .editor-tab");
    const preview = document.getElementById("webPreview");
    const consoleEl = document.getElementById("webConsole");
    const runBtn = document.getElementById("webRunBtn");
    const exampleBtn = document.getElementById("webExampleBtn");
    const clearBtn = document.getElementById("webClearBtn");
    const consoleClearBtn = document.getElementById("webConsoleClear");

    let activeLang = "html";
    const buffers = {
      html: loadCode("html"),
      css: loadCode("css"),
      js: loadCode("js"),
    };

    function showLang(lang) {
      buffers[activeLang] = editorEl.value; // guarda o que estava sendo editado
      activeLang = lang;
      editorEl.value = buffers[lang];
      const lines = editorEl.value.split("\n").length;
      let out = "";
      for (let i = 1; i <= lines; i++) out += i + "\n";
      gutterEl.textContent = out.trimEnd();

      tabs.forEach((t) => t.classList.toggle("active", t.dataset.lang === lang));
    }

    editorEl.addEventListener("input", () => {
      buffers[activeLang] = editorEl.value;
      saveCode(activeLang, editorEl.value);
      const lines = editorEl.value.split("\n").length;
      let out = "";
      for (let i = 1; i <= lines; i++) out += i + "\n";
      gutterEl.textContent = out.trimEnd();
    });

    editorEl.addEventListener("scroll", () => { gutterEl.scrollTop = editorEl.scrollTop; });

    editorEl.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = editorEl.selectionStart, end = editorEl.selectionEnd;
        editorEl.value = editorEl.value.slice(0, start) + "  " + editorEl.value.slice(end);
        editorEl.selectionStart = editorEl.selectionEnd = start + 2;
        editorEl.dispatchEvent(new Event("input"));
      }
    });

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => showLang(tab.dataset.lang));
    });

    function run() {
      buffers[activeLang] = editorEl.value;
      clearConsole(consoleEl);

      const doc = `<!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>${buffers.css}</style>
        ${CONSOLE_BRIDGE}
        </head><body>${buffers.html}
        <script>${buffers.js}<\/script>
        </body></html>`;

      preview.srcdoc = doc;
    }

    runBtn.addEventListener("click", run);

    exampleBtn.addEventListener("click", () => {
      buffers.html = DEFAULTS.html;
      buffers.css = DEFAULTS.css;
      buffers.js = DEFAULTS.js;
      Object.keys(buffers).forEach((k) => saveCode(k, buffers[k]));
      showLang(activeLang);
      run();
    });

    clearBtn.addEventListener("click", () => {
      buffers[activeLang] = "";
      saveCode(activeLang, "");
      showLang(activeLang);
    });

    consoleClearBtn.addEventListener("click", () => clearConsole(consoleEl));

    showLang("html");
    run();

    return { run, getContent: () => buffers[activeLang], getLang: () => activeLang, getBuffers: () => buffers };
  }

  /* ================================================================
     MODO JAVASCRIPT (isolado, sem HTML/CSS)
     ================================================================ */

  function initJsMode() {
    const editorEl = document.getElementById("jsEditor");
    const gutterEl = document.getElementById("jsGutter");
    const consoleEl = document.getElementById("jsConsole");
    const runBtn = document.getElementById("jsRunBtn");
    const exampleBtn = document.getElementById("jsExampleBtn");
    const clearBtn = document.getElementById("jsClearBtn");
    const copyBtn = document.getElementById("jsCopyBtn");
    const consoleClearBtn = document.getElementById("jsConsoleClear");

    const editor = setupEditor(editorEl, gutterEl, "javascript");
    let hiddenFrame = null;

    function run() {
      clearConsole(consoleEl);
      if (hiddenFrame) hiddenFrame.remove();

      hiddenFrame = document.createElement("iframe");
      hiddenFrame.style.display = "none";
      hiddenFrame.setAttribute("sandbox", "allow-scripts");
      document.body.appendChild(hiddenFrame);

      const code = editor.value;
      const doc = `<!DOCTYPE html><html><head>${CONSOLE_BRIDGE}</head><body>
        <script>
          try {
            ${code}
          } catch (err) {
            console.error(err.name + ": " + err.message);
          }
        <\/script>
        </body></html>`;

      hiddenFrame.srcdoc = doc;
    }

    runBtn.addEventListener("click", run);
    exampleBtn.addEventListener("click", () => { editor.value = DEFAULTS.javascript; saveCode("javascript", editor.value); run(); });
    clearBtn.addEventListener("click", () => { editor.value = ""; saveCode("javascript", ""); });
    copyBtn.addEventListener("click", () => copyToClipboard(editor.value, copyBtn));
    consoleClearBtn.addEventListener("click", () => clearConsole(consoleEl));

    return { run, getContent: () => editor.value };
  }

  /* ================================================================
     MODO PYTHON (Pyodide — Python real rodando via WebAssembly)
     ================================================================ */

  function initPythonMode() {
    const editorEl = document.getElementById("pyEditor");
    const gutterEl = document.getElementById("pyGutter");
    const consoleEl = document.getElementById("pyConsole");
    const runBtn = document.getElementById("pyRunBtn");
    const exampleBtn = document.getElementById("pyExampleBtn");
    const clearBtn = document.getElementById("pyClearBtn");
    const copyBtn = document.getElementById("pyCopyBtn");
    const consoleClearBtn = document.getElementById("pyConsoleClear");

    const editor = setupEditor(editorEl, gutterEl, "python");

    let pyodideInstance = null;
    let pyodideLoading = null;

    function loadPyodideOnce() {
      if (pyodideInstance) return Promise.resolve(pyodideInstance);
      if (pyodideLoading) return pyodideLoading;

      clearConsole(consoleEl);
      const loadingLine = document.createElement("div");
      loadingLine.className = "py-loading";
      loadingLine.innerHTML = `<span class="py-spinner"></span> Carregando ambiente Python (primeira vez pode levar alguns segundos)...`;
      consoleEl.appendChild(loadingLine);

      pyodideLoading = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.onload = async () => {
          try {
            const pyodide = await window.loadPyodide();
            pyodide.setStdout({ batched: (msg) => appendConsoleLine(consoleEl, "log", msg) });
            pyodide.setStderr({ batched: (msg) => appendConsoleLine(consoleEl, "error", msg) });
            pyodideInstance = pyodide;
            loadingLine.remove();
            resolve(pyodide);
          } catch (err) {
            loadingLine.remove();
            reject(err);
          }
        };
        script.onerror = () => {
          loadingLine.remove();
          reject(new Error("Não foi possível carregar o Python. Verifique sua conexão com a internet."));
        };
        document.head.appendChild(script);
      });

      return pyodideLoading;
    }

    async function run() {
      runBtn.disabled = true;
      try {
        const pyodide = await loadPyodideOnce();
        clearConsole(consoleEl);
        try {
          await pyodide.runPythonAsync(editor.value);
        } catch (err) {
          appendConsoleLine(consoleEl, "error", err.message || String(err));
        }
      } catch (err) {
        clearConsole(consoleEl);
        appendConsoleLine(consoleEl, "error", err.message || String(err));
      } finally {
        runBtn.disabled = false;
      }
    }

    runBtn.addEventListener("click", run);
    exampleBtn.addEventListener("click", () => { editor.value = DEFAULTS.python; saveCode("python", editor.value); });
    clearBtn.addEventListener("click", () => { editor.value = ""; saveCode("python", ""); });
    copyBtn.addEventListener("click", () => copyToClipboard(editor.value, copyBtn));
    consoleClearBtn.addEventListener("click", () => clearConsole(consoleEl, "O resultado do seu código Python aparece aqui."));

    return { run, getContent: () => editor.value };
  }

  /* ================================================================
     MODO PHP (sem execução — servidor necessário)
     ================================================================ */

  function initPhpMode() {
    const editorEl = document.getElementById("phpEditor");
    const gutterEl = document.getElementById("phpGutter");
    const exampleBtn = document.getElementById("phpExampleBtn");
    const clearBtn = document.getElementById("phpClearBtn");
    const copyBtn = document.getElementById("phpCopyBtn");

    const editor = setupEditor(editorEl, gutterEl, "php");

    exampleBtn.addEventListener("click", () => { editor.value = DEFAULTS.php; saveCode("php", editor.value); });
    clearBtn.addEventListener("click", () => { editor.value = ""; saveCode("php", ""); });
    copyBtn.addEventListener("click", () => copyToClipboard(editor.value, copyBtn));

    return { getContent: () => editor.value };
  }

  /* ================================================================
     UTILITÁRIOS: copiar e baixar
     ================================================================ */

  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      const original = btn.textContent;
      btn.textContent = "Copiado!";
      setTimeout(() => { btn.textContent = original; }, 1400);
    }).catch(() => {
      alert("Não foi possível copiar automaticamente. Selecione o código manualmente.");
    });
  }

  function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  /* ================================================================
     TROCA DE MODO (Web / JavaScript / Python / PHP)
     ================================================================ */

  function initModeSwitcher(modes) {
    const tabs = document.querySelectorAll("#modeTabs .mode-tab");
    const panels = document.querySelectorAll(".mode-panel");
    let currentMode = "web";

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        currentMode = tab.dataset.mode;
        tabs.forEach((t) => t.classList.toggle("active", t === tab));
        panels.forEach((p) => { p.hidden = p.dataset.modePanel !== currentMode; });
      });
    });

    document.getElementById("downloadBtn").addEventListener("click", () => {
      const extMap = { web: "html", javascript: "js", python: "py", php: "php" };
      const ext = extMap[currentMode];
      let content;
      if (currentMode === "web") {
        const buffers = modes.web.getBuffers();
        content = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${buffers.css}\n</style>\n</head>\n<body>\n${buffers.html}\n<script>\n${buffers.js}\n</script>\n</body>\n</html>`;
      } else {
        content = modes[currentMode].getContent();
      }
      downloadFile(`codigo.${ext}`, content);
    });

    document.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (currentMode === "web") modes.web.run();
        else if (currentMode === "javascript") modes.javascript.run();
        else if (currentMode === "python") modes.python.run();
      }
    });
  }

  /* ================================================================
     RECEBE MENSAGENS DOS IFRAMES (console do modo Web e JS)
     ================================================================ */

  function initConsoleBridge() {
    window.addEventListener("message", (e) => {
      if (!e.data || e.data.source !== "etb-console") return;

      const webPanel = document.querySelector('[data-mode-panel="web"]');
      const jsPanel = document.querySelector('[data-mode-panel="javascript"]');
      const target = webPanel && !webPanel.hidden ? document.getElementById("webConsole") : document.getElementById("jsConsole");

      appendConsoleLine(target, e.data.level, e.data.text);
    });
  }

  /* ================================================================
     INIT
     ================================================================ */

  document.addEventListener("DOMContentLoaded", () => {
    const modes = {
      web: initWebMode(),
      javascript: initJsMode(),
      python: initPythonMode(),
      php: initPhpMode(),
    };
    initModeSwitcher(modes);
    initConsoleBridge();
  });
})();
