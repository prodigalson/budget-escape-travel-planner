# Data Sources & Honesty — Data Layer Spec

This document is the authoritative record of where every piece of data in
Budget Escape comes from, its licence/attribution, how it is cached, and how it
falls back. It is kept in sync with the shipped dataset in
`src/data/destinations.js` (costs + image provenance) and the currency layer in
`src/rates.js`.

## Principles

- **No fabricated data.** Every price range and image is sourced, and every
  estimate carries a data source + `last_checked`/`as_of` timestamp.
- **Estimates, never live/bookable pricing.** Unless a live provider is
  explicitly integrated (see per-category status below) values are illustrative
  ranges and the UI says so.
- **Attribution on demand.** Image credit/licence is shown wherever an image is
  presented in detail view, in a compliant way.

## Cost estimates (flights, accommodation, meals, transport, activities, fees)

| Item | Status | Source / basis | Licence | Cache | Fallback |
| --- | --- | --- | --- | --- | --- |
| Flights / rail | Compiled estimate | Public travel-cost guides & fare-range surveys (e.g. Skyscanner/Hopper/Rail Europe weekly ranges) summarized as low–high | Aggregated factual ranges; no copyrighted tables copied | Static in dataset, `last_checked` per dest | Ranges stay as shipped |
| Accommodation | Compiled estimate | Cost-of-living indices (Numbeo) & booking-site price bands for a 3-star equivalent room/night | Aggregate figures; cited in README | Static, dated | As shipped |
| Meals | Compiled estimate | Cost-of-living indices for casual/street dining | Aggregated | Static, dated | As shipped |
| Local transport | Compiled estimate | City transit day-pass / public-transport fares | Aggregated | Static, dated | As shipped |
| Activities & entry | Compiled estimate | Ticket list prices summarized for 2–4 paid sights | Public list prices | Static, dated | As shipped |
| Taxes & fees | Compiled estimate | Tourist-tax & booking-fee norms per destination | Aggregated | Static, dated | As shipped |
| Contingency | Model rule | Fixed percentage (10–12%) applied to the subtotal | n/a (own model) | n/a | n/a |

**Implementation:** `src/data/destinations.js` — `COST_SOURCE`
("Compiled estimate from public travel-cost guides") and `COST_LAST_CHECKED`
(2026-07-01) label the dataset. Each destination's `costs` object stores the
low–high ranges and the engine (`src/engine.js`) computes per-trip totals.

**Disclosure in UI:** every detail view shows:
> `COST_SOURCE`, last checked `COST_LAST_CHECKED`. Costs are illustrative, not
> live or bookable.

## Currency conversion

| Item | Status | Source | Licence | Cache | Fallback |
| --- | --- | --- | --- | --- | --- |
| USD ↔ EUR | **Live provider integrated** (opt-in) | [frankfurter.dev](https://frankfurter.dev) `GET /v1/latest?base=USD&symbols=EUR` — European Central Bank reference rates | Open API, free for non-commercial use, no key required; attribution to ECB in UI | In-memory, TTL 1 hour (`RATES_CACHE_TTL_MS`) | On failure reuse fresh cache, else **bundled** rate labeled "live rate unavailable" |

**Implementation:** `src/rates.js`. The app calls `enableLiveRates()` at
startup; `getRateInfo`/`convert` thread the resolved rate, source, and
`last_checked` (ECB `date`) through to the engine, which attaches `rateInfo` to
every estimate. The detail view shows the conversion source + `as_of` timestamp
and flags when a bundled fallback was used.

**Default/bundled:** `BUNDLED_RATES` (USD→EUR 0.92, EUR→USD 1.09) is the
offline-safe fallback and the deterministic mode used by unit tests.

## Image provenance

| Item | Status | Source | Licence | Cache | Attribution in UI |
| --- | --- | --- | --- | --- | --- |
| Destination hero images | Integrated (static) | Unsplash image CDN | Unsplash License (free to use) — no attribution legally required, but we credit | Referenced by URL in dataset | Detail view credit line: "Photo by X on Unsplash — Unsplash License" |

**Implementation:** `src/data/destinations.js` stores per-destination
`image = { url, alt, credit, source, license }`; a dataset test enforces every
image has provenance. The results card uses the `url` (with `alt`), and the
detail view renders the credit + licence.

## Planned live providers (not yet integrated)

Reserved env vars in `.env.example` document the compliance path for later
stages. Until a provider is actually integrated, the app must not present its
output as live/bookable:

- **Flights/rail:** Amadeus Self-Service API (`VITE_AMADEUS_API_KEY`) — cache
  responses with TTL and a documented fallback to compiled ranges; display
  fare-source + `last_checked`.
- **Destination metadata:** GeoNames (`VITE_GEONAMES_USERNAME`) for
  coordinates/nearby POIs.
- **Accommodation/hotels:** Booking/Airbnb affiliate APIs where licensed.

Add each to the table above (with licence, cache TTL, fallback) the moment it is
wired in, and flip its Status to "integrated".

## Freshness & fallback policy (enforced)

1. Every displayed estimate/rate shows its source and `last_checked`/`as_of`.
2. Live currency: cache TTL 1h; if the provider is unreachable, reuse a fresh
   cache, otherwise fall back to the bundled rate **and label it**.
3. No query, image, or price is ever shown without a documented source.

## Keeping this in sync

- Adding/removing a destination or editing costs in `src/data/destinations.js`
  must not introduce unsourced values; update `COST_LAST_CHECKED` when the
  dataset is refreshed.
- Changing the currency provider/cache in `src/rates.js` must be reflected in
  the Currency table above and in the detail-view disclosure.
