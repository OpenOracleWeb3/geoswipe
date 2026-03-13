const COUNTRY_FLAG_CODES: Record<string, string> = {
  Argentina: "ar",
  Australia: "au",
  Bolivia: "bo",
  Canada: "ca",
  Chile: "cl",
  Colombia: "co",
  "Costa Rica": "cr",
  Croatia: "hr",
  "Czech Republic": "cz",
  Egypt: "eg",
  Greece: "gr",
  Iceland: "is",
  India: "in",
  Indonesia: "id",
  Jamaica: "jm",
  Japan: "jp",
  Jordan: "jo",
  Kenya: "ke",
  Latvia: "lv",
  Lithuania: "lt",
  Malaysia: "my",
  Maldives: "mv",
  Mexico: "mx",
  Montenegro: "me",
  Morocco: "ma",
  Nepal: "np",
  "New Zealand": "nz",
  Oman: "om",
  Peru: "pe",
  Poland: "pl",
  Portugal: "pt",
  Qatar: "qa",
  "South Africa": "za",
  "South Korea": "kr",
  Slovakia: "sk",
  Slovenia: "si",
  Spain: "es",
  Tanzania: "tz",
  Thailand: "th",
  Tunisia: "tn",
  "United Arab Emirates": "ae",
  "United States": "us",
  Vietnam: "vn"
};

export function getCountryFlagUrl(country: string): string | null {
  const code = COUNTRY_FLAG_CODES[country];

  if (!code) {
    return null;
  }

  return `https://flagcdn.com/w160/${code}.png`;
}
