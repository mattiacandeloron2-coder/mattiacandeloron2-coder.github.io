export function driftScale(energy, { calm = 0.4, reducedMotion = false } = {}) {
  if (reducedMotion) return 0.08
  const t = Math.min(1, Math.max(0, Number(energy) || 0))
  return 1 - t * (1 - calm)
}
