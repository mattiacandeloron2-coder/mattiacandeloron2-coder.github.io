const GRAY = [158, 158, 152]
const BLACK = [17, 17, 17]

export function bootPercent({
  loaded = 0,
  total = 0,
  downloaded = false,
  built = 0,
  count = 0,
  fonts = false,
  painted = false,
} = {}) {
  const download = downloaded ? 1 : total > 0 ? Math.min(Math.max(loaded, 0) / total, 1) : 0
  const build = count > 0 ? Math.min(Math.max(built, 0) / count, 1) : 0
  const value = download * 0.62 + build * 0.28 + (fonts ? 0.05 : 0) + (painted ? 0.05 : 0)
  return Math.max(0, Math.min(100, Math.round(value * 100)))
}

export function bootInk(percent) {
  const t = Math.min(1, Math.max(0, Number(percent) / 100))
  const channel = (index) => Math.round(GRAY[index] + (BLACK[index] - GRAY[index]) * (Number.isFinite(t) ? t : 0))
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`
}
