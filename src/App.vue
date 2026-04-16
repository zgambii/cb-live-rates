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
  <main
    class="flex min-h-dvh items-center justify-center bg-slate-100 px-4 py-8 text-slate-900 antialiased"
  >
    <section
      class="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-900/5 sm:p-8"
      aria-label="Asset allocation calculator"
    >
      <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Asset allocation calculator
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            Enter a USD amount. This splits it 70% BTC and 30% ETH using Coinbase exchange rates.
          </p>
        </div>
      </header>

      <section class="mt-6 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <label
          class="block text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500"
          for="usd-input"
        >
          AMOUNT TO ALLOCATE (USD)
        </label>

        <div
          class="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
        >
          <span class="text-base font-semibold text-amber-700">$</span>
          <input
            id="usd-input"
            v-model="usdInput"
            class="w-full bg-transparent text-3xl tracking-tight text-slate-900 placeholder:text-slate-400 focus:outline-none"
            type="text"
            inputmode="decimal"
            autocomplete="off"
            placeholder="0.00"
            :aria-invalid="showInputError ? 'true' : 'false'"
          />
        </div>

        <p v-if="showInputError" class="mt-2 text-sm text-red-700">
          {{ inputErrorMessage }}
        </p>
        <p v-else class="mt-2 text-sm text-slate-600">
          Rates refresh automatically in the background.
        </p>
      </section>

      <section class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Allocation outputs">
        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                BITCOIN
              </div>
              <div class="mt-1 text-base font-semibold text-slate-900">BTC</div>
            </div>
            <div
              class="rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900"
            >
              70%
            </div>
          </div>

          <div class="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
            {{ canCalculate ? formatCrypto(btcAmount, 8) : '0.00000000' }}
          </div>
          <div class="mt-2 text-xs text-slate-600">
            <span class="font-medium text-slate-700">Rate:</span>
            <span v-if="btcRate != null"> 1 USD = {{ formatCrypto(btcRate, 10) }} BTC</span>
            <span v-else> —</span>
          </div>
        </article>

        <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div class="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                ETHEREUM
              </div>
              <div class="mt-1 text-base font-semibold text-slate-900">ETH</div>
            </div>
            <div
              class="rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900"
            >
              30%
            </div>
          </div>

          <div class="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
            {{ canCalculate ? formatCrypto(ethAmount, 6) : '0.000000' }}
          </div>
          <div class="mt-2 text-xs text-slate-600">
            <span class="font-medium text-slate-700">Rate:</span>
            <span v-if="ethRate != null"> 1 USD = {{ formatCrypto(ethRate, 10) }} ETH</span>
            <span v-else> —</span>
          </div>
        </article>
      </section>

      <footer
        class="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500"
      >
        <span v-if="isLoading">Updating rates…</span>
        <span v-else-if="errorMessage">Could not load rates: {{ errorMessage }}</span>
        <span v-else>Rates update roughly every 45 seconds.</span>
      </footer>
    </section>
  </main>
</template>
