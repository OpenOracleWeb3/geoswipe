import type { ContinentId, GameMode, RoundLocation, WorldRegionId } from "../types/game";

interface ContinentMeta {
  id: ContinentId;
  label: string;
}

interface WorldRegionMeta {
  id: WorldRegionId;
  label: string;
  continentId: ContinentId;
}

interface CountryLocationInput {
  country: string;
  continentId: ContinentId;
  worldRegionId: WorldRegionId;
  tags: string[];
  locations: Array<[id: string, label: string, lat: number, lng: number]>;
}

interface CountryLocationProfile {
  country: string;
  continentId: ContinentId;
  continentLabel: string;
  worldRegionId: WorldRegionId;
  worldRegionLabel: string;
  tags: string[];
  locations: RoundLocation[];
}

export const CONTINENT_META: Record<ContinentId, ContinentMeta> = {
  north_america: { id: "north_america", label: "North America" },
  south_america: { id: "south_america", label: "South America" },
  europe: { id: "europe", label: "Europe" },
  africa: { id: "africa", label: "Africa" },
  asia: { id: "asia", label: "Asia" },
  oceania: { id: "oceania", label: "Oceania" }
};

export const WORLD_REGION_META: Record<WorldRegionId, WorldRegionMeta> = {
  north_america: { id: "north_america", label: "North America", continentId: "north_america" },
  caribbean: { id: "caribbean", label: "Caribbean", continentId: "north_america" },
  central_america: { id: "central_america", label: "Mexico + Central America", continentId: "north_america" },
  andes: { id: "andes", label: "Andean South America", continentId: "south_america" },
  southern_cone: { id: "southern_cone", label: "Southern Cone", continentId: "south_america" },
  north_atlantic: { id: "north_atlantic", label: "North Atlantic", continentId: "europe" },
  iberia: { id: "iberia", label: "Iberia", continentId: "europe" },
  central_europe: { id: "central_europe", label: "Central Europe", continentId: "europe" },
  baltics: { id: "baltics", label: "Baltics", continentId: "europe" },
  adriatic_balkans: { id: "adriatic_balkans", label: "Adriatic + Balkans", continentId: "europe" },
  mediterranean_europe: { id: "mediterranean_europe", label: "Mediterranean Europe", continentId: "europe" },
  north_africa: { id: "north_africa", label: "North Africa", continentId: "africa" },
  east_africa: { id: "east_africa", label: "East Africa", continentId: "africa" },
  southern_africa: { id: "southern_africa", label: "Southern Africa", continentId: "africa" },
  arabian_peninsula: { id: "arabian_peninsula", label: "Arabian Peninsula", continentId: "asia" },
  levant: { id: "levant", label: "Levant", continentId: "asia" },
  east_asia: { id: "east_asia", label: "East Asia", continentId: "asia" },
  southeast_asia: { id: "southeast_asia", label: "Southeast Asia", continentId: "asia" },
  south_asia: { id: "south_asia", label: "South Asia", continentId: "asia" },
  indian_ocean: { id: "indian_ocean", label: "Indian Ocean", continentId: "asia" },
  oceania: { id: "oceania", label: "Oceania", continentId: "oceania" }
};

function countryProfile(input: CountryLocationInput): CountryLocationProfile {
  const continentLabel = CONTINENT_META[input.continentId].label;
  const worldRegionLabel = WORLD_REGION_META[input.worldRegionId].label;

  return {
    country: input.country,
    continentId: input.continentId,
    continentLabel,
    worldRegionId: input.worldRegionId,
    worldRegionLabel,
    tags: input.tags,
    locations: input.locations.map(([id, label, lat, lng]) => ({
      id,
      label,
      country: input.country,
      continentId: input.continentId,
      continentLabel,
      worldRegionId: input.worldRegionId,
      worldRegionLabel,
      coordinates: [lat, lng],
      tags: [...input.tags]
    }))
  };
}

const COUNTRY_LOCATION_PROFILES: CountryLocationProfile[] = [
  countryProfile({
    country: "Canada",
    continentId: "north_america",
    worldRegionId: "north_america",
    tags: ["broad avenues", "detached homes", "cool light"],
    locations: [
      ["ca-toronto-core", "Downtown Toronto", 43.6532, -79.3832],
      ["ca-montreal-plateau", "Plateau Montreal", 45.5017, -73.5673],
      ["ca-vancouver-waterfront", "Vancouver Waterfront", 49.2827, -123.1207]
    ]
  }),
  countryProfile({
    country: "Jamaica",
    continentId: "north_america",
    worldRegionId: "caribbean",
    tags: ["tropical roadside", "bright paint", "lush hills"],
    locations: [
      ["jm-kingston", "Kingston", 17.9712, -76.7936],
      ["jm-montego-bay", "Montego Bay", 18.4762, -77.8939],
      ["jm-ocho-rios", "Ocho Rios", 18.4038, -77.1031]
    ]
  }),
  countryProfile({
    country: "United States",
    continentId: "north_america",
    worldRegionId: "north_america",
    tags: ["wide roads", "strip retail", "big blocks"],
    locations: [
      ["us-midtown-manhattan", "Midtown Manhattan", 40.758, -73.9855],
      ["us-downtown-los-angeles", "Downtown Los Angeles", 34.0522, -118.2437],
      ["us-miami-beach", "Miami Beach", 25.7907, -80.13]
    ]
  }),
  countryProfile({
    country: "Mexico",
    continentId: "north_america",
    worldRegionId: "central_america",
    tags: ["dense storefronts", "dry hills", "busy junctions"],
    locations: [
      ["mx-mexico-city-centro", "Centro Historico, Mexico City", 19.4326, -99.1332],
      ["mx-guadalajara-centro", "Central Guadalajara", 20.6597, -103.3496],
      ["mx-monterrey-centro", "Central Monterrey", 25.6866, -100.3161]
    ]
  }),
  countryProfile({
    country: "Chile",
    continentId: "south_america",
    worldRegionId: "southern_cone",
    tags: ["mountain backdrop", "clean grids", "pacific light"],
    locations: [
      ["cl-santiago-centro", "Central Santiago", -33.4489, -70.6693],
      ["cl-valparaiso-hills", "Valparaiso Hills", -33.0472, -71.6127],
      ["cl-puerto-varas", "Puerto Varas", -41.3195, -72.9854]
    ]
  }),
  countryProfile({
    country: "Peru",
    continentId: "south_america",
    worldRegionId: "andes",
    tags: ["coastal haze", "steep districts", "concrete walls"],
    locations: [
      ["pe-lima-miraflores", "Miraflores, Lima", -12.1211, -77.0297],
      ["pe-cusco-centro", "Central Cusco", -13.5319, -71.9675],
      ["pe-arequipa-centro", "Central Arequipa", -16.409, -71.5375]
    ]
  }),
  countryProfile({
    country: "Argentina",
    continentId: "south_america",
    worldRegionId: "southern_cone",
    tags: ["broad boulevards", "temperate light", "open urban fabric"],
    locations: [
      ["ar-buenos-aires-palermo", "Palermo, Buenos Aires", -34.6037, -58.3816],
      ["ar-cordoba-centro", "Central Cordoba", -31.4201, -64.1888],
      ["ar-mendoza-centro", "Central Mendoza", -32.8895, -68.8458]
    ]
  }),
  countryProfile({
    country: "Bolivia",
    continentId: "south_america",
    worldRegionId: "andes",
    tags: ["high altitude", "brick hillsides", "dry plateaus"],
    locations: [
      ["bo-la-paz-centro", "Central La Paz", -16.4897, -68.1193],
      ["bo-santa-cruz-centro", "Central Santa Cruz", -17.7833, -63.1821],
      ["bo-cochabamba-centro", "Central Cochabamba", -17.3895, -66.1568]
    ]
  }),
  countryProfile({
    country: "Costa Rica",
    continentId: "north_america",
    worldRegionId: "central_america",
    tags: ["lush roadsides", "wet pavement", "small-scale towns"],
    locations: [
      ["cr-san-jose-centro", "Central San Jose", 9.9281, -84.0907],
      ["cr-cartago-centro", "Central Cartago", 9.8644, -83.9194],
      ["cr-liberia-centro", "Central Liberia", 10.6346, -85.4377]
    ]
  }),
  countryProfile({
    country: "Colombia",
    continentId: "south_america",
    worldRegionId: "andes",
    tags: ["dense hillsides", "lush valleys", "layered storefronts"],
    locations: [
      ["co-bogota-chapinero", "Chapinero, Bogota", 4.711, -74.0721],
      ["co-medellin-poblado", "El Poblado, Medellin", 6.2442, -75.5812],
      ["co-cartagena-centro", "Cartagena Centro", 10.391, -75.4794]
    ]
  }),
  countryProfile({
    country: "Iceland",
    continentId: "europe",
    worldRegionId: "north_atlantic",
    tags: ["volcanic terrain", "sparse vegetation", "cold waterfronts"],
    locations: [
      ["is-reykjavik-centro", "Central Reykjavik", 64.1466, -21.9426],
      ["is-akureyri-centro", "Central Akureyri", 65.6885, -18.1262],
      ["is-selfoss-centro", "Central Selfoss", 63.933, -20.9971]
    ]
  }),
  countryProfile({
    country: "Greece",
    continentId: "europe",
    worldRegionId: "mediterranean_europe",
    tags: ["bright stone", "coastal glare", "mediterranean streets"],
    locations: [
      ["gr-athens-plaka", "Plaka, Athens", 37.9838, 23.7275],
      ["gr-thessaloniki-centro", "Central Thessaloniki", 40.6401, 22.9444],
      ["gr-heraklion-centro", "Central Heraklion", 35.3387, 25.1442]
    ]
  }),
  countryProfile({
    country: "Spain",
    continentId: "europe",
    worldRegionId: "iberia",
    tags: ["sunlit plazas", "tile facades", "dense urban cores"],
    locations: [
      ["es-madrid-centro", "Central Madrid", 40.4168, -3.7038],
      ["es-barcelona-eixample", "Eixample, Barcelona", 41.3851, 2.1734],
      ["es-seville-centro", "Central Seville", 37.3891, -5.9845]
    ]
  }),
  countryProfile({
    country: "Portugal",
    continentId: "europe",
    worldRegionId: "iberia",
    tags: ["tram wires", "soft color palette", "coastal hills"],
    locations: [
      ["pt-lisbon-baixa", "Baixa, Lisbon", 38.7223, -9.1393],
      ["pt-porto-ribeira", "Ribeira, Porto", 41.1579, -8.6291],
      ["pt-faro-marina", "Faro Marina", 37.0194, -7.9304]
    ]
  }),
  countryProfile({
    country: "Poland",
    continentId: "europe",
    worldRegionId: "central_europe",
    tags: ["tram corridors", "old squares", "broad civic blocks"],
    locations: [
      ["pl-warsaw-centro", "Central Warsaw", 52.2297, 21.0122],
      ["pl-krakow-old-town", "Krakow Old Town", 50.0647, 19.945],
      ["pl-wroclaw-centro", "Central Wroclaw", 51.1079, 17.0385]
    ]
  }),
  countryProfile({
    country: "Czech Republic",
    continentId: "europe",
    worldRegionId: "central_europe",
    tags: ["tight streets", "historic facades", "ornate centers"],
    locations: [
      ["cz-prague-mala-strana", "Mala Strana, Prague", 50.0755, 14.4378],
      ["cz-brno-centro", "Central Brno", 49.1951, 16.6068],
      ["cz-ostrava-centro", "Central Ostrava", 49.8209, 18.2625]
    ]
  }),
  countryProfile({
    country: "Latvia",
    continentId: "europe",
    worldRegionId: "baltics",
    tags: ["flat skylines", "cool coast", "pine-lined roads"],
    locations: [
      ["lv-riga-centro", "Central Riga", 56.9496, 24.1052],
      ["lv-jurmala", "Jurmala", 56.968, 23.7704],
      ["lv-liepaja-centro", "Central Liepaja", 56.5047, 21.0108]
    ]
  }),
  countryProfile({
    country: "Lithuania",
    continentId: "europe",
    worldRegionId: "baltics",
    tags: ["low skylines", "old stone cores", "northern roads"],
    locations: [
      ["lt-vilnius-old-town", "Vilnius Old Town", 54.6872, 25.2797],
      ["lt-kaunas-centro", "Central Kaunas", 54.8985, 23.9036],
      ["lt-klaipeda-centro", "Central Klaipeda", 55.7033, 21.1443]
    ]
  }),
  countryProfile({
    country: "Croatia",
    continentId: "europe",
    worldRegionId: "adriatic_balkans",
    tags: ["stone waterfronts", "adriatic climbs", "sunlit old towns"],
    locations: [
      ["hr-zagreb-centro", "Central Zagreb", 45.815, 15.9819],
      ["hr-split-harbor", "Split Harbor", 43.5081, 16.4402],
      ["hr-dubrovnik-gate", "Dubrovnik Gate", 42.6507, 18.0944]
    ]
  }),
  countryProfile({
    country: "Montenegro",
    continentId: "europe",
    worldRegionId: "adriatic_balkans",
    tags: ["steep bays", "compressed coast", "stone seafronts"],
    locations: [
      ["me-podgorica-centro", "Central Podgorica", 42.4304, 19.2594],
      ["me-kotor-bay", "Kotor Bay", 42.4247, 18.7712],
      ["me-budva-seafront", "Budva Seafront", 42.2864, 18.84]
    ]
  }),
  countryProfile({
    country: "Slovakia",
    continentId: "europe",
    worldRegionId: "central_europe",
    tags: ["valley towns", "mixed architecture", "broad avenues"],
    locations: [
      ["sk-bratislava-centro", "Central Bratislava", 48.1486, 17.1077],
      ["sk-kosice-centro", "Central Kosice", 48.7164, 21.2611],
      ["sk-zilina-centro", "Central Zilina", 49.2231, 18.7394]
    ]
  }),
  countryProfile({
    country: "Slovenia",
    continentId: "europe",
    worldRegionId: "central_europe",
    tags: ["lush valleys", "tidy streets", "alpine edges"],
    locations: [
      ["si-ljubljana-centro", "Central Ljubljana", 46.0569, 14.5058],
      ["si-maribor-centro", "Central Maribor", 46.5547, 15.6459],
      ["si-koper-harbor", "Koper Harbor", 45.5481, 13.7302]
    ]
  }),
  countryProfile({
    country: "Egypt",
    continentId: "africa",
    worldRegionId: "north_africa",
    tags: ["desert haze", "flat roofs", "dense avenues"],
    locations: [
      ["eg-cairo-downtown", "Downtown Cairo", 30.0444, 31.2357],
      ["eg-giza", "Giza", 29.987, 31.2118],
      ["eg-alexandria-corniche", "Alexandria Corniche", 31.2001, 29.9187]
    ]
  }),
  countryProfile({
    country: "South Africa",
    continentId: "africa",
    worldRegionId: "southern_africa",
    tags: ["green verges", "gated suburbs", "wide arterials"],
    locations: [
      ["za-johannesburg-sandton", "Sandton, Johannesburg", -26.1076, 28.0567],
      ["za-cape-town-city-bowl", "City Bowl, Cape Town", -33.9249, 18.4241],
      ["za-durban-beachfront", "Durban Beachfront", -29.8587, 31.0218]
    ]
  }),
  countryProfile({
    country: "Oman",
    continentId: "asia",
    worldRegionId: "arabian_peninsula",
    tags: ["rocky desert", "bright highways", "low-rise stone"],
    locations: [
      ["om-muscat-muttrah", "Muttrah, Muscat", 23.588, 58.3829],
      ["om-nizwa-centro", "Central Nizwa", 22.9333, 57.5333],
      ["om-salalah-centro", "Central Salalah", 17.0194, 54.0897]
    ]
  }),
  countryProfile({
    country: "Jordan",
    continentId: "asia",
    worldRegionId: "levant",
    tags: ["pale stone", "plateau roads", "dry city edges"],
    locations: [
      ["jo-amman-centro", "Central Amman", 31.9454, 35.9284],
      ["jo-aqaba-waterfront", "Aqaba Waterfront", 29.5321, 35.0063],
      ["jo-madaba-centro", "Central Madaba", 31.7186, 35.7939]
    ]
  }),
  countryProfile({
    country: "Morocco",
    continentId: "africa",
    worldRegionId: "north_africa",
    tags: ["warm plaster", "market streets", "medina texture"],
    locations: [
      ["ma-casablanca-centro", "Central Casablanca", 33.5731, -7.5898],
      ["ma-marrakech-medina", "Marrakech Medina", 31.6295, -7.9811],
      ["ma-tangier-centro", "Central Tangier", 35.7595, -5.834]
    ]
  }),
  countryProfile({
    country: "Tunisia",
    continentId: "africa",
    worldRegionId: "north_africa",
    tags: ["coastal light", "white walls", "flat urban fabric"],
    locations: [
      ["tn-tunis-centro", "Central Tunis", 36.8065, 10.1815],
      ["tn-sousse-centro", "Central Sousse", 35.8256, 10.6369],
      ["tn-sfax-centro", "Central Sfax", 34.7398, 10.76]
    ]
  }),
  countryProfile({
    country: "Kenya",
    continentId: "africa",
    worldRegionId: "east_africa",
    tags: ["lush verges", "red earth", "busy roadside markets"],
    locations: [
      ["ke-nairobi-westlands", "Westlands, Nairobi", -1.2676, 36.8108],
      ["ke-mombasa-old-town", "Mombasa Old Town", -4.0435, 39.6682],
      ["ke-nakuru-centro", "Central Nakuru", -0.3031, 36.08]
    ]
  }),
  countryProfile({
    country: "Tanzania",
    continentId: "africa",
    worldRegionId: "east_africa",
    tags: ["open roads", "tropical coast", "soft urban grain"],
    locations: [
      ["tz-dar-es-salaam", "Dar es Salaam", -6.7924, 39.2083],
      ["tz-arusha-centro", "Central Arusha", -3.3869, 36.6829],
      ["tz-stone-town", "Stone Town", -6.1659, 39.2026]
    ]
  }),
  countryProfile({
    country: "Qatar",
    continentId: "asia",
    worldRegionId: "arabian_peninsula",
    tags: ["glass towers", "broad avenues", "desert edge"],
    locations: [
      ["qa-doha-west-bay", "West Bay, Doha", 25.2854, 51.531],
      ["qa-lusail-marina", "Lusail Marina", 25.4206, 51.5264],
      ["qa-al-wakrah", "Al Wakrah", 25.1715, 51.6034]
    ]
  }),
  countryProfile({
    country: "United Arab Emirates",
    continentId: "asia",
    worldRegionId: "arabian_peninsula",
    tags: ["polished roads", "tower corridors", "desert skyline"],
    locations: [
      ["ae-dubai-marina", "Dubai Marina", 25.0803, 55.1403],
      ["ae-abu-dhabi-corniche", "Abu Dhabi Corniche", 24.4539, 54.3773],
      ["ae-sharjah-centro", "Central Sharjah", 25.3463, 55.4209]
    ]
  }),
  countryProfile({
    country: "Maldives",
    continentId: "asia",
    worldRegionId: "indian_ocean",
    tags: ["seaside lanes", "island density", "bright water"],
    locations: [
      ["mv-male-centro", "Central Male", 4.1755, 73.5093],
      ["mv-hulhumale", "Hulhumale", 4.213, 73.5403],
      ["mv-maafushi", "Maafushi", 3.9436, 73.4907]
    ]
  }),
  countryProfile({
    country: "Japan",
    continentId: "asia",
    worldRegionId: "east_asia",
    tags: ["dense signs", "tight streets", "layered transit"],
    locations: [
      ["jp-tokyo-shibuya", "Shibuya, Tokyo", 35.6762, 139.6503],
      ["jp-osaka-namba", "Namba, Osaka", 34.6937, 135.5023],
      ["jp-kyoto-gion", "Gion, Kyoto", 35.0037, 135.7788]
    ]
  }),
  countryProfile({
    country: "Thailand",
    continentId: "asia",
    worldRegionId: "southeast_asia",
    tags: ["humid streets", "dense wires", "scooter traffic"],
    locations: [
      ["th-bangkok-sukhumvit", "Sukhumvit, Bangkok", 13.7563, 100.5018],
      ["th-chiang-mai-old-city", "Old City, Chiang Mai", 18.7883, 98.9853],
      ["th-phuket-patong", "Patong, Phuket", 7.8961, 98.2963]
    ]
  }),
  countryProfile({
    country: "Vietnam",
    continentId: "asia",
    worldRegionId: "southeast_asia",
    tags: ["narrow shopfronts", "scooter flow", "humid density"],
    locations: [
      ["vn-hcmc-district-1", "District 1, Ho Chi Minh City", 10.8231, 106.6297],
      ["vn-hanoi-old-quarter", "Old Quarter, Hanoi", 21.0285, 105.8542],
      ["vn-da-nang-riverfront", "Da Nang Riverfront", 16.0544, 108.2022]
    ]
  }),
  countryProfile({
    country: "New Zealand",
    continentId: "oceania",
    worldRegionId: "oceania",
    tags: ["rolling hills", "clean roads", "harbor cities"],
    locations: [
      ["nz-auckland-cbd", "Auckland CBD", -36.8485, 174.7633],
      ["nz-wellington-waterfront", "Wellington Waterfront", -41.2866, 174.7756],
      ["nz-christchurch-centro", "Central Christchurch", -43.5321, 172.6362]
    ]
  }),
  countryProfile({
    country: "Australia",
    continentId: "oceania",
    worldRegionId: "oceania",
    tags: ["wide roads", "sunlit suburbs", "coastal cities"],
    locations: [
      ["au-sydney-cbd", "Sydney CBD", -33.8688, 151.2093],
      ["au-melbourne-centro", "Central Melbourne", -37.8136, 144.9631],
      ["au-brisbane-south-bank", "South Bank, Brisbane", -27.4698, 153.0251]
    ]
  }),
  countryProfile({
    country: "South Korea",
    continentId: "asia",
    worldRegionId: "east_asia",
    tags: ["tower clusters", "clean signage", "broad urban corridors"],
    locations: [
      ["kr-seoul-hongdae", "Hongdae, Seoul", 37.5665, 126.978],
      ["kr-busan-haeundae", "Haeundae, Busan", 35.1796, 129.0756],
      ["kr-incheon-songdo", "Songdo, Incheon", 37.4563, 126.7052]
    ]
  }),
  countryProfile({
    country: "Malaysia",
    continentId: "asia",
    worldRegionId: "southeast_asia",
    tags: ["wet roads", "dense greenery", "orderly arterials"],
    locations: [
      ["my-kl-bukit-bintang", "Bukit Bintang, Kuala Lumpur", 3.139, 101.6869],
      ["my-penang-georgetown", "Georgetown, Penang", 5.4164, 100.3327],
      ["my-johor-bahru-centro", "Central Johor Bahru", 1.4927, 103.7414]
    ]
  }),
  countryProfile({
    country: "Indonesia",
    continentId: "asia",
    worldRegionId: "southeast_asia",
    tags: ["dense motorbikes", "humid neighborhoods", "busy intersections"],
    locations: [
      ["id-jakarta-sudirman", "Sudirman, Jakarta", -6.2088, 106.8456],
      ["id-bandung-centro", "Central Bandung", -6.9175, 107.6191],
      ["id-yogyakarta-malioboro", "Malioboro, Yogyakarta", -7.7956, 110.3695]
    ]
  }),
  countryProfile({
    country: "India",
    continentId: "asia",
    worldRegionId: "south_asia",
    tags: ["crowded roads", "layered signage", "mixed traffic"],
    locations: [
      ["in-delhi-connaught", "Connaught Place, New Delhi", 28.6139, 77.209],
      ["in-mumbai-colaba", "Colaba, Mumbai", 19.076, 72.8777],
      ["in-bengaluru-mg-road", "MG Road, Bengaluru", 12.9716, 77.5946]
    ]
  }),
  countryProfile({
    country: "Nepal",
    continentId: "asia",
    worldRegionId: "south_asia",
    tags: ["steep valleys", "mountain haze", "tight mixed-use streets"],
    locations: [
      ["np-kathmandu-thamel", "Thamel, Kathmandu", 27.7172, 85.324],
      ["np-pokhara-lakeside", "Lakeside, Pokhara", 28.2096, 83.9856],
      ["np-bhaktapur-durbar", "Bhaktapur Durbar", 27.671, 85.4298]
    ]
  })
];

export const ALL_LOCATIONS: RoundLocation[] = COUNTRY_LOCATION_PROFILES.flatMap((profile) => profile.locations);
export const ALL_COUNTRIES = COUNTRY_LOCATION_PROFILES.map((profile) => profile.country);
export const ALL_CONTINENT_LABELS = Object.values(CONTINENT_META).map((continent) => continent.label);
export const ALL_WORLD_REGION_LABELS = Object.values(WORLD_REGION_META).map((region) => region.label);

const LOCATION_BY_ID = new Map(ALL_LOCATIONS.map((location) => [location.id, location]));
const LOCATIONS_BY_COUNTRY = new Map(COUNTRY_LOCATION_PROFILES.map((profile) => [profile.country, profile.locations]));
const LOCATIONS_BY_WORLD_REGION = new Map<WorldRegionId, RoundLocation[]>();
const LOCATIONS_BY_CONTINENT = new Map<ContinentId, RoundLocation[]>();
const COUNTRY_PROFILE_BY_NAME = new Map(COUNTRY_LOCATION_PROFILES.map((profile) => [profile.country, profile]));

for (const location of ALL_LOCATIONS) {
  const worldRegionLocations = LOCATIONS_BY_WORLD_REGION.get(location.worldRegionId) ?? [];
  worldRegionLocations.push(location);
  LOCATIONS_BY_WORLD_REGION.set(location.worldRegionId, worldRegionLocations);

  const continentLocations = LOCATIONS_BY_CONTINENT.get(location.continentId) ?? [];
  continentLocations.push(location);
  LOCATIONS_BY_CONTINENT.set(location.continentId, continentLocations);
}

export function getLocationById(id: string): RoundLocation | null {
  return LOCATION_BY_ID.get(id) ?? null;
}

export function getLocationsByCountry(country: string): RoundLocation[] {
  return LOCATIONS_BY_COUNTRY.get(country) ?? [];
}

export function getLocationsByWorldRegion(worldRegionId: WorldRegionId): RoundLocation[] {
  return LOCATIONS_BY_WORLD_REGION.get(worldRegionId) ?? [];
}

export function getLocationsByContinent(continentId: ContinentId): RoundLocation[] {
  return LOCATIONS_BY_CONTINENT.get(continentId) ?? [];
}

export function getCountryProfile(country: string): CountryLocationProfile | null {
  return COUNTRY_PROFILE_BY_NAME.get(country) ?? null;
}

export function getContinentLabel(continentId: ContinentId): string {
  return CONTINENT_META[continentId].label;
}

export function getWorldRegionLabel(worldRegionId: WorldRegionId): string {
  return WORLD_REGION_META[worldRegionId].label;
}

export function getLabelsForMode(mode: GameMode): string[] {
  if (mode === "continent") {
    return ALL_CONTINENT_LABELS;
  }

  if (mode === "world_region") {
    return ALL_WORLD_REGION_LABELS;
  }

  return ALL_COUNTRIES;
}

export function getRelatedWorldRegions(worldRegionId: WorldRegionId): WorldRegionId[] {
  const target = WORLD_REGION_META[worldRegionId];

  return Object.values(WORLD_REGION_META)
    .filter((region) => region.continentId === target.continentId && region.id !== worldRegionId)
    .map((region) => region.id);
}

export function getRelatedContinents(continentId: ContinentId): ContinentId[] {
  return Object.values(CONTINENT_META)
    .filter((continent) => continent.id !== continentId)
    .map((continent) => continent.id);
}
