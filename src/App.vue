<script setup>
import { ref, computed } from 'vue'
import { useExchangeRates } from './composables/useExchangeRates'
import { parseUsd, formatCrypto } from './utils/numberUtils'
import MajorAllocationCard from './components/MajorAllocationCard.vue'

// Raw allocation input from the user as a string
const usdInput = ref('')

const asset70 = ref('BTC')
const asset30 = ref('ETH')

// Live exchange rates + loading/error state (45 seconds interval)
const { usdRates, isLoading, errorMessage } = useExchangeRates({ asset70, asset30 })

function rateFor(ticker) {
  const normalizedTicker = String(ticker ?? '').toUpperCase()
  const unitsPerOneUsd = usdRates.value?.[normalizedTicker]
  return Number.isFinite(unitsPerOneUsd) ? unitsPerOneUsd : null
}

const assetOptions = computed(() => {
  const rates = usdRates.value || {}
  return Object.keys(rates)
    .map((ticker) => String(ticker).toUpperCase())
    .filter((ticker) => ticker && ticker !== 'USD') // Filter out USD
    .sort((tickerA, tickerB) => tickerA.localeCompare(tickerB))
    .map((ticker) => ({
      ticker,
      available: Number.isFinite(rates[ticker]),
    }))
})

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

const rate70 = computed(() => rateFor(asset70.value))
const rate30 = computed(() => rateFor(asset30.value))

const selectedTheSameAsset = computed(() => asset70.value === asset30.value)

const canCalculate = computed(() => {
  return (
    usdAmount.value != null &&
    rate70.value != null &&
    rate30.value != null &&
    !selectedTheSameAsset.value
  )
})

const usdPortion70 = computed(() =>
  usdAmount.value == null ? null : usdAmount.value * 0.7
)
const usdPortion30 = computed(() =>
  usdAmount.value == null ? null : usdAmount.value * 0.3
)

const amount70 = computed(() => {
  if (usdPortion70.value == null || rate70.value == null) return null
  return usdPortion70.value * rate70.value
})

const amount30 = computed(() => {
  if (usdPortion30.value == null || rate30.value == null) return null
  return usdPortion30.value * rate30.value
})

const amountText70 = computed(() =>
  canCalculate.value && amount70.value != null
    ? formatCrypto(amount70.value, 8)
    : '0.00000000'
)

const amountText30 = computed(() =>
  canCalculate.value && amount30.value != null
    ? formatCrypto(amount30.value, 8)
    : '0.00000000'
)

const rateText70 = computed(() =>
  rate70.value == null ? '—' : `1 USD = ${formatCrypto(rate70.value, 10)} ${asset70.value}`
)

const rateText30 = computed(() =>
  rate30.value == null ? '—' : `1 USD = ${formatCrypto(rate30.value, 10)} ${asset30.value}`
)
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
            Enter a USD amount. This splits it 70% / 30% across two assets you pick from Coinbase’s
            returned rate list.
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

      <div
        v-if="selectedTheSameAsset"
        class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        role="status"
        aria-live="polite"
      >
        You selected the same asset for both allocations. Pick two different tickers to compute a
        70% / 30% split.
      </div>

      <section class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Allocation outputs">
        <MajorAllocationCard
          :percent="70"
          accent="amber"
          input-id="asset-70"
          label="70% asset"
          v-model="asset70"
          :assets="assetOptions"
          :amount-text="amountText70"
          :rate-text="rateText70"
        />

        <MajorAllocationCard
          :percent="30"
          accent="blue"
          input-id="asset-30"
          label="30% asset"
          v-model="asset30"
          :assets="assetOptions"
          :amount-text="amountText30"
          :rate-text="rateText30"
        />
      </section>

      <footer
        class="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500"
      >
        <div v-if="isLoading">Updating rates…</div>
        <div v-else>Rates update roughly every 45 seconds.</div>
        <div v-if="errorMessage" class="mt-2 normal-case text-xs font-normal text-red-700">
          {{ errorMessage }}
        </div>
      </footer>
    </section>
  </main>
</template>
