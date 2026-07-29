# Your tasks

Everything not on this list is mine. Deadline: **Tue 4 Aug**.

---

## 1. Interviews — 6 people ⚠️ HIGHEST PRIORITY

**Why it can't slip:** Part 2 of the brief requires 5–6 interviews, and Part 3 is supposed to show
where real people *challenged* the AI findings. Without it, a quarter of the project is missing and
the rest loses its argument. This is also the only task nobody else can do — I can build every other
piece, but not this one.

**It's smaller than it sounds.** You need six people who order groceries on an app and will talk to
you for 15 minutes. Flatmates, cousins, parents, classmates, colleagues, neighbours. No prep on
their side, no incentive, no scheduling tool.

**What to send** (copy-paste, from `research/screener.md`):

> Hey! I'm doing my graduation project on how people shop on quick-commerce apps (Blinkit / Zepto /
> Instamart). Looking for people who order at least a few times a month to do a **15-minute call** —
> I just want to hear how you actually shop, no prep needed, nothing to sell. Free whenever suits
> you this week. Interested?

**Before booking, check three things:** they order 3+ times a month, they've used these apps 6+
months, and when asked what they bought last month they name **2 or fewer** categories. That third
one is the whole segment — if they rattle off six categories, thank them and move on.

**Run the call** using `research/discussion-guide.md`. Record it (ask first). Ask them to have the
app open — memory is unreliable, order history isn't.

**Send me the transcripts** — drop them in `research/transcripts/` as `P01.md`, `P02.md`, etc., no
real names. I'll do the analysis.

**Target: 2 on Thu, 2 on Fri, 2 on Sat.**

---

## 2. Survey — build the Google Form

~15 minutes. Questions are written out in `research/survey.md`; copy them into a Google Form.

Push it to college and hostel WhatsApp groups, an Instagram story, LinkedIn. Target 40 responses.

**Leave Q12 in** ("would you be up for a 15-minute call?"). A form that reaches 40 people usually
converts 3–5 into willing interviewees, already screened. It is probably your easiest route to
task 1.

---

## 3. Reddit credentials — 5 minutes, optional but valuable

The Play Store corpus is terse — median review is 82 characters, mostly complaints. Reddit is the
one source in reach where people write paragraphs explaining *why* they buy what they buy, which is
exactly the mechanism-level signal the analysis needs.

1. Go to https://www.reddit.com/prefs/apps → **create app** → type: **script**
2. Name it anything, redirect URI `http://localhost:8080`
3. Add two repository secrets (Settings → Secrets and variables → Actions):
   - `REDDIT_CLIENT_ID` — the string under the app name
   - `REDDIT_CLIENT_SECRET` — the "secret" field

Then tell me and I'll re-run collection with Reddit included.

---

## 4. Rotate the API key you pasted in chat

If you haven't already: delete that key at https://aistudio.google.com/apikey and create a new one.
Chat transcripts are stored, so treat anything pasted there as public.

---

## Done

- [x] `GEMINI_API_KEY` added as a repository secret

## Not yours

Corpus collection, enrichment, clustering, insights, validation, the MVP, the measurement plan and
the write-ups. I'll flag anything that needs a decision from you.
