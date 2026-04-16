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
  <main class="page">
    <section class="panel" aria-label="Asset allocation calculator">
      <header class="panel__header">
        <div class="panel__title">
          <h1>Asset allocation calculator</h1>
          <p class="muted">
            Enter a USD amount. This splits it 70% BTC and 30% ETH using Coinbase exchange rates.
          </p>
        </div>
      </header>

      <section class="field">
        <label class="field__label" for="usd-input">AMOUNT TO ALLOCATE (USD)</label>
        <div class="money-input">
          <span class="money-input__prefix">$</span>
          <input
            id="usd-input"
            v-model="usdInput"
            class="money-input__control"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0.00"
            :aria-invalid="showInputError ? 'true' : 'false'"
          />
        </div>
        <p v-if="showInputError" class="help help--error">
          {{ inputErrorMessage }}
        </p>
        <p v-else class="help muted">Rates refresh automatically in the background.</p>
      </section>

      <section class="cards" aria-label="Allocation outputs">
        <article class="card">
          <div class="card__top">
            <div>
              <div class="card__kicker">BITCOIN</div>
              <div class="card__symbol">BTC</div>
            </div>
            <div class="chip chip--btc">70%</div>
          </div>

          <div class="card__value">
            {{ canCalculate ? formatCrypto(btcAmount, 8) : '0.00000000' }}
          </div>
          <div class="card__meta muted">
            Rate:
            <span v-if="btcRate != null">1 USD = {{ formatCrypto(btcRate, 10) }} BTC</span>
            <span v-else>—</span>
          </div>
        </article>

        <article class="card">
          <div class="card__top">
            <div>
              <div class="card__kicker">ETHEREUM</div>
              <div class="card__symbol">ETH</div>
            </div>
            <div class="chip chip--eth">30%</div>
          </div>

          <div class="card__value">
            {{ canCalculate ? formatCrypto(ethAmount, 6) : '0.000000' }}
          </div>
          <div class="card__meta muted">
            Rate:
            <span v-if="ethRate != null">1 USD = {{ formatCrypto(ethRate, 10) }} ETH</span>
            <span v-else>—</span>
          </div>
        </article>
      </section>

      <footer class="panel__footer muted">
        <span v-if="isLoading">Updating rates…</span>
        <span v-else-if="errorMessage">Could not load rates: {{ errorMessage }}</span>
        <span v-else>Rates update roughly every 45 seconds.</span>
      </footer>
    </section>
  </main>
</template>
