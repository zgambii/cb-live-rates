import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useExchangeRates() {
  // Rates from Coinbase are "units of crypto per 1 USD".
  // Example: BTC=0.00001 means $1 buys 0.00001 BTC.
  const btcRate = ref(null)
  const ethRate = ref(null)
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

      const btc = Number(rates.BTC)
      const eth = Number(rates.ETH)

      if (!Number.isFinite(btc) || !Number.isFinite(eth)) {
        throw new Error('Missing BTC or ETH rate')
      }

      btcRate.value = btc
      ethRate.value = eth
    } catch (e) {
      // Treat any failure as "no usable rates" and let the UI show blanks.
      errorMessage.value =
        e instanceof Error ? e.message : 'Failed to load rates'
      btcRate.value = null
      ethRate.value = null
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
    btcRate,
    ethRate,
    isLoading,
    errorMessage,
    fetchRates,
  }
}

