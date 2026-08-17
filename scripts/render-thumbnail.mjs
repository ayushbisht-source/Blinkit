import { chromium } from 'playwright-core';
import { readFileSync } from 'fs';
const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
const p = await b.newPage({viewport:{width:1200,height:630}, deviceScaleFactor:2});
await p.setContent(readFileSync('thumb.html','utf8'), {waitUntil:'networkidle'});
await p.screenshot({path:'thumbnail.png'});
const over = await p.evaluate(()=>({
  w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight}));
console.log('content box:', over);
await b.close();
