import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useExchangeRates() {
  // Coinbase returns USD->crypto rates as "units of crypto per 1 USD".
  // Example: BTC=0.00001 means $1 buys 0.00001 BTC.
  const usdRates = ref({})
  const isLoading = ref(false)
  const errorMessage = ref('')

  let intervalId = null

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

