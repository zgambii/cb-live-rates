# cb-live-rates (asset allocation calculator)

Hi — I’m **Gambii**.

I built this as a small, self-contained Vue app to practice something I like doing in real products: take a slightly messy real-world API payload, turn it into something predictable in the UI, and keep the “business rules” readable.

## What this is

This is an **asset allocation calculator** with a very specific job:

- You enter an amount in **USD**
- You pick **two different crypto tickers** from the list Coinbase returns for USD exchange rates
- The app allocates **70% of the USD** to the first ticker and **30%** to the second
- It converts those USD portions into crypto amounts using Coinbase’s **“units of asset per 1 USD”** values from the exchange-rates response

It’s intentionally not a trading app. No accounts, no orders, no wallets — just rates + math + a clear UI.

## How it works (the mental model)

- **Rates source**: Coinbase `GET /v2/exchange-rates?currency=USD`
- **What the numbers mean**: for a ticker like BTC, the rate is effectively “how much BTC you get per 1 USD” (as returned by Coinbase’s payload for USD as the base currency).
- **Guards**:
  - If you pick the **same ticker twice**, the UI warns you and the calculator won’t run until you pick two distinct tickers.
  - If rates fail transiently, the app tries to keep the last good snapshot so the UI doesn’t “blink” empty.

## Local development

### Prereqs

- **Node.js** (a current LTS-ish version is ideal). I’ve been running this on modern Node without drama.

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

### Production build (sanity check)

```bash
npm run build
```

### Preview the production build locally

```bash
npm run preview
```

## Project map (where to look)

- `src/App.vue`: the “product rules” layer (USD input, 70/30 split, selection state, what “can calculate” means)
- `src/composables/useExchangeRates.js`: fetching + polling + keeping `usdRates` in a predictable shape
- `src/utils/numberUtils.js`: forgiving USD parsing + formatting helpers
- `src/utils/usdRateTickerOptions.js`: turns the Coinbase map into stable dropdown options
- `src/components/MajorAllocationCard.vue`: the repeated “card” UI for each allocation side

## Notes / caveats (worth saying out loud in a panel)

- **Public API + browser fetch**: this is fine for a demo, but a production app would usually proxy through your own backend for reliability, caching, attribution, and clearer error handling.
- **Ticker lists can be huge**: the UI is a plain `<select>` right now. That’s simple, but if you want “real product UX”, the next step is search/typeahead.

If you’re reading this because you’re about to review the code: thanks — I tried to keep the story easy to follow end-to-end, even if some of the details are intentionally “small app simple.”

