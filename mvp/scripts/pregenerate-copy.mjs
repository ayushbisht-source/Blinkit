// Pre-generate the LLM-written card copy at build time.
//
//   ANTHROPIC_API_KEY=... node mvp/scripts/pregenerate-copy.mjs
//   GROQ_API_KEY=...      node mvp/scripts/pregenerate-copy.mjs
//   GEMINI_API_KEY=...    node mvp/scripts/pregenerate-copy.mjs
//
// Why this exists. The deployed MVP is a static site, so it cannot hold an API key — which meant
// the live demo only ever showed the deterministic fallback copy. That understates what the agent
// does: a reviewer sees template strings and reasonably concludes the LLM is decorative.
//
// So the LLM runs in CI instead, where the key is a repository secret, and its output is baked into
// the site as data. The published demo then shows genuine model-written copy, the key never reaches
// a browser, and the deterministic path stays exactly where it belongs — as the fallback that keeps
// the demo alive if this step is ever skipped or the key expires.
//
// What is NOT pre-generated: the decisions. Mode, category, product and the price anchor are all
// computed by the same deterministic code the eval suite tests. Only the wording comes from here.

import { writeFileSync, mkdirSync } from 'node:fs';
import { USERS, CATALOGUE, PRODUCTS_BY_ID } from '../data/seed.js';
import { decideMode, priceAnchor, trialPack, mostReordered, categoryHistory } from '../agent/eligibility.js';
import { candidateCategories } from '../agent/suggest.js';

// Provider-agnostic, for the same reason engine/llm.py is: this script was hardcoded to Anthropic
// and would have silently produced deterministic-only copy on the next redeploy, because that
// balance is empty. The site would still work — the fallback is real — but the demo would quietly
// stop showing what the agent can actually write, which is the whole point of this step.
//
// First key present wins. Free providers are listed first deliberately: a project that can be
// reproduced without a paid account is worth more here than a marginally better sentence.
const PROVIDERS = [
  {
    name: 'groq',
    key: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL_STRONG ?? 'llama-3.3-70b-versatile',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    headers: (k) => ({ 'content-type': 'application/json', authorization: `Bearer ${k}` }),
    body: (model, system, user) => ({
      model,
      max_tokens: 300,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    }),
    text: (b) => b.choices?.[0]?.message?.content ?? '',
  },
  {
    name: 'gemini',
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL_STRONG ?? 'gemini-flash-latest',
    url: null, // built per call, key goes in the query string
    headers: () => ({ 'content-type': 'application/json' }),
    body: (model, system, user) => ({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 800 },
    }),
    text: (b) => b.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '',
  },
  {
    name: 'anthropic',
    key: process.env.ANTHROPIC_API_KEY,
    model: process.env.ANTHROPIC_MODEL_STRONG ?? 'claude-sonnet-5',
    url: 'https://api.anthropic.com/v1/messages',
    headers: (k) => ({
      'content-type': 'application/json',
      'x-api-key': k,
      'anthropic-version': '2023-06-01',
    }),
    body: (model, system, user) => ({
      model,
      max_tokens: 300,
      // The system prompt is identical across every user, so caching it is close to free.
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: user }],
    }),
    // First TEXT block, not block 0. When a model returns extended thinking, block 0 has no
    // `.text` — the same defect that broke extraction on the Python side for a full run.
    text: (b) => (b.content ?? []).find((x) => x.type === 'text' && x.text)?.text ?? '',
  },
];

const PROVIDER = PROVIDERS.find((p) => p.key);
const KEY = PROVIDER?.key;
const MODEL = PROVIDER ? `${PROVIDER.name}:${PROVIDER.model}` : null;
const OUT = new URL('../data/llm-copy.json', import.meta.url);

const SYSTEM = `You write one-line copy for a single product suggestion card in an Indian
quick-commerce app (Blinkit-style). The card appears at cart review, after the user has finished
adding what they came for.

Research constraints this copy must respect:
- Users arrive knowing what they want. 38 of 40 surveyed do not browse. Copy must be readable in
  about two seconds.
- The reason must reference the user's OWN purchase history or a signal they declared. Generic
  copy ("customers like you love this") is exactly the noise these users already ignore.
- Do not mention price. A separate line already shows a price anchor computed from their own spend.
- Indian English. Plain, direct, no marketing gloss, no exclamation marks, no emoji.

Return JSON only:
{"reason": "<max 12 words>", "trust": "<max 10 words, why this specific product is a safe first pick>"}`;

function factsFor(user) {
  const decision = decideMode(user);
  if (decision.mode === 'none') return null;

  const owned = Object.keys(categoryHistory(user));
  let category, product, driver = null;

  if (decision.mode === 'B') {
    category = decision.category;
    const tried = (decision.triedProductIds ?? []).map((id) => PRODUCTS_BY_ID[id]).filter((p) => p?.stock > 0);
    product = tried[0] ?? mostReordered(CATALOGUE, category);
  } else {
    const cands = candidateCategories(user, decision.owned);
    if (!cands.length) return null;
    category = cands[0].category;
    product = cands[0].trial;
    driver = cands[0].driver;
  }
  if (!product) return null;

  return { decision, owned, category, product, driver, anchor: priceAnchor(user, product) };
}

function promptFor(user, f) {
  const lines = [
    `Mode: ${f.decision.mode === 'B' ? 'B (they tried this category once and did not return)' : 'A (they have never bought this category)'}`,
    `Category to suggest: ${f.category}`,
    `Product: ${f.product.name} (${f.product.pack})`,
    `Categories they already buy: ${f.owned.join(', ') || 'none on record'}`,
    `Declared signals: ${(user.signals ?? []).join(', ') || 'none'}`,
  ];
  if (f.decision.mode === 'B') lines.push(`Days since that single purchase: ${f.decision.lapsedDays}`);
  if (f.driver?.kind === 'signal') lines.push(`Strongest true reason: they declared "${f.driver.signal.replace(/_/g, ' ')}"`);
  if (f.driver?.kind === 'adjacency') lines.push(`Strongest true reason: they regularly buy ${f.driver.ownedCategory}`);
  lines.push('', 'Write the card copy. The reason must be true given the facts above.');
  return lines.join('\n');
}

async function generate(user, f) {
  const url =
    PROVIDER.name === 'gemini'
      ? `https://generativelanguage.googleapis.com/v1beta/models/${PROVIDER.model}:generateContent?key=${KEY}`
      : PROVIDER.url;

  const res = await fetch(url, {
    method: 'POST',
    headers: PROVIDER.headers(KEY),
    body: JSON.stringify(PROVIDER.body(PROVIDER.model, SYSTEM, promptFor(user, f))),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const text = PROVIDER.text(await res.json());
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`no JSON in response: ${text.slice(0, 120)}`);
  return JSON.parse(match[0]);
}

const out = {};
let ok = 0;
let failed = 0;

if (PROVIDER) console.log(`Generating card copy with ${MODEL}`);

for (const user of USERS) {
  const f = factsFor(user);
  if (!f) {
    console.log(`  ${user.id}  no card (${decideMode(user).why ?? 'not eligible'}) — nothing to write`);
    continue;
  }
  if (!KEY) {
    failed++;
    continue;
  }
  try {
    const copy = await generate(user, f);
    if (copy?.reason && copy?.trust) {
      out[user.id] = {
        category: f.category,
        productId: f.product.id,
        reason: copy.reason,
        trust: copy.trust,
        model: MODEL,
        generatedAt: new Date().toISOString(),
      };
      ok++;
      console.log(`  ${user.id}  "${copy.reason}"`);
    }
  } catch (err) {
    failed++;
    console.warn(`  ${user.id}  failed: ${err.message}`);
  }
}

mkdirSync(new URL('../data/', import.meta.url), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));

if (!KEY) {
  console.log(
    '\nNo GROQ_API_KEY, GEMINI_API_KEY or ANTHROPIC_API_KEY — wrote an empty file. ' +
      'The site falls back to deterministic copy.'
  );
} else {
  console.log(`\n${ok} generated, ${failed} failed -> mvp/data/llm-copy.json`);
}
// Never fail the build: an empty or partial file degrades to the deterministic path, which is a
// working demo. A deployment blocked on copy generation would be worse than slightly plainer copy.
process.exit(0);
