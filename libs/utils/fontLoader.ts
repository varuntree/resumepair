const loadedFonts = new Set<string>()

const formatFamily = (family: string) => family.trim().replace(/\s+/g, '+')

export function loadFontFamily(family: string, weights: string[] = ['400', '600']): void {
  if (typeof window === 'undefined') return
  if (!family) return
  if (loadedFonts.has(family)) return

  const id = `font-${family.replace(/\s+/g, '-')}`
  if (document.getElementById(id)) {
    loadedFonts.add(family)
    return
  }

  const weightParam = weights.length ? `:wght@${weights.join(';')}` : ''
  const href = `https://fonts.googleapis.com/css2?family=${formatFamily(family)}${weightParam}&display=swap`

  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)

  loadedFonts.add(family)
}
