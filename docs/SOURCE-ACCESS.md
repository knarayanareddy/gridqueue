# Official source access: investigation

Checked on 2026-11-11. The earlier statement that official sources could not be fetched
was too broad: **the sandbox's direct network access is restricted, but the web retrieval
service can read some official pages**. These are separate paths with different outputs.

## Paths tested

| Method | What was tested | Result and qualification |
|---|---|---|
| Direct HTTPS from the sandbox | `curl -I https://www.netbeheernederland.nl/` | Failed with an SSL connection error in this environment. A direct machine with normal network access may behave differently. |
| Web page retrieval | [Enexis October update](https://www.enexis.nl/nieuws/2026/10/update-netcapaciteit-oktober-2026) | Returned page text in Markdown, including the page's own publication date (19 October 2026), station, block, direction and customer-impact table. It does **not** establish a postcode-to-station mapping. |
| Web page retrieval of a PDF | [Liander Hallum congestion report](https://www.liander.nl/-/media/Files/Congestiemanagementrapportages/Congestieonderzoek-Hallum-voor-teruglevering-17-oktober-2024) | Returned extracted report text in chunks, including a postcode appendix and an indicative plan. Old reports must not be treated as the current position. The retrieval service parses at most 30 pages. |
| Web page retrieval of a dynamic map | [National capacity map](https://capaciteitskaart.netbeheernederland.nl/) | Returned a loading/error state rather than usable area data; successful page retrieval does not imply the map API was queried successfully. |
| `gh api` on GitHub | [gridwatch-nl archive](https://github.com/jeremy-graft/gridwatch-nl) | Fetched its status and manifest via the GitHub API. At commit `8792c9fdcf42510708e0d9c62ee9ecca25e8d9e9` its status dated 2026-11-11 says the manifest was checked but **no area sweep occurred on that run**. The repository describes its archived JSON as canonicalised, so it is not the original HTTP response bytes. This is an independent third-party mirror, not a source directly fetched from the operator. |
| Official GitHub | [Netbeheer Nederland examples](https://github.com/Netbeheer-Nederland/nbnl-examples) | Accessible via `gh api`. The repository explicitly describes its content as examples and test data. It is useful for schema development, **not evidence of real capacity**. |

## What a successful extraction does and does not prove

The retrieval tool returns **processed Markdown or PDF-extracted text**, not the original
HTML/PDF bytes or response headers. Its text may omit, reorder or alter material. In fact,
the Enexis extraction includes an incomplete sentence; and one search result advertised an
October 1 page date while the actual retrieved page says October 19. Search snippets must
not establish publication dates, verbatim quotes, coverage or document hashes. A SHA-256
of the extracted Markdown would identify only **that extraction**, not the official PDF or
HTML. No source has been added to the official register on the basis of the above test.

## Recommended path to an auditable corpus

1. From a network that can access the operator sites, download the original HTML, PDF or
   official data export, preserving the response bytes. For example, Netbeheer Nederland
   [describes a capacity-map data export](https://www.netbeheernederland.nl/artikelen/nieuws/landelijke-capaciteitskaart-verder-uitgebreid);
   this is an announcement from 2023, not a test of the present export or a current dataset.
2. Transfer the files into this workspace (for example, upload them here or provide a
   Drive folder). Record the original URL, publisher, publication date as it appears in
   the source, actual retrieval time, file size and SHA-256. Check the licence and terms.
   Don't infer missing dates. Keep original files separate from extracted text; hash both
   with distinct labels and extraction metadata.
3. Verify the extracted quote against the original, establish the relevant direction and
   scope, and independently establish the postcode/address-to-network or station link.
   A station name alone does not prove that a four-digit postcode belongs to it; a
   postcode may span multiple cables or service areas.
4. Recheck freshness and applicable source limitations. Only then promote an entry to the
   trusted register and run the gate; otherwise continue to abstain.

A scheduled ingestion job on infrastructure with permitted access to the official sites
could later automate step 1. GitHub Actions is a possibility, **not tested here**, and must
respect the sites' terms, rate limits and robots policy. Use a least-privilege workflow and
review what it stores before enabling it. The third-party GitHub archive can assist
exploration or cross-checks, but its provenance, transformation, freshness and reuse terms
need independent review; never call its snapshot a freshly retrieved official document.

## Still open

The official register remains empty, the postcode mappings remain unverified and the UI
still abstains. There is no claim here that any source covers a real postcode or that an
operator has available capacity. A direct original-byte download and human review are still
needed before the evidence can be used for a production answer.
