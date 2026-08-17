// Render docs/06-prd.md to a print-quality PDF via Chromium.
import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';

const body = readFileSync('/tmp/claude-0/-home-user-Blinkit/e5c17ff5-eac2-599b-bdfc-7d50feffa1c0/scratchpad/prd-body.html', 'utf8');

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  :root{
    --ink:#1a1d29; --body:#2b3140; --muted:#5a6270; --dim:#8b93a1;
    --line:#dfe4ec; --tint:#f5f7fa; --tinty:#fdf6e3;
    --blue:#1d6fb8; --orange:#c4552b; --yellow:#f8cb46;
    --mono:"DejaVu Sans Mono",monospace;
  }
  @page { size: A4; margin: 17mm 15mm 16mm 15mm; }
  *{box-sizing:border-box}
  body{margin:0;color:var(--body);font:10.5pt/1.55 "DejaVu Sans",Arial,sans-serif;}

  h1{font-size:23pt;line-height:1.15;color:var(--ink);margin:0 0 4pt;letter-spacing:-.4pt}
  h2{font-size:14pt;color:var(--ink);margin:20pt 0 6pt;padding-top:5pt;
     border-top:1.5pt solid var(--ink);break-after:avoid}
  h3{font-size:11.5pt;color:var(--ink);margin:13pt 0 4pt;break-after:avoid}
  h1+table{margin-top:10pt}
  p{margin:0 0 7pt}
  ul,ol{margin:0 0 8pt;padding-left:15pt}
  li{margin-bottom:3pt}
  strong{color:var(--ink)}
  a{color:var(--blue);text-decoration:none;word-break:break-all}
  hr{border:0;border-top:1pt solid var(--line);margin:14pt 0}

  code{font-family:var(--mono);font-size:8.6pt;background:var(--tint);
       border:0.6pt solid var(--line);border-radius:2pt;padding:0.5pt 2.5pt;color:var(--ink)}
  pre{background:var(--ink);color:#e2e7f0;padding:8pt 10pt;border-radius:4pt;
      font-family:var(--mono);font-size:8.4pt;line-height:1.5;margin:8pt 0 10pt;
      white-space:pre-wrap;break-inside:avoid}
  pre code{background:none;border:0;color:inherit;font-size:inherit;padding:0}

  table{width:100%;border-collapse:collapse;margin:8pt 0 11pt;font-size:9.2pt;break-inside:auto}
  thead{display:table-header-group}
  tr{break-inside:avoid}
  th{background:var(--ink);color:#fff;text-align:left;padding:5pt 7pt;font-size:8.8pt}
  td{padding:5pt 7pt;border-bottom:0.6pt solid var(--line);vertical-align:top}
  tbody tr:nth-child(even){background:var(--tint)}

  blockquote{margin:9pt 0;padding:8pt 12pt;background:var(--tinty);
             border-left:3pt solid var(--yellow);break-inside:avoid}
  blockquote p:last-child{margin-bottom:0}
  blockquote strong{color:var(--orange)}
</style></head><body>${body}</body></html>`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'networkidle' });
await page.pdf({
  path: '/tmp/claude-0/-home-user-Blinkit/e5c17ff5-eac2-599b-bdfc-7d50feffa1c0/scratchpad/PRD.pdf',
  format: 'A4',
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate:
    '<div style="width:100%;font-size:7.5pt;color:#8b93a1;font-family:DejaVu Sans,Arial,sans-serif;' +
    'padding:0 15mm;display:flex;justify-content:space-between;">' +
    '<span>Category Spark — PRD · Blinkit Growth</span>' +
    '<span class="pageNumber"></span></div>',
  margin: { top: '17mm', bottom: '16mm', left: '15mm', right: '15mm' },
});
await browser.close();
console.log('PDF written');
