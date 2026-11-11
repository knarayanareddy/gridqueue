# End-to-end review and outstanding work

The previous engine is reused, not newly authored. The 29-case A/B set is synthetic and self-authored; it tests surface support, not semantic entailment. Before this change 4/5 misattributions passed. After the conservative marker fix 3/5 still pass. A quote can contain a date or capacity while referring to the wrong thing; this is not solved. No output should be treated as a verified connection decision.

The sandbox permits direct downloads from GitHub and package registries, but not the official Dutch operator websites. A separate web retrieval service can read some official pages and PDFs as transformed text (see [source access investigation](SOURCE-ACCESS.md)); it does not supply original response bytes for hashing. The official corpus remains empty, the upstream location table remains unverified and the public-facing interface abstains for every postcode. The upstream fixture API is retained for engineering tests only; it does not implement production-safe postcode coverage. Acquiring source documents and independently verifying address/operator mapping are blocking work, not a cosmetic improvement. No interviews have been conducted and no payer has been validated.

Energy coefficients in the spec are unsourced and no representative production token ledger, machine CPU energy measurement, cache sweep, or real search is available. The UI deliberately does not display invented consumption figures. Likewise the simulation uses assumed priors; it is not a survey or forecast. Any real rollout also requires privacy, security, freshness, licence and accessibility review.

## Sovereignty

| Dependency | Consequence if withdrawn | Alternative / exit | Actually run |
|---|---|---|---|
| Tavily search | No automated retrieval | Manual ingestion or EU search; low migration, revalidate coverage | No live call |
| Nemotron on Nebius | No new model extractions | EU-hosted open weights; medium, requires new evaluation | No live call |
| Pure Python gate | No external vendor required | Portable | Offline synthetic tests |
| React static interface | No external service needed for refusal | Static files | Local build |

## Remaining acceptance gaps

The source-register is intentionally empty: no real corpus, verified mappings, real-case adversarial evaluation, or quote-backed positive verdicts exist. The existing `/v1` API and synthetic sweep are engineering demonstrations, not a production service. The new static interface is deliberately separate from that API and does not yet audit refusals. A hash-chained audit ledger, energy measurements and hash-aware cache are not implemented. The simulation is a simplified seeded local opinion model inspired by the spec, not the MiroFish framework: its visualisation is a static cluster layout, not the specified force animation, and the detailed personas, survey instrument, event explanations and FPS instrumentation are not implemented. No offline reload, browser accessibility/overflow audit, venue test, slide deck, or interviews have been verified. These are release blockers, not achieved acceptance criteria.
