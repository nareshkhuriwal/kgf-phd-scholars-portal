import { SECTIONS } from './../constants/navSections'

export default function useActiveSection(pathname) {
  if (!pathname || pathname === '/') return null
  const match = SECTIONS
    .filter(s => pathname.startsWith(s.base))
    .sort((a, b) => b.base.length - a.base.length)[0]
  return match || null
}
