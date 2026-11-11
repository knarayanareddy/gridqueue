# Build spec — **GridQueue**: a verifiable answer to "can I get power here, and when?", with a MiroFish agent simulation

> **Read this file top to bottom before touching a terminal.** It is the only context you get.
> Every number is sourced in §20. **Do not invent a date, a quotation, a kW limit or a postcode mapping.**
>
> **This build has a special condition: a substantial part of it already exists.** A working repository
> (`knarayanareddy/gridqueue-grid-connection`, Apache-2.0, 236 tests passing, public demo, deterministic
> citation gate) was written for a different hackathon. §0 tells you exactly what to do about that. Read §0
> before anything else.

---

## 0. Start here — what already exists, and the rule about it

### 0.1 What exists (verified by cloning and running it)

| Component | Status | What it is |
|---|---|---|
| Test suite | **236 passing** in ~4 s from a clean clone (`pytest -q` in `backend/`) | run it on stage if asked |
| **Deterministic citation gate** | Built, **pure Python, 0 LLM calls** | four checks: quote-in-source, date-in-quote, kW-in-quote, route-in-quote. A test parses imports and fails if any HTTP client enters the gate module |
| **Gate A/B experiment** | Measured, on a **synthetic** 29-case set | **21/21 fabrications blocked**, 10/10 genuine kept, **4/5 misattributions still get through** (the documented failure), 79 checks |
| Public demo | Live (static) | 52 areas × 2 directions, precomputed |
| JSON Schema contracts | v1.4.0, 20 defs | a date without a document is rejected **before** the gate runs |
| Ledger | Append-only, file-locked | every retrieval and model call, with token counts |
| Official document corpus | **0 documents** | two hand-written SYNTHETIC `.txt` fixtures. **This is the hole.** |
| Postcode → operator table | 3 ranges, marked `TODO_VERIFY` | 5600–5658, 1000–1099, 3000–3089; everything else abstains |
| Energy numbers | **none** | the ledger records tokens and latency, never a joule |

### 0.2 The disclosure rule — read this twice

This engine was built for the Nebius × NVIDIA hackathon (Devpost, 29 Oct 2026). The GBC handbook asks you to
build "a new AI-driven start-up concept". Reuse is not a rule violation anyone can find — **but hiding it is the
only real risk.** Therefore:

> **Slide 1, spoken, first ten seconds:** *"'The engine exists; this weekend we turn it into a company and a
> FairTech case.'"*

**Judges reward disclosed prior work and punish discovered prior work.** Put the same sentence in the README's
first paragraph and in the footer of the demo page. Do not let a juror find it in `LIMITATIONS.md` before you
have said it out loud.

### 0.3 What to do in the next 60 minutes

```bash
git clone https://github.com/knarayanareddy/gridqueue-grid-connection
cd gridqueue-grid-connection && cd backend && python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt && pytest -q       # expect: 236 passed
```
Then **fork it into the workspace as `gridqueue/`** and do the seven patches in §7 plus the three new surfaces
in §8–§14. **Do not rewrite the gate.** It is the intellectual core and it is the one thing that already works.

**If the repo cannot be cloned** (network blocked, licence surprise), §6 is a complete specification of the same
shape and you can build it from scratch in about 10 hours — but you will lose the 236-test asset, so try the
clone first and say so on stage if you could not.

---

## 1. The one-line thesis

> **"The model proposes, the gate disposes, the person applies."**

And the second line, which converts the biggest rubric risk into the pitch:

> **"What does the AI decide? Nothing. It decides what it can prove, and it refuses the rest."**

**Product name:** `GridQueue`. Do not rename it — the repo, the demo and the tests already carry it, and a
rename reads as a different project. Add a subtitle only: **"De aansluiting, in de woorden van de netbeheerder."**
*(The connection, in the grid operator's own words.)*

---

## 2. The problem, in numbers you may quote

| Number | Meaning |
|---|---|
| **15,498** | businesses waiting for a connection (30 Jun 2026; it was **668** in 2022) |
| **8,558** | parties waiting to *feed back* into the grid |
| **4%** | of Enexis's business queue helped in H1 2026, while the queue passed **11,000** |
| **54%** | of Enexis stations are restricted |
| **1 Jul 2026** | households and small SMEs joined the queue in **800+ postcodes** |
| **2–5 years** | the time an enlargement takes |
| ACM prioritisation | puts ordinary SMEs **last** |

The user's question is always the same and always reasonable: **"Can I get power here, and when?"** Nobody can
answer it from the operator's own words, because the answer is spread across six regional operators, one
national grid, one regulator, and a dozen PDFs that each say something slightly different.

---

## 3. What the product is (so you do not accidentally build the wrong thing)

**Input:** postcode (4 digits) + direction (consumption `afname` / feed-in `teruglevering`) + peak kW.

**Output, per direction:**
1. **A verdict**: `mogelijk` / `wachtlijst` / `congestie` / `onbekend` — never a bare green light.
2. **The operator's own sentence**, verbatim, in Dutch, with the document name, its sha256, and the retrieval
   date. One click expands it.
3. **The binding status of any date**: `bindend` / `indicatief` / `voorlopig`. An indicative date shown without
   its label is a bug, not a feature.
4. **Three ranked flexibility routes**, each with the sentence you would literally put in the application —
   or, when there is nothing to stand on, **a refusal plus a Dutch phone script** to use instead.

**What it is not:**
- ❌ Not a flexibility broker. No load simulation, no schedule optimisation, no actuator, **no code path that
  submits an application or operates a device.**
- ❌ Not a forecasting tool. It does not predict when the grid will be ready; it reports what was published.
- ❌ Not affiliated with any operator. It is the independent verifier of their publications, which is precisely
  why no operator will build it.

---

## 4. Design language

Utility-grade, documentary, calm. It should read like a well-made legal database, not a startup dashboard —
because the output is evidence.

```
--ink      #101820   near-black, all text
--paper    #FBFAF7
--paper-2  #F2F0EA   wells, table headers
--line     #D9D5CB
--muted    #5F6570
--verdict-possible  #1F6B3E   glyph ✓  word "MOGELIJK"
--verdict-waitlist  #8A5A00   glyph ⏳ word "WACHTLIJST"
--verdict-congestie #A3221C   glyph ✕  word "CONGESTIE"
--verdict-unknown   #5A6672   glyph ?  word "ONBEKEND"     (a first-class answer)
--quote             #243447   the verbatim-quote block: a left rule + serif italic Dutch text
--nonbinding        #B45309   the chip on any indicative date
```

**Never encode a verdict by colour alone** — glyph + word, always (a juror with colour-blindness will thank you
and a screenshot in greyscale must still work).

Type: **Inter** UI, **Source Serif 4** for the verbatim quotes (they are quotations — they should look like
quotations), **IBM Plex Mono** for postcodes, kW, hashes, retrieval times. Self-host `woff2`; no CDN.

**The signature component — `<Quote>`.** Every number on screen sits next to a `<Quote>`:
```
┌─────────────────────────────────────────────────────────────┐
│ ▍ "Voor het gebied met postcode 5612 is de capaciteit voor  │
│ ▍  afname beperkt; nieuwe aanvragen worden op een wachtlijst│
│ ▍  geplaatst."                                              │
│   Enexis · Capaciteitskaart · 14 okt 2026 · sha256 3f9c…a1  │
│   indicatief  ·  opgehaald 9 nov 2026  ·  [ bron openen ]   │
└─────────────────────────────────────────────────────────────┘
```
If there is no quote, there is no number. That is the rule the whole product rests on.

Footer on every screen: `Demonstratie — antwoorden zijn citaten uit openbare documenten. Geen aanvraag, geen
aansluiting, geen affiliatie met een netbeheerder.`

---

## 5. The seven patches, in priority order

Do these before anything new. Each is small and each produces a number you can put on a slide.

| # | Patch | Why it is first | Done when |
|---|---|---|---|
| **1** | **Ingest real official documents** (the corpus is 0) | The entire product is "the operator's own words" and the corpus is two synthetic text files. A judge who reads `LIMITATIONS.md` §2 will find that sentence. **This is the single highest-value hour of the two days.** | `source-register.json` lists ≥8 real documents with url, publisher, date published, date retrieved, sha256, and a byte count. Every verdict in the demo cites at least one of them. |
| **2** | **Real postcode → operator mapping** | 3 ranges marked `TODO_VERIFY`; 16 Stedin areas abstain because no fixture exists. | A `postcode4 → operator` table built from PDOK / operator open data / Mijnaansluiting.nl, with a per-row provenance note and an explicit `onbekend` where you could not verify. **Abstention is acceptable; invention is not.** |
| **3** | **The energy meter** | The rubric names "Energy and resource use" and asks for kWh per 1,000 requests. The repo records tokens and latency, never a joule. | `/energie` page: Wh per request derived **from the ledger's own token counts** plus a stated search cost, per 1,000 requests, cold and warm cache. §9. |
| **4** | **Binding-marker fix + re-run the A/B** | 4 of 5 "correct quote, wrong meaning" cases still pass the gate, and `"indicatieve"` is not even detected. You measured your own bug — now close it, and re-run `make ab`. | A binding-marker list (Dutch + English), a test per marker, and a **new** A/B number with the gap narrowed. Publish both numbers: before and after. |
| **5** | **The refusal, made beautiful** | The refusal is the product and currently renders as an error state. | A first-class `onbekend` screen with the phone script, the reason, and what would change the answer. §8.4. |
| **6** | **Payer + interviews** | Payer is the one criterion that is genuinely unvalidated. | §16.4: three interviews at the drinks, exact words written down, one quote on slide 5. |
| **7** | **Dependency map for sovereignty** | Tavily (US) and NVIDIA Nemotron on Nebius (Amsterdam-headquartered, US weights). | A table: dependency → what breaks → alternative → exit cost → what you actually ran. §17. |

---

## 6. If you must rebuild from scratch (fallback only)

Build this exact shape in Python (FastAPI) — it is what the existing repo already is:

```
gridqueue/
├─ backend/
│  ├─ app/
│  │  ├─ main.py                     # FastAPI: /api/answer, /api/areas, /api/ab, /api/energie, /api/audit
│  │  ├─ contracts/v1_4_0.json       # JSON Schema, 20 defs (§6.2)
│  │  ├─ ingest/
│  │  │  ├─ fetch.py                 # one adapter per source; writes to corpus/ with sha256
│  │  │  └─ extract.py               # model call -> raw claims (ONLY place a model is used)
│  │  ├─ gate/gate.py                # PURE PYTHON. 0 model calls. No HTTP client import.
│  │  ├─ answer.py                   # area+direction+kW -> Verdict | Refusal
│  │  ├─ ledger.py                   # append-only JSONL, file-locked
│  │  └─ corrections.json            # human-curated fixes, each with a note and a date
│  ├─ corpus/                        # the real documents + source-register.json
│  ├─ tests/                         # ≥200 tests; test_gate_is_pure.py is non-negotiable
│  └─ requirements.txt
├─ web/                              # static or Next.js: one screen + the swarm
└─ Makefile                          # make test / make ab / make sweep / make sample
```

### 6.1 The gate contract (the intellectual core — get this exactly right)

```python
# gate/gate.py — PURE. No network. No model. No randomness.
def gate(claim: Claim, source: Source) -> GateResult:
    """
    Returns one of: KEEP | DROP | REJECT, with the failing check named.
    claim: { claim_id, value, kind: "date"|"kw"|"route"|"status"|"operator", quote, area, direction }
    source: { doc_id, url, publisher, published, retrieved, sha256, text }
    """
    checks = [
        check_quote_in_source(claim, source),     # the quote must appear verbatim (normalised whitespace)
        check_date_in_quote(claim, source),       # any date the claim asserts must be IN its own quote
        check_kw_in_quote(claim, source),         # any kW figure asserted must be IN its own quote
        check_route_in_quote(claim, source),      # any route/stage asserted must be IN its own quote
        check_binding_marker(claim, source),      # NEW (patch 4): "indicatief"/"voorlopig"/"verwacht"
                                                  # in the quote => the date can never render as binding
        check_operator_match(claim, source),      # the operator named must be the source's publisher
    ]
    failed = [c for c in checks if not c.passed]
    if not failed: return GateResult.KEEP
    if any(c.severity == "fabrication" for c in failed): return GateResult.DROP
    return GateResult.REJECT
```

`tests/test_gate_is_pure.py` must parse `gate.py`'s AST, walk `Import`/`ImportFrom` nodes, and **fail** if
`requests`, `httpx`, `urllib`, `aiohttp`, `openai`, `anthropic`, `nvidia` or any other HTTP/SDK client appears.
This test is the reason a judge believes the whole pitch. Keep it.

### 6.2 The schemas that matter (v1.4.0)

```json
{
  "Verdict": { "required": ["area","direction","status","quotes","binding","retrieved_at"],
    "status": { "enum": ["mogelijk","wachtlijst","congestie","onbekend"] },
    "binding": { "enum": ["bindend","indicatief","voorlopig"] } },
  "Quote": { "required": ["text_nl","doc_id","publisher","published","sha256","url"] },
  "Route": { "required": ["rank","title_nl","why_nl","application_sentence_nl","quote_refs"] },
  "Refusal": { "required": ["reason_nl","what_would_change_it_nl","phone_script_nl","sources_checked"] },
  "EnergyEstimate": { "required": ["wh_per_request","wh_per_1000","cold_wh_per_1000","cache_hit_rate","derivation"] }
}
```
**Integrity rule enforced at the contract level:** a `Verdict` with a non-empty `quotes` **must** have
`retrieved_at`; and a `Verdict` with `status != "onbekend"` **must** have ≥1 `Quote`. If either fails, the
object does not validate and never reaches the UI. This is what "a date without a document is rejected before
the gate runs" means in practice.

### 6.3 The A/B harness

```
make ab      # runs the gate ON and OFF over tests/ab_cases.json
```
Output, printed as a table **and** written to `docs/ab-latest.md`:
```
              gate ON      gate OFF
fabrications  21 / 21      0 / 21       blocked
genuine kept  10 / 10      10 / 10
misattributed  1 / 5       5 / 5        caught
correct of shown  10 / 14  6 / 14
```
The last row is your credibility. **Show it before a judge finds it.**

---

## 7. Patch details

### 7.1 Patch 1 — the corpus (do this on hour one)

Target **8–12 real documents**, each fetched, hashed, and registered:

1. **Netbeheer Nederland** — the national capacity map / congestion overview page and its current PDF.
2. **Enexis** — capacity map page + at least one area-specific notice.
3. **Liander** — capacity map page + one area notice.
4. **Stedin** — capacity map page (they restrict the most; the abstentions matter).
5. **TenneT** — the national grid page relevant to large connections.
6. **ACM** — the prioritisation framework document for connection requests.
7. **RVO / Rijksoverheid** — the page on the 1 Jul 2026 change for households and small SMEs.
8. Any **gemeente** publication about a specific business park's grid situation.

`source-register.json` entry:
```json
{ "doc_id": "enexis-capaciteitskaart-2026-10",
  "publisher": "Enexis", "title": "Capaciteitskaart",
  "url": "…", "published": "2026-10-14", "retrieved": "2026-11-11T09:12:00Z",
  "sha256": "…", "bytes": 482113, "lang": "nl",
  "covers": { "areas": ["5612","5611"], "directions": ["afname","teruglevering"] },
  "kind": "primary" }
```
**Rules:** every document is `kind: "primary"` (the operator's own publication) or `"secondary"` (a summary
someone else wrote). **Only `primary` can produce a binding verdict.** If you can only get a secondary source,
the verdict renders with a `SECUNDAIR` chip — never as the operator's own words.

**If you get 8 documents but they cover only 4 postcode areas, that is fine and it is honest.** A narrow,
real corpus beats a broad, synthetic one, and "we cover 4 areas properly" is a better sentence than "we cover
52 areas synthetically".

### 7.2 Patch 2 — the postcode table

```
postcode4 → { operator, area_name, source_doc_id, verified: true|false, note }
```
Build it from: PDOK (Liander network boundaries), Enexis and Stedin open data, and `mijnaansluiting.nl` (which
operator serves an address). **Per row, record how you verified it.** Rows you could not verify get
`verified: false` and the answer for that postcode becomes `onbekend` with the refusal screen. **Target: 40+
postcodes verified across ≥3 operators.** Report the count on screen: `41 postcodes geverifieerd · 3 netbeheerders`.

### 7.3 Patch 3 — the energy meter (see §9)

### 7.4 Patch 4 — binding markers

```python
BINDING_MARKERS_NL = ["indicatief","indicatieve","voorlopig","verwacht","verwachting","beoogd",
                      "streven","aanvraag","aanvragen","planning","nader te bepalen","n.t.b."]
BINDING_MARKERS_EN = ["indicative","expected","expected to","planned","provisional","target","aim"]
```
Rule: if a quote contains any marker, the `binding` of that verdict is `indicatif`/`voorlopig` and **the date can
never render as a promise.** Write one test per marker. Re-run `make ab`; your misattribution catch rate should
move off 1/5 — publish the exact new number, whatever it is.

### 7.5 Patch 5 — the refusal screen (see §8.4)

### 7.6 Patch 6 — the payer (see §16.4)

### 7.7 Patch 7 — the sovereignty map (see §17)

---

## 8. The product surfaces

### 8.1 The one screen (`/`)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ GridQueue            [ 5612 ][ afname ▾ ][ 2500 kW ][ Bekijk ]           │
│ De aansluiting, in de woorden van de netbeheerder.                       │
├───────────────────────────────────────────────────────────────────────────┤
│ 5612 AB · Enexis · afname                                    ⏳ WACHTLIJST│
│                                                                           │
│ ▍"Voor het gebied met postcode 5612 is de capaciteit voor afname          │
│ ▍ beperkt; nieuwe aanvragen worden op een wachtlijst geplaatst."          │
│   Enexis · Capaciteitskaart · 14 okt 2026 · sha256 3f9c…a1                │
│   [indicatief]  ·  opgehaald 9 nov 2026  ·  2 ms  ·  [ bron openen ]      │
│                                                                           │
│ WAT DIT BETEKENT                                                          │
│  U kunt nu geen nieuwe aansluiting krijgen. De wachtlijst is niet         │
│  gegarandeerd en de volgorde is aan de netbeheerder en de ACM.            │
│                                                                           │
│ DRIE ROUTES, met de zin die u zelf kunt gebruiken                         │
│  1 · Flexibel contract (max 70% van uw piek)   [zin] [bron]               │
│  2 · Aansluiten op een ander perceel in hetzelfde gebied  [zin] [bron]    │
│  3 · Verwachte verruiming Q3 2028 — indicatief, geen toezegging           │
│                                                                           │
│ WAT DIT ANTWOORD NIET ZEGT                                                │
│  · De datum is indicatief, uit een document van 14 okt 2026.              │
│  · 16 gebieden in onze dataset geven onbekend — dit antwoord is er één.    │
└───────────────────────────────────────────────────────────────────────────┘
```
Every element above exists to make a claim checkable. **Nothing on this screen is generated prose** except the
"What this means" block, which is a template with the operator name and status slotted in — and it is labelled
`samengevat uit de bron` so nobody mistakes it for a quotation.

### 8.2 The areas index (`/gebieden`)

A table of every postcode in the corpus: postcode · operator · direction · status · binding · retrieval date ·
sha256 (truncated). Sortable. A row with no document says `onbekend — geen brondocument` in grey.

### 8.3 The A/B page (`/ab`)

The before/after table, the 29-case list with each case's three verdicts, and the one sentence:
*"Dit is onze eigen fout, gemeten, genummerd en reproduceerbaar met één commando."*

### 8.4 The refusal (`/onbekend/:postcode`) — patch 5, the money shot

This screen must be **designed**, not an error state:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ 5613 · onbekend                                              ?  GEEN BRON │
│                                                                           │
│ Wij hebben geen document van de netbeheerder dat deze postcode en        │
│ richting behandelt. Wij gokken niet.                                      │
│                                                                           │
│ WAT WEL BEKEND IS                                                        │
│  · De netbeheerder voor deze postcode is Liander (bron: mijnaansluiting)  │
│  · 1 document van Liander is opgehaald, maar dekt 5613 niet              │
│                                                                           │
│ WAT DIT ANTWOORD ZOU VERANDEREN                                          │
│  · Een Liander-publicatie die 5613 noemt → dan verschijnt hier een citaat │
│  · Een bevestiging van de netbeheerder per e-mail → dan wordt het        │
│    antwoord 'voorlopig', nooit 'bindend'                                  │
│                                                                           │
│ BELSCRIPT (Nederlands, 40 seconden)              [ kopieer ]             │
│  "Goedemiddag, u spreekt met … van … . Ik wil een aansluiting van 2.500  │
│   kW voor afname op postcode 5613. Kunt u mij zeggen of daar capaciteit  │
│   beschikbaar is, en zo nee, of er een wachtlijst is en welke status die  │
│   heeft? Ik wil graag het document of de referentie waar dat in staat."  │
│                                                                           │
│ 3 BRONNEN GEcontroleerd · 0 bruikbaar                                    │
└───────────────────────────────────────────────────────────────────────────┘
```
**Design rule:** the refusal screen gets the best typography in the product. It is the answer the user most
needs when the answer is "we don't know" — and a product that abandons you at that moment is a product that
lies by omission.

### 8.5 The energy page (`/energie`) — patch 3, see §9.

---

## 9. The energy number (patch 3) — derive it from your own ledger

The rubric asks for kWh per 1,000 requests and will not accept a paper citation. **You already log tokens.**

```
DERIVATION (show this on screen, with the ledger rows behind each term)

1. Retrieval. 1 web search per uncached area+direction. Search cost coefficient:
   0.3 Wh/search  (published measurement studies for a commercial search API).
   ledger: searches_per_request = 1 (cold) | 0 (warm)

2. Extraction. Token counts straight from ledger.jsonl:
   prompt_tokens + completion_tokens per request, averaged over the last N runs.
   Conversion: 0.39–2.4 J/token  ->  use 1.2 J/token as the central value, state the band.
   Wh = tokens * 1.2 / 3600

3. Deterministic overhead. gate + answer assembly: 0 J of inference.
   CPU energy is measured on the demo machine: (process cpu-seconds) * (TDP estimate 15 W) / 3600.
   Show the measured cpu-seconds from the last run, not a guess.

4. CACHE. An answer for (area, direction) is a pure function of the documents, so it is
   cacheable keyed on the document sha256. Warm-cache path = 0 retrieval + 0 model.

RESULT (fill in from your run; do not type a number you did not compute):
   cold path:  X Wh/request  ->  X kWh per 1,000 requests
   warm path:  Y Wh/request  ->  Y kWh per 1,000 requests
   measured cache hit rate on a full sweep of the corpus: Z%
```

**Say the trade-off out loud, because it is the honest one:** a cached answer is a *stale* answer, and staleness
is the exact failure mode the product exists to prevent. So: **cache keyed on document sha256, invalidate on
hash change**, and show `opgehaald <timestamp>` on every answer so staleness is visible rather than silent. The
number that follows from that choice is the one you report.

**Expected magnitude to sanity-check against:** ~1.5 kWh per 1,000 answers for the cold path with retrieval
dominating (~60%), dropping by roughly an order of magnitude on a warm cache. If your derivation lands wildly
outside that, check your arithmetic before you believe the answer.

---

## 10. The audit trail (reuse the repo's ledger; add a hash chain)

The repo already has an append-only, file-locked ledger. Extend it to a **hash chain** so the demo has the same
"tamper row 7" moment every other build here has:

```ts
canonicalJson(v)   // keys sorted at every level
hashRow(row)       // sha256 over { seq, ts, actor, action, subject, payload, prev_hash }
```
Append one JSON line per event under an exclusive lock; `seq` gap-free. Verifier walks the file and returns
`{ total, verified, brokenAt }`. `POST /api/audit {op:"tamper"}` must produce **`brokenAt: 7`**.

Events to log: `DOC_INGESTED` (with sha256), `CLAIM_EXTRACTED`, `GATE_KEEP|DROP|REJECT` (with the failing
check), `ANSWER_SERVED` (area, direction, wh estimate), `REFUSAL_SERVED`. **A refusal is an audited event** —
"show me every question you refused to answer" must be a query, not a promise.

---

## 11. The MiroFish swarm lab

### 11.0 The sentence, said before they ask
> **"No language model is called in here. This is a dynamical system over a synthetic population, the prior
> table is on screen, and the output is a frequency — not a forecast about the grid."**

### 11.1 Why a swarm belongs in *this* product

GridQueue's bets are all about *who believes what*:
1. an SME will accept "waiting list, and the date is not a promise" (→ `accept`),
2. an installer will pay for a verifiable answer rather than a plausible one (→ `payer`),
3. a municipality/region will treat an independent verifier as legitimate (→ `legit`),
4. a grid operator will not perceive this as an attack (→ `operator`),
5. **a refusal is more useful than a guess** — the product's whole thesis (→ `refusal`),
6. the queue is unfair and the population knows it (→ `fair`).

The swarm's job is to find which of these the population would break, and to say so as a frequency. This matters
here more than in the other two builds because **the payer is the one genuinely unvalidated criterion.**

### 11.2 Six dimensions

| id | label (NL) | left pole | right pole | blurb |
|---|---|---|---|---|
| `accept` | Een wachtlijst met een niet-bindende datum is bruikbaar | *"een datum die niets belooft is nutteloos"* | *"beter een eerlijke indicatie dan niets"* | The product's core offer, as an opinion. |
| `refusal` | Weigeren is beter dan gokken | *"een antwoord is altijd beter"* | *"liever onbekend dan onwaar"* | The thesis, tested against the people who need an answer. |
| `payer` | Bedrijven betalen voor een verifieerbaar antwoord | *"dit hoort gratis te zijn"* | *"hier betaal ik voor"* | The unvalidated criterion. |
| `legit` | Een onafhankelijke verificator is legitiem | *"alleen de netbeheerder gaat erover"* | *"een onafhankelijke bron helpt"* | Whether the neutrality story sells. |
| `operator` | Netbeheerders gaan dit niet tegenwerken | *"ze sluiten hun kaarten"* | *"ze laten het toe"* | The existential risk nobody names. |
| `fair` | De wachtlijst is eerlijk verdeeld | *"grote partijen gaan voor"* | *"de volgorde is eerlijk"* | ACM prioritisation puts ordinary SMEs last. |

### 11.3 Archetypes — **N = 240**, exact quotas

| key | label | n | who |
|---|---|---|---|
| `sme_wait` | MKB in de wachtlijst | 46 | a business actually queued today |
| `sme_free` | MKB zonder wachtrij | 30 | has a connection, may need more |
| `installer` | Installateurs / EPC-partijen | 34 | lose the deal when the answer is wrong |
| `aggregator` | Flexibiliteitsaggregatoren | 24 | monetise MW, need capacity |
| `operator` | Netbeheerders | 22 | the publishers |
| `regulator` | ACM | 12 | the prioritisation framework |
| `muni` | Gemeente / provincie | 26 | business-park desks, economic affairs |
| `bank` | Financiers / banken | 18 | lend against a connection |
| `consultant` | Adviesbureaus netcongestie | 16 | a competitor *and* a customer |
| `developer` | Projectontwikkelaars | 12 | need capacity before they can build |

```ts
export const ARCH = {
  sme_wait:   { n: 46, priors: { accept: .66, refusal: .44, payer: .58, legit: .60, operator: .48, fair: .30 }, behav: { voice: .58, susceptibility: .60, conviction: .52 } },
  sme_free:   { n: 30, priors: { accept: .48, refusal: .40, payer: .44, legit: .54, operator: .52, fair: .44 }, behav: { voice: .50, susceptibility: .62, conviction: .44 } },
  installer:  { n: 34, priors: { accept: .72, refusal: .72, payer: .86, legit: .66, operator: .56, fair: .46 }, behav: { voice: .68, susceptibility: .52, conviction: .56 } },
  aggregator: { n: 24, priors: { accept: .60, refusal: .50, payer: .78, legit: .58, operator: .44, fair: .52 }, behav: { voice: .72, susceptibility: .42, conviction: .64 } },
  operator:   { n: 22, priors: { accept: .40, refusal: .66, payer: .20, legit: .28, operator: .26, fair: .70 }, behav: { voice: .74, susceptibility: .26, conviction: .80 } },
  regulator:  { n: 12, priors: { accept: .52, refusal: .70, payer: .24, legit: .48, operator: .60, fair: .68 }, behav: { voice: .66, susceptibility: .22, conviction: .82 } },
  muni:       { n: 26, priors: { accept: .62, refusal: .56, payer: .46, legit: .72, operator: .58, fair: .40 }, behav: { voice: .62, susceptibility: .44, conviction: .60 } },
  bank:       { n: 18, priors: { accept: .58, refusal: .74, payer: .72, legit: .70, operator: .60, fair: .50 }, behav: { voice: .56, susceptibility: .34, conviction: .72 } },
  consultant: { n: 16, priors: { accept: .70, refusal: .58, payer: .64, legit: .62, operator: .62, fair: .48 }, behav: { voice: .60, susceptibility: .46, conviction: .58 } },
  developer:  { n: 12, priors: { accept: .64, refusal: .52, payer: .80, legit: .56, operator: .50, fair: .34 }, behav: { voice: .64, susceptibility: .40, conviction: .62 } },
} as const;
```

**The conflict is in the table:** `installer.payer = .86` and `operator.payer = .20`; `sme_wait.fair = .30` and
`operator.fair = .70`. Read that out loud — the people who would pay for the answer and the people who publish
the documents disagree about whether the queue is fair, and the operator is the one whose cooperation you need.

### 11.4 Personas
`buildPersonas(240, 20261111)`: id `G-001…`, synthetic Dutch company/role names from fixed lists
(`bedrijf_nl`: 60 fictional business names, `rol`: role titles), plus `sector` (logistiek, maakindustrie,
agrarisch, datacenter, woningbouw, dienstverlening), `province`, `kw_need`, and jittered priors (±0.04).
`synthetic: true` on every card, no real company is named.

### 11.5 The engine (implement exactly; ~150 lines)

```
runSwarm(personas, { rounds=24, mixing=0.18, pressure=1, seed, minEvents=3, inject? })
1  rnd = mulberry32(seed)
2  eventPlan: exactly 3 events; Fisher–Yates on eligible rounds [3..rounds-2] and on the event list;
   `inject` replaces any planned occurrence of the same story.
   NEVER arr.sort(() => rnd()-0.5) — inconsistent comparator, and the result differs between
   server and browser renders. Fisher–Yates is the only shuffle a seeded RNG can promise.
3  graph: degree 7, local = round(7*(1-mixing)) same-archetype edges + 7-local uniform, deduped.
4  opinions = prior ± 0.09 jitter.
5  per round, per agent (Fisher–Yates order):
     gap = o[j][d] - o[i][d]; likeness = 1 - min(1,|gap|*1.4)
     influence = (0.35+0.65*voice_j)*(0.4+0.6*likeness)
     openness  = susceptibility_i*(1-0.75*conviction_i)
     move = gap*influence*openness*0.42*pressure
     BACKFIRE if |gap|>0.45 && conviction_i>0.6 && rnd()<0.5: move = -sign(gap)*|gap|*0.10*pressure
6  events: opinion += effect*(0.6+0.8*rnd()) per dimension, clamped to [0,1]
7  snapshot: mean, camps (left<0.42 / swing / right>0.58), event label
8  final means; support[d] = share(opinion >= 0.5); per-agent `changed`
```

### 11.6 The nine events (Dutch copy; ≥3 must push the design backwards)

| id | label | effect |
|---|---|---|
| `weigering` | *"Een netbeheerder weigert een publieke kaart te publiceren"* | `operator −.14, legit −.06, refusal +.06` |
| `acm` | *"De ACM verscherpt de prioriteringsregels: maatschappelijk belang gaat voor"* | `fair +.10, accept −.08, payer −.04` |
| `boete` | *"Een adviesbureau krijgt een boete voor een onjuiste capaciteitsclaim"* | `refusal +.14, payer +.08, legit +.06` |
| `vrijval` | *"Er valt 40 MW vrij in een knooppunt; 300 bedrijven reageren in een week"* | `accept +.08, fair −.10, payer +.05` |
| `verruiming` | *"Een verruiming wordt achttien maanden uitgesteld"* | `accept −.10, operator −.08, refusal +.05` |
| `ai_fout` | *"Een AI-tool noemt een capaciteitsdatum die niet in het document staat; het staat op LinkedIn"* | `refusal +.18, legit −.10, payer +.04` |
| `openbaarmaking` | *"Netbeheerders moeten van de rechter al hun congestiedata openbaar maken"* | `operator +.12, legit +.10, accept +.06` |
| `procedure` | *"De gemiddelde bezwaarprocedure tegen een weigering duurt nu 14 maanden"* | `fair −.12, refusal +.06, accept −.04` |
| `buitenland` | *"Een Duitse netbeheerder publiceert per postcode realtime capaciteit"* | `operator +.08, legit +.08, accept +.10` |

### 11.7 Ensemble + the six frequencies

`runEnsemble(personas, runs = 200)`, seeds `20261111 + r*7919`; per-dimension mean/sd/p10/p50/p90 and a 0.05
histogram. **Render every frequency as `x / n runs (p = 0.000, 95% CI 0.000–0.000)`** using Wilson.

| id | question | test |
|---|---|---|
| `QACCEPT` | Do a majority of waiting SMEs accept a non-binding date as useful? | `sme_*`, `support.accept > .5` |
| `QREFUSAL` | Do a majority accept "refuse rather than guess"? | all, `support.refusal > .5` |
| `QPAYER` | Does a majority say businesses would pay? | `installer` + `aggregator` + `bank` + `developer`, `support.payer > .5` |
| `QLEGIT` | Is an independent verifier legitimate to a majority? | all, `support.legit > .5` |
| `QOPERATOR` | Do a majority expect operators not to obstruct? | all *excluding* `operator`, `support.operator > .5` |
| `QAI` | **After the "AI invented a date" story, does the refusal majority survive?** | fired `ai_fout`, all, `support.refusal > .5` |

```ts
export function wilson(p: number, n: number, z = 1.959964) {
  const d = 1 + z*z/n, c = p + z*z/(2*n), s = z*Math.sqrt(p*(1-p)/n + z*z/(4*n*n));
  return { lo: (c-s)/d, hi: (c+s)/d };
}
```

### 11.8 Honesty block (permanent, on screen)
`GEEN LLM` · `SYNTHETISCH` · `GEEN VOORSPELLING` · `PRIOREN ZIJN AANNAMES`

### 11.9 Interactive layer (the vocabulary that works — reuse it)
1. **Playback** Start/Pause/Step/Reset + `1× 2× 4×`, 24 rounds.
2. **Scrub** a round slider → the canvas re-renders that snapshot; a sparkline under it shows all six means with
   event ticks.
3. **Fire your own story** — nine chips; firing re-runs the whole simulation with `inject` (still deterministic);
   a ghost outline of the previous final camps stays visible so the audience sees the delta.
4. **The draggable decision line** at 0.5 on the selected dimension; dragging it updates the live recount
   (`"met de lijn hier: 138 van 240 rechts"`). This is the single most persuasive object in the demo.
5. **Two levers**: `druk` (0.4–2.0) and `vermenging` (0–1). At mixing 0 the graph must visibly shatter into ten
   clusters — say: *"this is what homophily does to a sector."*
6. **Hover/click an agent** → profile: synthetic name, archetype, sector, need in kW, six prior bars, how much
   they moved; then *"Waarom veranderde deze?"* listing the events and neighbours that moved them.
7. **Report tab**: the six frequencies with n/CI, the falsifier table, three findings, *"Wat dit niet zegt."*

### 11.10 Canvas spec
One `<canvas>`, `requestAnimationFrame`, DPR-aware, `ResizeObserver`. Ten cluster centres on a circle;
240 nodes / ~1,500 edges. `alpha` starts at 1 and `*= 0.992` per frame. Centre attraction `0.012·alpha`
(hubs 0.03); pairwise repulsion inside radius 20 (hubs 46) with `f = r²/d² · 0.35 · alpha`; springs rest length
34 (hubs 120), stiffness 0.01 (hubs 0.0012); damping 0.84; 12 px clamp to the canvas. Draw: ground → 48 px grid
at 2.5% white → cluster halos (92 px radial gradient) → agent edges → hub edges → agents → pulses → labels →
legend. Agent fill = stance colour on the selected dimension (`POS #1F6B3E`, `NEG #A3221C`, `NEU #8C97A1`);
unreached agents 28% alpha; pulses travel the edge in 380 ms. No WebGL, no d3. **≥55 fps at 240 nodes, and
print the measured fps on screen.**

---

## 12. The instrument

### 12.1 v1 — the ten items a team writes by default
*"What is your biggest challenge with grid connections?"*, *"How long have you been waiting?"*,
*"How likely would you use a tool like this?"* (1–5), *"Which feature is most valuable?"* (single choice across
five unrelated things), *"Would you pay for this?"* (yes/no), *"How do you find information now?"* (free text),
*"Would you trust an AI answer?"*, *"What is your sector?"*, *"What is your peak kW?"*, *"Any other comments?"*

**Coverage matrix:**

| need | why it matters | v1 | v2 |
|---|---|---|---|
| N1 · Is a non-binding date useful at all? | the entire offer | ✗ | ✓ `accept`, `q_date` |
| N2 · Is refusal acceptable? | the thesis | ✗ | ✓ `refusal`, `q_refuse` |
| N3 · Who pays, and how much? | the unvalidated criterion | partial (yes/no) | ✓ `payer`, `q_price` |
| N4 · Is an independent verifier legitimate? | permission to exist | ✗ | ✓ `legit` |
| N5 · Will operators obstruct? | existential risk | ✗ | ✓ `operator` |
| N6 · Is the queue seen as fair? | the political question | ✗ | ✓ `fair` |
| N7 · How many sources does an answer need to be believed? | the citation-depth decision | ✗ | ✓ `q_sources` |
| N8 · What is the real cost of a wrong answer? | the value story | ✗ | ✓ `q_cost` |
| N9 · Which route would they actually use? | the routes list | ✗ | ✓ `q_route` |
| N10 · What would make them stop using it? | churn | ✗ | ✓ `q_stop` |

**v1: 2.5/10. v2: 9.5/10.**

### 12.2 The 14 items

```
A · Uw situatie
 1 role    single [mkb-ondernemer, installateur, aggregator, netbeheerder, gemeente, financier,
                   adviesbureau, projectontwikkelaar, anders]
 2 sector  single [logistiek, maakindustrie, agrarisch, datacenter, woningbouw, dienstverlening, anders]
 3 stage   single [geen aanvraag, aanvraag loopt, op wachtlijst, aansluiting geweigerd, aansluiting aanwezig]

B · Het antwoord  (v1 is blind here)
 4 q_cost   single "Wat kost een verkeerd antwoord u ongeveer?" [niets, <€5k, €5–25k, €25–100k, >€100k, weet niet]
 5 q_sources single "Hoeveel brondocumenten moeten er bij een antwoord staan voordat u het gelooft?"
              [1, 2, 3, het maakt niet uit, ik wil de netbeheerder bellen]
 6 q_date   scale 5 "Een datum die de netbeheerder zelf 'indicatief' noemt: hoe bruikbaar is die voor u?"
 7 q_refuse scale 5 "Als er geen document is: moet een tool dat zeggen, of een beste schatting geven?"

C · De vier ideeën (neutrale taal)
 8 usefulness matrix 5 rows:
   [citaat   "Elk antwoord met het citaat en het document erbij",
    datum    "Een datum met de status: bindend, indicatief of voorlopig",
    routes   "Drie routes met de zin die u zelf kunt gebruiken",
    weigering"Een duidelijk 'onbekend' met een belscript"]
 9 q_route  multi "Welke routes zijn voor u realistisch?" [flexibel contract, ander perceel, eigen opwek,
              verplaatsen, wachten, weet niet]
10 q_price  single "Wat zou u per aanvraag betalen?" [niets, <€25, €25–100, €100–500, >€500]
11 q_trust  single "Wat maakt een antwoord betrouwbaar?" [het citaat, de netbeheerder, een keurmerk, een adviseur]

D · Gebruik
12 intent  scale 10 "Hoe waarschijnlijk gebruikt u dit bij uw volgende aanvraag?"
13 q_operator scale 5 "Verwacht u dat netbeheerders dit zullen steunen?"
14 q_stop   single "Wat zou u ervan weerhouden?" [vertrouwen, actualiteit, kosten, de netbeheerder, niets]
```

Every item gets a `zeg ik liever niet` path; abstentions are counted per archetype and reported.

### 12.3 Agent answering
Deterministic: `likert5(o) = clamp(1 + round(o*4))`; options carry `align: "left"|"right"|null`;
`abstain_probability = 0.05 + 0.28*(1 - o.legit)`. `q_cost` is drawn from the persona's `sector` and `kw_need`
(a datacenter's wrong answer costs more than a bakery's) so the population's answer traces to a persona fact.

---

## 13. Falsifiers — commit **before** the first ensemble run

```json
[
  {"id":"F1","claim":"A non-binding date is still useful to a waiting SME.","test":"QACCEPT","expected":true,
   "if_false":"The core offer is void. The product becomes a document archive, not an answer engine, and the pitch has to change to 'the receipts', sold to advisers."},
  {"id":"F2","claim":"The population prefers a refusal to a guess.","test":"QREFUSAL","expected":true,
   "if_false":"Refusal-as-a-feature is a designer's preference, not a user's. We would have to ship ranked estimates with loud uncertainty, which is the thing we exist to avoid."},
  {"id":"F3","claim":"Installers, aggregators, banks and developers would pay.","test":"QPAYER","expected":true,
   "if_false":"The payer criterion is lost and the venture thesis collapses to a public-good argument with no buyer — say so and re-scope to municipalities."},
  {"id":"F4","claim":"The refusal majority survives an 'AI invented a date' scandal.","test":"QAI","expected":true,
   "if_false":"One public error destroys the category — which is an argument FOR the deterministic gate and against every competitor who ships an LLM without one. Turn the finding into the pitch."},
  {"id":"F5","claim":"Operators are expected not to obstruct.","test":"QOPERATOR","expected":false,
   "if_false_but_expected_false":"If TRUE, we are too optimistic: the population expects obstruction and our go-to-market must assume it."}
]
```

### 13.1 The finding you must surface even though it hurts

`sme_wait.payer = .58` is below the `payer` majority when weighted across all archetypes (operators at .20 and
regulators at .24 pull it down). Expect `QPAYER` to be **marginal or failing**. Report it plainly:

> *"In 96 of 200 runs (p = 0.480, 95% CI 0.411–0.549) those who lose money on a wrong answer would pay for a
> right one. That is a coin flip, and it means we have not validated the payer — which is exactly what the
> due-diligence note said before we started. Our next experiment is three interviews, not three more features."*

**You may not tune the priors to make it pass.** If a juror asks, the answer is: *"we wrote down the assumption
that only the middle of the market will pay, and we left it there. Move the prior on screen and watch the number
move — that is the demo."*

---

## 14. Guardrails and evaluation

### 14.1 Test set
- The repo's existing 29-case A/B set (36 labelled values).
- **Plus ≥8 cases built from the new real corpus** (patch 1), with the expected verdict per case.
- **Plus 5 adversarial cases** designed to break the gate after patch 4: a quote with a date not in the quote, a
  quote with `indicatief` and a date, a quote naming another operator, a kW figure absent from the quote, and a
  route that appears nowhere.

### 14.2 Numbers to print on screen
| Metric | Target | Source |
|---|---|---|
| Tests passing | **236 + new** | `pytest -q` |
| Official documents in corpus | ≥ 8 | `source-register.json` |
| Postcodes verified | ≥ 40 across ≥3 operators | postcode table |
| Fabrications blocked | report the actual number | `make ab` |
| Misattributions caught | report before **and** after patch 4 | `make ab` |
| kWh per 1,000 answers | cold + warm, derived | `/energie` |
| Areas abstaining | report the number (was 16) | sweep |
| Swarm fps | ≥ 55 at 240 nodes | browser |
| Retrieval latency | report median (was 2 ms on a warm cache) | ledger |

### 14.3 Never say
- ❌ "We cover the whole Netherlands." Say: *"we cover N postcodes properly and abstain elsewhere."*
- ❌ "This predicts when you will get a connection." Say: *"this reports what was published, with its binding status."*
- ❌ "Approved by / affiliated with <operator>." Say: *"independent; not affiliated with any netbeheerder."*
- ❌ "The swarm shows SMEs will pay." Say: *"the simulated population, whose priors are on screen."*
- ❌ Any invented date, kW figure or quote. **One invented number destroys the entire product's credibility**,
  which is a strange and wonderful position: your product's value is exactly what a single fabrication costs.

---

## 15. The demo (90 seconds)

**Click path, rehearse it twice out loud on the clock:**

1. **0:00** — *"15,498 businesses are waiting for a grid connection. It was 668 in 2022."*
2. **0:08** — Type `5612 AB`, direction `afname`, `2500 kW`. **Answer in under a second:** verdict, the
   operator's sentence, the sha256, the retrieval date, the `indicatief` chip.
3. **0:20** — *"That chip is the product. Any competitor can show you a date. We tell you whether the operator
   called it a promise."*
4. **0:30** — Show the three routes with their application sentences.
5. **0:40** — Now switch to a postcode you **cannot** answer. **The refusal screen.** Read the phone script
   aloud, in Dutch, all 40 seconds. *"This is what it does when it doesn't know."*
6. **1:05** — `/ab`: *"21 of 21 inventions blocked with the gate on, 0 of 21 with it off. And 4 of 5
   misattributions still got through — we found that, we fixed it, here is the new number."*
7. **1:20** — `/energie`: the kWh figure, derived from the ledger, with the freshness trade-off named.
8. **1:30** — **Swarm:** fire `ai_fout`. *"One AI tool inventing a date and the refusal majority nearly
   collapses. That is why the gate has zero model calls in it."*

**If the wifi dies:** the static build plus a 2:50 recorded video. **Test both on the venue network**, not at
home. Say out loud that the live path can be run if someone gives you a minute and a network.

---

## 16. The five slides

| # | Headline | Copy / say |
|---|---|---|
| 1 · Claim | **"Can I get power here, and when?" Nobody can answer it from the operator's own words.** | 15,498 queued · 800+ congested postcodes. **Disclose:** *the engine exists from a prior hackathon; this weekend it becomes a company and a FairTech case.* |
| 2 · Demo | **A verdict, the operator's sentence, the hash, and a chip that says whether the date is a promise.** | Then the refusal. *"This is what it does when it does not know."* |
| 3 · Why AI, and why it cannot run free | **Classification against ~10 kinds of ambiguity in Dutch legal and operator text, then a pure-Python gate that makes 0 model calls.** | 21/21 blocked, 4/5 caught — the gap we found and closed. |
| 4 · FairTech | **The model proposes, the gate disposes, the person applies. No code path submits an application or operates a device.** | Wider impact: the kWh number + the freshness trade-off. Sovereignty: the dependency map with exit routes. |
| 5 · Venture & ask | **The wedge is selling the receipt, not the trade.** €60–120/kW/yr is the market anchor. | Two introductions and one pilot area. |

**If you get only 3 minutes:** demo the refusal → say the A/B number honestly → give the kWh figure → name the
payer and say it is unvalidated. Four sentences, all checkable. **Do not describe the architecture until someone
asks.**

### 16.1 Jury Q&A — exact answers

**"This already existed before the weekend. Is this new?"**
> *"The engine exists; this weekend we turn it into a company and a FairTech case. That is on slide one, in the
> README's first paragraph, and in the footer of the demo. What is new in these 36 hours is the real document
> corpus — before this weekend the repo had zero official documents — the verified postcode table, the binding-
> marker fix, and the energy accounting."*

**"So what did the AI do?"**
> *"It read ten Dutch documents and pulled out claims: this area, this direction, this date, this kW figure, and
> the sentence that says it. Nothing else. A pure-Python gate with zero model calls then decided which claims
> were allowed to become an answer. We measured that: 21 of 21 fabrications blocked with the gate on, 0 of 21
> with it off — and 4 of 5 cleverer misattributions still got through, which we found, fixed, and published."*

**"Where did your numbers come from?"**
> *"Every number on that screen sits next to the sentence it came from, the document's sha256, and the date we
> retrieved it. That is the product. If we cannot quote it, we do not print it — and the refusal screen is what
> that looks like."*

**"Isn't this just a scraper? The operators could do it themselves."**
> *"They could, and one of the reasons they don't is that an operator cannot credibly verify its own statements
> to a customer who is suing it. Independence is the product. We are not affiliated with any netbeheerder, and we
> say that on every screen."*

**"What if operators block you or close their capacity maps?"**
> *"That is the existential risk, and the swarm finds it: the simulated operators are the least convinced
> archetype in the entire population on legitimacy. Our answer is that we can only ever report what is published
> — if a map closes, our coverage shrinks and our abstentions grow, which is a visible regression rather than a
> silent one."*

**"Who pays?"**
> *"Installers, aggregators, financiers and developers — the people who lose money on a wrong answer. The flex
> market anchor is €60–120 per kW per year, so the value per correct answer is large. But our own simulation puts
> the payer question at a coin flip, and we say so on the report tab: it is the one criterion we have not
> validated, and the next experiment is three interviews, not three features."*

**"Is this a forecast?"**
> *"No. It reports what was published and labels the binding status. When the operator writes 'indicatief', we
> render 'indicatief'. A date without its status is how people lose a year and a million euros."*

**"What is the least defensible part of this build?"**
> *"That 4 of 5 misattributions passed the gate on the day we found it, and that our payer assumption is
> unvalidated. Both are written down, numbered, and reproducible with one command. The trade-off we have not
> resolved: a cached answer is fast and cheap and *stale*, and staleness is the exact failure we exist to
> prevent — so we key the cache on the document hash and print the retrieval time on every answer, and we accept
> that this makes us slower than a guess."*

---

## 17. Sovereignty (patch 7) — map it or lose the pillar

The good part is already real: Apache-2.0, EU-language focus, a deterministic core in pure Python with no vendor
in the critical path, and a premise that is literally about European grid governance.

The weak part, stated honestly:

| Dependency | Where | What breaks if withdrawn | Alternative | Exit cost | Have you run it? |
|---|---|---|---|---|---|
| Retrieval (Tavily, US) | extraction only | no new documents ingested; **served answers are unaffected** | EU-hosted search API; or manual ingest of 8 documents | low — the corpus is a directory of files | **yes / no** (say which) |
| Model (NVIDIA Nemotron on Nebius) | extraction only | no new claims extracted from new documents | open-weights checkpoint on an EU host | medium — a quality delta to re-measure | **yes / no** |
| The gate | pure Python, Apache-2.0 | nothing external | — | none | yes, 236 tests |
| Serving | static + small API | nothing: answers are files | — | none | yes |

**The sentence, verbatim:** *"Our retrieval and our extraction are the two US dependencies. The decision layer
is pure Python with no vendor in it, and every byte we serve is a quote from a Dutch public document. So losing
either supplier means we cannot ingest new documents — it does not change a single answer we have already
verified. Abstention is a tested code path: 16 of our areas abstain today for exactly this reason."*
(Bring that abstention number down with patch 2 — but keep some. **An extension with a visible refusal is more
credible than one with none.**)

---

## 18. The 36-hour plan (assumes the code exists)

| When | Do |
|---|---|
| **Day 1 · 08:30** | Arrive early. **Record the demo working on the venue wifi** before the welcome. Test the static build and the 2:50 video on the venue network. |
| **Day 1 · 11:00** | Do **not** brainstorm. Use the slot to recruit the pitch shape (who says what in 5 minutes) and ask the coaches the three questions that change the deck: which sub-track; must prior work be disclosed on the slide; does the demo machine get a screen. |
| **Day 1 · 12:45** | **Patches 1 + 2** — real documents, real postcode mapping. This is the only real build work. If corpus ingest is not done by 14:30, ship with 3 documents and say so. |
| **Day 1 · 14:00** | **Patch 4** (binding markers + re-run `make ab`) and **patch 3** (energy meter). Both small, both produce a number for a slide. |
| **Day 1 · 16:15** | Drinks are the highest-value hour. Find the energy people. Three interviews (patch 6). Ask each *"what would you pay for this"*. **Write down their exact words** — they become quotes. |
| **Day 2 · 09:15** | **Patch 5** (the refusal screen) + build the deck. Patches 6 and 7 are writing, not coding — do them here. |
| **Day 2 · 10:30** | The swarm (§11). Commit `falsifiers.json` **before** the first ensemble run. |
| **Day 2 · 12:30** | Rehearse the click path twice on the clock. **The refusal is the money shot; end on it.** |
| **Day 2 · 13:00** | **Slides frozen.** This slot is for fixing, not building. |
| **Day 2 · 13:50** | Pitch. |

**Cut if behind:** the sweep re-run, the Serverless/Sandbox narrative, any new feature, and the ninth event.
**Never cut:** the real documents, the disclosed failure, the kWh number, the interviews, the refusal screen.

---

## 19. Acceptance criteria — machine-checkable

```bash
cd backend && pytest -q          # 236 + new tests, 0 failures
make ab                          # prints the before/after table, writes docs/ab-latest.md
make sweep                       # writes docs/sweep-latest.json
```

| # | Criterion | Check |
|---|---|---|
| A1 | 0 console page errors on `/`, `/gebieden`, `/ab`, `/onbekend/5613`, `/energie`, `/swarm` | Playwright `pageerror` |
| A2 | 0 horizontal overflow at 390 px and 1440 px on every route | `scrollWidth - clientWidth === 0` |
| A3 | No nested anchors | `document.querySelectorAll('a a').length === 0` |
| A4 | Corpus ≥ 8 real primary documents, each with url + published + retrieved + sha256 | `source-register.json` validation |
| A5 | Every non-`onbekend` verdict on screen has ≥1 `<Quote>` with a doc id and a sha256 | DOM scan |
| A6 | No date renders as `bindend` when its quote contains a binding marker | `T-BIND`, one test per marker |
| A7 | `gate.py` imports no HTTP/SDK client | AST test |
| A8 | `make ab` shows fabrications blocked > 0 with the gate on and 0 with it off | parse the table |
| A9 | kWh per 1,000 printed with its derivation and the cold/warm split | `/energie` text assertions |
| A10 | ≥6 swarm frequencies matching `/\d+ \/ \d+ runs \(p = 0\.\d{3}, 95% CI 0\.\d{3}–0\.\d{3}\)/` | regex on the Report tab |
| A11 | Four honesty strings present | `GEEN LLM`, `SYNTHETISCH`, `GEEN VOORSPELLING`, `PRIOREN ZIJN AANNAMES` |
| A12 | ≥1 falsifier fired against the pitch | Report tab |
| A13 | The prior-work disclosure string appears on slide 1 **and** in the README's first paragraph **and** in the demo footer | grep |
| A14 | Works offline for the static build | DevTools offline → reload |
| A15 | Swarm ≥ 55 fps at 240 nodes, printed on screen | browser measurement |

---

## 20. Sources

- **Queue scale:** Netbeheer Nederland via NRC (Oct 2026) — **15,498** businesses waiting for a connection
  (30 Jun 2026), **8,558** waiting to feed back; **668** in 2022.
- **Enexis:** H1 2026 figures via Eemsdelta Kringen — **4%** of the business queue helped, queue passed
  **11,000**, **54%** of stations restricted.
- **The 1 Jul 2026 change:** households and small SMEs join the queue in **800+ postcodes** (RVO/Rijksoverheid
  and operator communications).
- **Prioritisation:** ACM framework via Total Energy Projects (Jul 2026) — ordinary SMEs last; enlargement takes
  **2–5 years**.
- **Flex market anchor:** Liander/Enexis/Stedin market tender, July 2026 — **€60–120/kW/yr**, 255 MW first
  round, delivery from Nov 2026.
- **The existing build:** `github.com/knarayanareddy/gridqueue-grid-connection` — 236 tests passing (verified
  9 Nov 2026), public demo, Apache-2.0; A/B on a 29-case synthetic set: 21/21 fabrications blocked, 10/10
  genuine kept, 4/5 misattributions still through, 79 checks; **0 official documents**; `source-register.v0.json`
  is a template; postcode→operator table covers 3 ranges marked `TODO_VERIFY`; 16 Stedin areas abstain.
- **Energy coefficients:** published inference-measurement studies — ~0.34 Wh median per query for >200B models
  on H100; 0.39–2.4 J/token; ~0.3 Wh per web search.
- **Postcode → operator:** PDOK (Liander network), Enexis and Stedin open data, `mijnaansluiting.nl`.

> **If you cannot verify a number at build time, do not print it.** For this product in particular, one invented
> figure is not a small error — it is the exact failure the product exists to prevent, and a juror who catches
> it will be right to end the pitch there.
