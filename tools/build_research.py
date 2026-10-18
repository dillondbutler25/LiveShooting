# python3 tools/build_research.py  -> regenerates research.html from RESEARCH.md
import markdown, re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
md = (root / 'RESEARCH.md').read_text()
body = markdown.markdown(md, extensions=['tables'])
body = re.sub(r'(?<!href=")(https?://[^\s<)]+)', r'<a href="\1">\1</a>', body)
body = body.replace('<table>', '<div class="tbl"><table>').replace('</table>', '</table></div>')
html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Shot Coach Research</title>
<style>
:root{{--bg:#0a0a0c;--panel:#131316;--line:#26262c;--text:#ececef;--dim:#8f8f99;--orange:#ff6b1a;color-scheme:dark}}
body{{margin:0;background:var(--bg);color:var(--text);font:15px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
padding-block:calc(20px + env(safe-area-inset-top,0px)) calc(32px + env(safe-area-inset-bottom,0px));
padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:900px;margin:0 auto}}
h1{{font-size:clamp(26px,6vw,36px);line-height:1.1;letter-spacing:-.02em;text-wrap:balance}}
h2{{margin-top:2em;font-size:20px}} p,li{{max-width:68ch}} a{{color:var(--text);word-break:break-word}}
.tbl{{overflow-x:auto;border:1px solid var(--line);border-radius:12px}}
table{{border-collapse:collapse;font-size:13.5px;min-width:720px}}
th,td{{text-align:left;vertical-align:top;padding:9px 10px;border-top:1px solid var(--line)}}
th{{font:500 11px/1.3 "SF Mono",ui-monospace,Menlo,monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);border-top:0;background:var(--panel)}}
.back{{font:12px "SF Mono",ui-monospace,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--orange);text-decoration:none}}
</style></head><body><main><a class="back" href="./">← Back to the coach</a>
{body}
</main></body></html>'''
(root / 'research.html').write_text(html)
print('wrote research.html', len(html))
