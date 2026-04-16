export function parseUsd(raw) {
  // Keep input forgiving: users often type "1,000" (or include spaces).
  // We store the raw string in state and only normalize for parsing.
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/[, ]+/g, '')

  if (cleaned === '') return { kind: 'empty', value: null }

  const n = Number(cleaned)
  if (!Number.isFinite(n)) return { kind: 'invalid', value: null }
  // Baseline validation: no negative holdings.
  if (n < 0) return { kind: 'negative', value: null }

  return { kind: 'valid', value: n }
}

export function formatCrypto(value, decimals = 8) {
  // Small app: fixed decimals are enough and predictable.
  // If this grew, we’d likely format per asset + strip trailing zeros.
  if (value == null || !Number.isFinite(value)) return ''
  return value.toFixed(decimals)
}

