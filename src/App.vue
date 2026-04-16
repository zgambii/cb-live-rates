<script setup>
import { ref, computed } from 'vue'
import { useExchangeRates } from './composables/useExchangeRates'
import { parseUsd, formatCrypto } from './utils/numberUtils'

// Raw allocation input from the user as a string
const usdInput = ref('')

// Live exchange rates + loading/error state (45 seconds interval)
const { btcRate, ethRate, isLoading, errorMessage } = useExchangeRates()

// ----- Derived state -----
const parsed = computed(() => parseUsd(usdInput.value))

const showInputError = computed(
  () => parsed.value.kind === 'invalid' || parsed.value.kind === 'negative'
)

const inputErrorMessage = computed(() => {
  if (parsed.value.kind === 'invalid') {
    return 'Enter a valid number.'
  }
  if (parsed.value.kind === 'negative') {
    return 'Amount must be zero or greater.'
  }
  return ''
})

const usdAmount = computed(() =>
  parsed.value.kind === 'valid' ? parsed.value.value : null
)

const canCalculate = computed(() => {
  return (
    usdAmount.value != null &&
    btcRate.value != null &&
    ethRate.value != null &&
    !isLoading.value &&
    !errorMessage.value
  )
})

const btcUsdPortion = computed(() =>
  usdAmount.value == null ? null : usdAmount.value * 0.7
)
const ethUsdPortion = computed(() =>
  usdAmount.value == null ? null : usdAmount.value * 0.3
)

const btcAmount = computed(() => {
  if (btcUsdPortion.value == null || btcRate.value == null) return null
  return btcUsdPortion.value * btcRate.value
})

const ethAmount = computed(() => {
  if (ethUsdPortion.value == null || ethRate.value == null) return null
  return ethUsdPortion.value * ethRate.value
})
</script>

<template>
  <main>
    <h1>Asset allocation calculator</h1>

    <section>
      <label for="usd-input">Investable assets (USD)</label>
      <input
        id="usd-input"
        v-model="usdInput"
        type="text"
        inputmode="decimal"
        autocomplete="off"
      />
      <p v-if="showInputError" class="input-error">
        {{ inputErrorMessage }}
      </p>
    </section>

    <section aria-label="Rates status">
      <p v-if="isLoading" class="status-text">Loading live rates…</p>
      <p v-else-if="errorMessage" class="status-text status-error">
        Could not load live rates: {{ errorMessage }}
      </p>
    </section>

    <section>
      <div>
        <label for="btc-output">70% BTC allocation</label>
        <input
          id="btc-output"
          type="text"
          :value="canCalculate ? formatCrypto(btcAmount, 8) : ''"
          readonly
        />
      </div>

      <div>
        <label for="eth-output">30% ETH allocation</label>
        <input
          id="eth-output"
          type="text"
          :value="canCalculate ? formatCrypto(ethAmount, 6) : ''"
          readonly
        />
      </div>
    </section>
  </main>
</template>
