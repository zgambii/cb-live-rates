/**
 * Coinbase `exchange-rates?currency=USD` returns a map of tickers -> "units of that asset per 1 USD".
 * This helper turns that map into a stable, UI-friendly list of selectable tickers.
 */
export function buildUsdCryptoTickerOptions(usdRatesByTicker) {
  const rates = usdRatesByTicker || {}

  return Object.keys(rates)
    .map((ticker) => String(ticker).toUpperCase())
    .filter((ticker) => ticker && ticker !== 'USD')
    .sort((tickerA, tickerB) => tickerA.localeCompare(tickerB))
    .map((ticker) => ({ ticker }))
}
