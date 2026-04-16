<script setup>
const props = defineProps({
  percent: {
    type: Number,
    required: true,
  },
  accent: {
    type: String,
    default: 'amber',
    validator: (value) => value === 'amber' || value === 'blue',
  },
  inputId: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  amountText: {
    type: String,
    required: true,
  },
  rateText: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue'])

const chipClass =
  props.accent === 'blue'
    ? 'rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-900'
    : 'rounded-full border border-amber-200/80 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900'

const selectRingClass =
  props.accent === 'blue'
    ? 'focus:outline-none focus:ring-2 focus:ring-blue-200'
    : 'focus:outline-none focus:ring-2 focus:ring-amber-200'
</script>

<template>
  <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <div class="flex items-start justify-between gap-4">
      <div class="min-w-0 flex-1">
        <label
          class="block text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500"
          :for="inputId"
        >
          {{ label }}
        </label>

        <select
          :id="inputId"
          class="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm"
          :class="selectRingClass"
          :value="modelValue"
          @change="emit('update:modelValue', $event.target.value)"
        >
          <option
            v-for="option in options"
            :key="`${percent}-${option.ticker}`"
            :value="option.ticker"
          >
            {{ option.ticker }}
          </option>
        </select>
      </div>

      <div :class="chipClass">
        {{ percent }}%
      </div>
    </div>

    <div class="mt-4 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
      {{ amountText }}
    </div>

    <div class="mt-2 text-xs text-slate-600">
      <span class="font-medium text-slate-700">Rate:</span>
      <span> {{ rateText }}</span>
    </div>
  </article>
</template>
