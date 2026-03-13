import type { CountryPair } from "../types/game";

export const HARD_CONFUSION_PAIRS: CountryPair[] = [
  {
    id: "czech-vs-russia",
    options: ["Czech Republic", "Russia"],
    difficulty: "hard",
    rationale: "Historic architecture + winter streets can overlap visually.",
    regionTag: "Eastern Europe",
    visualTags: ["old town", "tram", "winter", "stone street"]
  },
  {
    id: "serbia-vs-bulgaria",
    options: ["Serbia", "Bulgaria"],
    difficulty: "hard",
    rationale: "Balkan urban blocks and mountain villages look similar.",
    regionTag: "Balkans",
    visualTags: ["apartment blocks", "hills", "church"]
  },
  {
    id: "latvia-vs-lithuania",
    options: ["Latvia", "Lithuania"],
    difficulty: "hard",
    rationale: "Baltic old towns and forest roads are frequently confused.",
    regionTag: "Baltics",
    visualTags: ["pine forest", "old center", "coast"]
  },
  {
    id: "norway-vs-iceland",
    options: ["Norway", "Iceland"],
    difficulty: "hard",
    rationale: "Nordic mountain/coastal landscapes overlap heavily.",
    regionTag: "Nordics",
    visualTags: ["fjord", "snow", "coast", "waterfall"]
  },
  {
    id: "slovakia-vs-slovenia",
    options: ["Slovakia", "Slovenia"],
    difficulty: "hard",
    rationale: "Alpine villages and Central European architecture mix up easily.",
    regionTag: "Central Europe",
    visualTags: ["alps", "village", "lake"]
  },
  {
    id: "croatia-vs-montenegro",
    options: ["Croatia", "Montenegro"],
    difficulty: "hard",
    rationale: "Adriatic coastline is visually close.",
    regionTag: "Adriatic",
    visualTags: ["coastal town", "stone houses", "harbor"]
  },
  {
    id: "argentina-vs-chile",
    options: ["Argentina", "Chile"],
    difficulty: "hard",
    rationale: "Patagonia and Andean scenes overlap.",
    regionTag: "South America",
    visualTags: ["mountain", "dry valley", "highway"]
  },
  {
    id: "japan-vs-south-korea",
    options: ["Japan", "South Korea"],
    difficulty: "hard",
    rationale: "Dense East Asian city blocks are difficult without language clues.",
    regionTag: "East Asia",
    visualTags: ["city", "neon", "subway", "apartment"]
  },
  {
    id: "austria-vs-switzerland",
    options: ["Austria", "Switzerland"],
    difficulty: "hard",
    rationale: "Alpine architecture and rail towns are very similar.",
    regionTag: "Alps",
    visualTags: ["mountain village", "train", "lake"]
  },
  {
    id: "morocco-vs-tunisia",
    options: ["Morocco", "Tunisia"],
    difficulty: "hard",
    rationale: "North African medina aesthetics can be close.",
    regionTag: "North Africa",
    visualTags: ["market", "sand tone", "old city"]
  },
  {
    id: "georgia-vs-armenia",
    options: ["Georgia", "Armenia"],
    difficulty: "hard",
    rationale: "Caucasus mountain roads and stone villages often overlap.",
    regionTag: "Caucasus",
    visualTags: ["mountain road", "church", "valley"]
  },
  {
    id: "new-zealand-vs-united-kingdom",
    options: ["New Zealand", "United Kingdom"],
    difficulty: "hard",
    rationale: "Green rural roads and overcast skies can feel similar.",
    regionTag: "Commonwealth",
    visualTags: ["countryside", "coast", "rain"]
  }
];

export const EASY_CONTRAST_PAIRS: CountryPair[] = [
  {
    id: "jamaica-vs-russia",
    options: ["Jamaica", "Russia"],
    difficulty: "easy",
    rationale: "Tropical Caribbean vs cold continental visuals are obvious.",
    regionTag: "Caribbean vs Eastern Bloc",
    visualTags: ["beach", "palm", "snow", "urban blocks"]
  },
  {
    id: "bahamas-vs-poland",
    options: ["Bahamas", "Poland"],
    difficulty: "easy",
    rationale: "Turquoise islands vs Central European city fabric.",
    regionTag: "Caribbean vs Eastern Europe",
    visualTags: ["beach", "clear water", "tram", "old town"]
  },
  {
    id: "egypt-vs-finland",
    options: ["Egypt", "Finland"],
    difficulty: "easy",
    rationale: "Desert palette vs boreal forests and snow.",
    regionTag: "Desert vs Nordic",
    visualTags: ["desert", "pyramid", "snow", "forest"]
  },
  {
    id: "maldives-vs-hungary",
    options: ["Maldives", "Hungary"],
    difficulty: "easy",
    rationale: "Overwater bungalows vs inland Central Europe.",
    regionTag: "Island vs Inland",
    visualTags: ["lagoon", "resort", "city", "bridge"]
  },
  {
    id: "iceland-vs-thailand",
    options: ["Iceland", "Thailand"],
    difficulty: "easy",
    rationale: "Volcanic cold landscapes vs tropical Southeast Asia.",
    regionTag: "Nordic vs Tropical",
    visualTags: ["volcano", "glacier", "palm", "temple"]
  },
  {
    id: "greenland-vs-dominican",
    options: ["Greenland", "Dominican Republic"],
    difficulty: "easy",
    rationale: "Ice and tundra vs tropical beach coast.",
    regionTag: "Arctic vs Caribbean",
    visualTags: ["ice", "snow", "beach", "resort"]
  },
  {
    id: "qatar-vs-estonia",
    options: ["Qatar", "Estonia"],
    difficulty: "easy",
    rationale: "Desert modern skyline vs Baltic old/cool weather scenes.",
    regionTag: "Gulf vs Baltics",
    visualTags: ["desert", "skyline", "forest", "old town"]
  },
  {
    id: "costa-rica-vs-belarus",
    options: ["Costa Rica", "Belarus"],
    difficulty: "easy",
    rationale: "Rainforest tropics vs Eastern European plains/cities.",
    regionTag: "Tropics vs Eastern Europe",
    visualTags: ["jungle", "beach", "avenue", "blocks"]
  },
  {
    id: "fiji-vs-moldova",
    options: ["Fiji", "Moldova"],
    difficulty: "easy",
    rationale: "Island paradise vs inland Eastern Europe.",
    regionTag: "Pacific vs Eastern Europe",
    visualTags: ["island", "blue sea", "village", "fields"]
  },
  {
    id: "oman-vs-sweden",
    options: ["Oman", "Sweden"],
    difficulty: "easy",
    rationale: "Arid mountains vs Nordic forests/lakes.",
    regionTag: "Arabian vs Nordic",
    visualTags: ["desert", "wadi", "lake", "forest"]
  }
];

export const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  "Czech Republic": [49.8175, 15.473],
  Russia: [61.524, 105.3188],
  Serbia: [44.0165, 21.0059],
  Bulgaria: [42.7339, 25.4858],
  Latvia: [56.8796, 24.6032],
  Lithuania: [55.1694, 23.8813],
  Norway: [60.472, 8.4689],
  Iceland: [64.9631, -19.0208],
  Slovakia: [48.669, 19.699],
  Slovenia: [46.1512, 14.9955],
  Croatia: [45.1, 15.2],
  Montenegro: [42.7087, 19.3744],
  Argentina: [-38.4161, -63.6167],
  Chile: [-35.6751, -71.543],
  Japan: [36.2048, 138.2529],
  "South Korea": [35.9078, 127.7669],
  Austria: [47.5162, 14.5501],
  Switzerland: [46.8182, 8.2275],
  Morocco: [31.7917, -7.0926],
  Tunisia: [33.8869, 9.5375],
  Georgia: [42.3154, 43.3569],
  Armenia: [40.0691, 45.0382],
  "New Zealand": [-40.9006, 174.886],
  "United Kingdom": [55.3781, -3.436],
  Jamaica: [18.1096, -77.2975],
  Bahamas: [25.0343, -77.3963],
  Poland: [51.9194, 19.1451],
  Egypt: [26.8206, 30.8025],
  Finland: [61.9241, 25.7482],
  Maldives: [3.2028, 73.2207],
  Hungary: [47.1625, 19.5033],
  Thailand: [15.87, 100.9925],
  Greenland: [71.7069, -42.6043],
  "Dominican Republic": [18.7357, -70.1627],
  Qatar: [25.3548, 51.1839],
  Estonia: [58.5953, 25.0136],
  "Costa Rica": [9.7489, -83.7534],
  Belarus: [53.7098, 27.9534],
  Fiji: [-17.7134, 178.065],
  Moldova: [47.4116, 28.3699],
  Oman: [21.4735, 55.9754],
  Sweden: [60.1282, 18.6435]
};

export const COUNTRY_SEARCH_KEYWORDS: Record<string, string[]> = {
  "Czech Republic": ["Prague", "old town", "tram street"],
  Russia: ["street", "city", "winter"],
  Serbia: ["Belgrade", "street", "blocks"],
  Bulgaria: ["Sofia", "street", "historic center"],
  Latvia: ["Riga", "old city", "street"],
  Lithuania: ["Vilnius", "old city", "street"],
  Norway: ["fjord", "town", "coast"],
  Iceland: ["Reykjavik", "road", "landscape"],
  Slovakia: ["mountain village", "city center", "street"],
  Slovenia: ["Ljubljana", "alpine", "lake"],
  Croatia: ["Dubrovnik", "coast", "old town"],
  Montenegro: ["Kotor", "coast", "old town"],
  Argentina: ["Patagonia", "city", "road"],
  Chile: ["Andes", "city", "road"],
  Japan: ["Tokyo", "street", "neon"],
  "South Korea": ["Seoul", "street", "city"],
  Austria: ["Vienna", "alpine village", "street"],
  Switzerland: ["Zurich", "alpine town", "street"],
  Morocco: ["Marrakech", "medina", "street"],
  Tunisia: ["Tunis", "medina", "street"],
  Georgia: ["Tbilisi", "mountain", "street"],
  Armenia: ["Yerevan", "mountain", "street"],
  "New Zealand": ["Auckland", "coast", "road"],
  "United Kingdom": ["London", "town", "street"],
  Jamaica: ["beach", "coast", "town"],
  Bahamas: ["beach", "island", "resort"],
  Poland: ["Warsaw", "old town", "street"],
  Egypt: ["Cairo", "street", "desert"],
  Finland: ["Helsinki", "street", "snow"],
  Maldives: ["lagoon", "beach", "resort"],
  Hungary: ["Budapest", "street", "bridge"],
  Thailand: ["Bangkok", "street", "temple"],
  Greenland: ["ice", "town", "coast"],
  "Dominican Republic": ["beach", "resort", "coast"],
  Qatar: ["Doha", "skyline", "street"],
  Estonia: ["Tallinn", "old town", "street"],
  "Costa Rica": ["rainforest", "beach", "road"],
  Belarus: ["Minsk", "avenue", "street"],
  Fiji: ["island", "beach", "village"],
  Moldova: ["city", "street", "village"],
  Oman: ["wadi", "desert", "coast"],
  Sweden: ["Stockholm", "lake", "street"]
};
