import re
from pathlib import Path

pages = Path(__file__).resolve().parent.parent / "pages"
script_new = """  <script type="module">
    import { boot } from '../js/init.js';
    import { injectPageContent } from '../js/content-page.js';
    boot(() => injectPageContent());
  </script>"""

for f in pages.glob("*.html"):
    text = f.read_text(encoding="utf-8")
    pid = f.stem
    if "data-page=" not in text:
        if "<body class=" in text:
            text = text.replace("<body class=", f'<body data-page="{pid}" class=', 1)
        else:
            text = text.replace("<body>", f'<body data-page="{pid}">', 1)
    text = re.sub(
        r"<script type=\"module\">.*?</script>",
        script_new,
        text,
        count=1,
        flags=re.DOTALL,
    )
    f.write_text(text, encoding="utf-8")
    print(pid, "ok")
