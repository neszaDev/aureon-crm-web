/** Languages of the code editor demo. */
export const CODE_LANGUAGES = ['markdown', 'javascript', 'html'] as const;

export type CodeLanguage = (typeof CODE_LANGUAGES)[number];

/** Sample documents of the code editor demo, one per language (code, so not translated). */
export const CODE_SAMPLES: Record<CodeLanguage, string> = {
  markdown: `### [CodeMirror](https://codemirror.net)
A versatile _text_ editor implemented in **JavaScript** for the browser.
It is specialized for editing \`code\`, and comes with a number of language modes and addons that implement more advanced editing functionality.
`,
  javascript: `const component = {
\tname: "react-codemirror",
\tauthor: "uiwjs",
\trepo: "https://github.com/uiwjs/react-codemirror"
};`,
  html: `<!DOCTYPE html>
<html lang="en">
<head>

  <meta charset="utf-8"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
  <meta name="description" content=""/>
  <meta name="author" content="Marksheet"/>
  <meta name="keyword" content=""/>
  <link rel="shortcut icon" href="img/favicon.png"/>

  <title></title>

  <!-- Icons -->
  <link href="node_modules/lucide-static/font/lucide.css" rel="stylesheet"/>

  <!-- Main styles for this application -->
  <link href="css/style.css" rel="stylesheet"/>

</head>


<body>
  <header class="app-header">
  <h1>I ♥ Marksheet</h1>
  ...
</header>
  <div class="app-body">
    <div class="sidebar">
      ...
    </div>
    <!-- Main content -->
    <main class="main">

    </main>
  </div>
  <footer class="app-footer">
    ...
  </footer>

  <!-- Main scripts -->
  <script src="js/app-config.js"></script>
  <script src="js/app.js"></script>

</body>
</html>`,
};
