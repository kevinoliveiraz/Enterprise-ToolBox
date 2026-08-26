document.addEventListener("DOMContentLoaded", () => {

  const editor = document.getElementById("htmlEditor");
  const gutter = document.getElementById("htmlGutter");

  const lineCount = document.getElementById("lineCount");
  const charCount = document.getElementById("charCount");

  const openBtn = document.getElementById("openBtn");
  const exampleBtn = document.getElementById("exampleBtn");
  const copyBtn = document.getElementById("copyBtn");
  const clearBtn = document.getElementById("clearBtn");

  const errorBox = document.getElementById("errorBox");
  const errorMessage = document.getElementById("errorMessage");

  const STORAGE_KEY = "enterprise_toolbox_html_test";

  const EXAMPLE_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Teste HTML</title>

  <style>
    body {
      font-family: Arial, sans-serif;
      background: #f6f7fb;
      margin: 0;
      padding: 40px;
    }

    .card {
      max-width: 500px;
      margin: auto;
      background: white;
      padding: 30px;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,.08);
    }

    h1 {
      color: #5b3fe0;
    }

    button {
      border: 0;
      background: #5b3fe0;
      color: white;
      padding: 12px 18px;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>

<body>

  <div class="card">

    <h1>Enterprise ToolBox</h1>

    <p>
      HTML, CSS e JavaScript funcionando juntos.
    </p>

    <button id="teste">
      Clique aqui
    </button>

  </div>

  <script>
    document
      .getElementById("teste")
      .addEventListener("click", () => {
        alert("JavaScript funcionando!");
      });
  <\/script>

</body>
</html>`;


  /* =========================================================
     EDITOR
  ========================================================= */

  function updateEditor() {

    const content = editor.value;

    const totalLines =
      content.split("\n").length;

    const numbers = [];

    for (
      let i = 1;
      i <= totalLines;
      i++
    ) {
      numbers.push(i);
    }

    gutter.textContent =
      numbers.join("\n");


    lineCount.textContent =
      `${totalLines} ${
        totalLines === 1
          ? "linha"
          : "linhas"
      }`;


    charCount.textContent =
      `${content.length.toLocaleString("pt-BR")} ${
        content.length === 1
          ? "caractere"
          : "caracteres"
      }`;
  }


  editor.addEventListener(
    "input",
    () => {

      updateEditor();

      localStorage.setItem(
        STORAGE_KEY,
        editor.value
      );

      hideError();
    }
  );


  editor.addEventListener(
    "scroll",
    () => {

      gutter.scrollTop =
        editor.scrollTop;
    }
  );


  /* =========================================================
     TAB
  ========================================================= */

  editor.addEventListener(
    "keydown",
    event => {

      if (event.key === "Tab") {

        event.preventDefault();

        const start =
          editor.selectionStart;

        const end =
          editor.selectionEnd;


        editor.value =
          editor.value.substring(
            0,
            start
          ) +
          "  " +
          editor.value.substring(
            end
          );


        editor.selectionStart =
          editor.selectionEnd =
            start + 2;


        editor.dispatchEvent(
          new Event("input")
        );
      }


      /* CTRL + ENTER */

      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key === "Enter"
      ) {

        event.preventDefault();

        openTest();
      }
    }
  );


  /* =========================================================
     ABRIR TESTE
  ========================================================= */

  openBtn.addEventListener(
    "click",
    openTest
  );


  function openTest() {

    hideError();

    const html =
      editor.value.trim();


    if (!html) {

      showError(
        "Cole um HTML antes de abrir o teste."
      );

      return;
    }


    /*
     * Cria um arquivo HTML temporário
     * inteiramente no navegador.
     */

    const blob =
      new Blob(
        [html],
        {
          type:
            "text/html;charset=utf-8"
        }
      );


    const url =
      URL.createObjectURL(
        blob
      );


    /*
     * Como esta função é executada
     * diretamente pelo clique,
     * o navegador deve permitir
     * a abertura da nova aba.
     */

    const newWindow =
      window.open(
        url,
        "_blank"
      );


    if (!newWindow) {

      URL.revokeObjectURL(
        url
      );

      showError(
        "O navegador bloqueou a nova aba. Permita pop-ups para este site."
      );

      return;
    }


    /*
     * Libera a URL depois que
     * o navegador já teve tempo
     * de carregá-la.
     */

    setTimeout(
      () => {

        URL.revokeObjectURL(
          url
        );

      },
      60000
    );
  }


  /* =========================================================
     EXEMPLO
  ========================================================= */

  exampleBtn.addEventListener(
    "click",
    () => {

      editor.value =
        EXAMPLE_HTML;


      editor.dispatchEvent(
        new Event("input")
      );


      editor.focus();
    }
  );


  /* =========================================================
     COPIAR
  ========================================================= */

  copyBtn.addEventListener(
    "click",
    async () => {

      if (!editor.value) {

        showError(
          "Não há HTML para copiar."
        );

        return;
      }


      try {

        await navigator.clipboard
          .writeText(
            editor.value
          );


        const original =
          copyBtn.textContent;


        copyBtn.textContent =
          "Copiado!";


        setTimeout(
          () => {

            copyBtn.textContent =
              original;

          },
          1200
        );


      } catch {

        editor.select();

        document.execCommand(
          "copy"
        );
      }
    }
  );


  /* =========================================================
     LIMPAR
  ========================================================= */

  clearBtn.addEventListener(
    "click",
    () => {

      editor.value = "";

      localStorage.removeItem(
        STORAGE_KEY
      );


      editor.dispatchEvent(
        new Event("input")
      );


      editor.focus();
    }
  );


  /* =========================================================
     ERROS
  ========================================================= */

  function showError(message) {

    errorMessage.textContent =
      message;

    errorBox.hidden =
      false;
  }


  function hideError() {

    errorMessage.textContent =
      "";

    errorBox.hidden =
      true;
  }


  /* =========================================================
     CARREGAR CONTEÚDO SALVO
  ========================================================= */

  const saved =
    localStorage.getItem(
      STORAGE_KEY
    );


  if (saved) {

    editor.value =
      saved;
  }


  updateEditor();


  console.log(
    "[Enterprise ToolBox] Testador HTML carregado."
  );

});
