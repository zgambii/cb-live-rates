import { ref, onMounted, onBeforeUnmount } from 'vue'
import { buildUsdCryptoTickerOptions } from '../utils/usdRateTickerOptions'

export function useExchangeRates(selection) {
  // Coinbase returns USD->crypto rates as "units of crypto per 1 USD".
  // Example: BTC=0.00001 means $1 buys 0.00001 BTC.
  const usdRates = ref({})
  const isLoading = ref(false)
  const errorMessage = ref('')

  const asset70 = selection.asset70
  const asset30 = selection.asset30

  let intervalId = null

  function syncAssetSelectionsToRateMap(ratesByTicker) {
    const tickersFromCoinbase = buildUsdCryptoTickerOptions(ratesByTicker).map(
      (option) => option.ticker
    )

    if (tickersFromCoinbase.length === 0) return

    const asset70Ticker = asset70.value
    const asset30Ticker = asset30.value

    const asset70IsValid = tickersFromCoinbase.includes(asset70Ticker)
    const asset30IsValid = tickersFromCoinbase.includes(asset30Ticker)

    // If both tickers exist in Coinbase’s map, don’t change the user’s picks.
    // (Duplicates are handled in the UI layer.)
    if (asset70IsValid && asset30IsValid) return

    const firstTicker = tickersFromCoinbase[0]

    const nextAsset70 = asset70IsValid
      ? asset70Ticker
      : tickersFromCoinbase.includes('BTC')
        ? 'BTC'
        : firstTicker

    let nextAsset30 = asset30Ticker
    if (!asset30IsValid) {
      nextAsset30 =
        tickersFromCoinbase.find((ticker) => ticker === 'ETH' && ticker !== nextAsset70) ??
        tickersFromCoinbase.find((ticker) => ticker !== nextAsset70) ??
        firstTicker
    }

    if (nextAsset70 === nextAsset30) {
      nextAsset30 =
        tickersFromCoinbase.find((ticker) => ticker !== nextAsset70) ?? firstTicker
    }

    asset70.value = nextAsset70
    asset30.value = nextAsset30
  }

  async function fetchRates() {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const res = await fetch(
        'https://api.coinbase.com/v2/exchange-rates?currency=USD'
      )

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const json = await res.json()
      const rates = json?.data?.rates || {}

      const ratesByTicker = {}
      for (const [ticker, rawRate] of Object.entries(rates)) {
        const tickerUpper = String(ticker).toUpperCase()
        const unitsPerOneUsd = Number(rawRate)
        if (Number.isFinite(unitsPerOneUsd) && unitsPerOneUsd > 0) {
          ratesByTicker[tickerUpper] = unitsPerOneUsd
        }
      }

      if (Object.keys(ratesByTicker).length === 0) {
        throw new Error('No rates returned')
      }

      usdRates.value = ratesByTicker
      syncAssetSelectionsToRateMap(ratesByTicker)
    } catch (e) {
      errorMessage.value =
        e instanceof Error ? e.message : 'Failed to load rates'

      // If we already have rates, keep showing the last good snapshot on transient failures.
      if (Object.keys(usdRates.value || {}).length === 0) {
        usdRates.value = {}
      }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    fetchRates()
    // Keep rates fresh without needing a user-facing button.
    // 45s intervals but in prod, we'd likely use websocket instead.
    intervalId = setInterval(fetchRates, 45000)
  })

  onBeforeUnmount(() => {
    // Avoid leaking intervals if the composable’s owner unmounts.
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    usdRates,
    isLoading,
    errorMessage,
    fetchRates,
  }
}

