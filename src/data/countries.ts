export const EUROPEAN_COUNTRIES: { name: string; code: string }[] = [
  { name: "Austria", code: "AT" },
  { name: "Belgium", code: "BE" },
  { name: "Denmark", code: "DK" },
  { name: "Finland", code: "FI" },
  { name: "France", code: "FR" },
  { name: "Germany", code: "DE" },
  { name: "Greece", code: "GR" },
  { name: "Ireland", code: "IE" },
  { name: "Italy", code: "IT" },
  { name: "Netherlands", code: "NL" },
  { name: "Spain", code: "ES" },
  { name: "Sweden", code: "SE" },
  { name: "Switzerland", code: "CH" },
  { name: "Norway", code: "NO" },
  { name: "Portugal", code: "PT" },
  { name: "Czechia", code: "CZ" },
  { name: "Poland", code: "PL" },
  { name: "Estonia", code: "EE" },
  { name: "United Kingdom", code: "GB" },
];

export function countryCodeFor(name: string): string {
  return EUROPEAN_COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase())?.code ?? "";
}
