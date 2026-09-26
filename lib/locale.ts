export type Country = { code: string; name: string; flag: string; currency: string; symbol: string }

export const COUNTRIES: Country[] = [
  { code: "NG", name: "Nigeria", flag: "🇳🇬", currency: "NGN", symbol: "₦" },
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD", symbol: "$" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP", symbol: "£" },
  { code: "CA", name: "Canada", flag: "🇨🇦", currency: "CAD", symbol: "CA$" },
  { code: "AU", name: "Australia", flag: "🇦🇺", currency: "AUD", symbol: "A$" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR", symbol: "€" },
  { code: "FR", name: "France", flag: "🇫🇷", currency: "EUR", symbol: "€" },
  { code: "ES", name: "Spain", flag: "🇪🇸", currency: "EUR", symbol: "€" },
  { code: "IT", name: "Italy", flag: "🇮🇹", currency: "EUR", symbol: "€" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", currency: "EUR", symbol: "€" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", currency: "BRL", symbol: "R$" },
  { code: "MX", name: "Mexico", flag: "🇲🇽", currency: "MXN", symbol: "MX$" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "INR", symbol: "₹" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦", currency: "ZAR", symbol: "R" },
  { code: "GH", name: "Ghana", flag: "🇬🇭", currency: "GHS", symbol: "GH₵" },
  { code: "KE", name: "Kenya", flag: "🇰🇪", currency: "KES", symbol: "KSh" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY", symbol: "¥" },
  { code: "KR", name: "South Korea", flag: "🇰🇷", currency: "KRW", symbol: "₩" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "AED", symbol: "AED" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦", currency: "SAR", symbol: "SAR" },
]

export const COUNTRY_KEY = "pitchside-country"
export const PROFILE_KEY = "pitchside-profile"
export type Profile = { name: string; countryCode: string }

const USD_TO_LOCAL: Record<string, number> = {
  USD: 1, NGN: 1500, GBP: 0.75, CAD: 1.37, AUD: 1.53, EUR: 0.85,
  BRL: 5.4, MXN: 18.5, INR: 85, ZAR: 17, GHS: 12, KES: 130,
  JPY: 150, KRW: 1400, AED: 3.67, SAR: 3.75,
}

export function getCountry(code?: string): Country {
  return COUNTRIES.find((country) => country.code === code) || COUNTRIES[0]
}

export function readProfile(): Profile | null {
  if (typeof window === "undefined") return null
  try {
    const value = JSON.parse(localStorage.getItem(PROFILE_KEY) || "")
    if (value?.name && value?.countryCode) return value
  } catch {}
  return null
}

export function saveProfile(profile: Profile) {
  if (typeof window !== "undefined") {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
    localStorage.setItem(COUNTRY_KEY, profile.countryCode)
  }
}

export function formatRealMoney(usdAmount: number, countryCode?: string) {
  const country = getCountry(countryCode)
  const amount = usdAmount * (USD_TO_LOCAL[country.currency] || 1)
  return new Intl.NumberFormat(undefined, { style: "currency", currency: country.currency, maximumFractionDigits: country.currency === "JPY" || country.currency === "KRW" ? 0 : 2 }).format(amount)
}
