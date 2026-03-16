/**
 * Global city/country catalog — every entry feeds the combinatorial pair
 * generator at the bottom of this file. Adding a country here automatically
 * creates hundreds of new pairs across all game modes.
 *
 * ~150 countries → C(150,2) ≈ 11,175 raw pairs → ~15,000+ stage-assigned pairs.
 */

export type ContinentLabel =
  | "North America"
  | "Central America"
  | "Caribbean"
  | "South America"
  | "Europe"
  | "Africa"
  | "Middle East"
  | "South Asia"
  | "East Asia"
  | "Southeast Asia"
  | "Oceania";

export interface CityCatalogEntry {
  country: string;
  city: string;
  coordinates: [number, number];
  continent: ContinentLabel;
  searchTerms: string[];
  /** Whether this country has confirmed Google Street View coverage */
  streetView: boolean;
}

export const CITY_CATALOG: CityCatalogEntry[] = [
  // ══════════════════════════════════════════════════════════════════
  // NORTH AMERICA
  // ══════════════════════════════════════════════════════════════════
  { country: "Canada", city: "Toronto", coordinates: [43.6532, -79.3832], continent: "North America", searchTerms: ["Toronto downtown", "CN Tower", "Canadian city"], streetView: true },
  { country: "United States", city: "New York City", coordinates: [40.758, -73.9855], continent: "North America", searchTerms: ["Times Square", "Manhattan street", "NYC block"], streetView: true },
  { country: "Mexico", city: "Mexico City", coordinates: [19.4326, -99.1332], continent: "North America", searchTerms: ["CDMX Reforma", "Zocalo", "Mexico City center"], streetView: true },
  { country: "Bermuda", city: "Hamilton", coordinates: [32.2949, -64.782], continent: "North America", searchTerms: ["Hamilton Bermuda", "pastel buildings", "Atlantic island"], streetView: true },
  { country: "Greenland", city: "Nuuk", coordinates: [64.1814, -51.6941], continent: "North America", searchTerms: ["Nuuk colorful houses", "Greenland capital", "Arctic town"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // CENTRAL AMERICA
  // ══════════════════════════════════════════════════════════════════
  { country: "Guatemala", city: "Guatemala City", coordinates: [14.6349, -90.5069], continent: "Central America", searchTerms: ["Guatemala City street", "Central American capital", "highland city"], streetView: true },
  { country: "Belize", city: "Belize City", coordinates: [17.4985, -88.1886], continent: "Central America", searchTerms: ["Belize City harbor", "Caribbean coast", "wooden houses"], streetView: false },
  { country: "Honduras", city: "Tegucigalpa", coordinates: [14.0723, -87.1921], continent: "Central America", searchTerms: ["Tegucigalpa street", "Honduran capital", "mountain city"], streetView: false },
  { country: "El Salvador", city: "San Salvador", coordinates: [13.6929, -89.2182], continent: "Central America", searchTerms: ["San Salvador street", "Salvadoran capital", "volcanic city"], streetView: false },
  { country: "Nicaragua", city: "Managua", coordinates: [12.1149, -86.2362], continent: "Central America", searchTerms: ["Managua street", "Nicaraguan capital", "lakeside city"], streetView: false },
  { country: "Costa Rica", city: "San Jose", coordinates: [9.9281, -84.0907], continent: "Central America", searchTerms: ["San Jose Costa Rica", "Central American city", "highland capital"], streetView: true },
  { country: "Panama", city: "Panama City", coordinates: [8.9824, -79.5199], continent: "Central America", searchTerms: ["Panama City skyline", "canal zone", "tropical towers"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // CARIBBEAN
  // ══════════════════════════════════════════════════════════════════
  { country: "Jamaica", city: "Kingston", coordinates: [17.9712, -76.7936], continent: "Caribbean", searchTerms: ["Kingston Jamaica", "Caribbean street", "tropical town"], streetView: true },
  { country: "Cuba", city: "Havana", coordinates: [23.1136, -82.3666], continent: "Caribbean", searchTerms: ["Havana old town", "classic cars", "Cuban street"], streetView: true },
  { country: "Dominican Republic", city: "Santo Domingo", coordinates: [18.4861, -69.9312], continent: "Caribbean", searchTerms: ["Santo Domingo colonial", "Dominican street", "Caribbean city"], streetView: true },
  { country: "Puerto Rico", city: "San Juan", coordinates: [18.4655, -66.1057], continent: "Caribbean", searchTerms: ["Old San Juan", "colorful street", "Caribbean colonial"], streetView: true },
  { country: "Trinidad and Tobago", city: "Port of Spain", coordinates: [10.6596, -61.5086], continent: "Caribbean", searchTerms: ["Port of Spain", "Trinidad street", "Caribbean port"], streetView: false },
  { country: "Barbados", city: "Bridgetown", coordinates: [13.0969, -59.6145], continent: "Caribbean", searchTerms: ["Bridgetown harbor", "Barbados street", "coral stone"], streetView: false },
  { country: "Curacao", city: "Willemstad", coordinates: [12.1696, -68.99], continent: "Caribbean", searchTerms: ["Willemstad colorful", "Curacao waterfront", "Dutch Caribbean"], streetView: true },
  { country: "Aruba", city: "Oranjestad", coordinates: [12.5093, -70.0086], continent: "Caribbean", searchTerms: ["Oranjestad street", "Aruba coast", "Dutch Caribbean island"], streetView: true },
  { country: "US Virgin Islands", city: "Charlotte Amalie", coordinates: [18.3358, -64.9307], continent: "Caribbean", searchTerms: ["Charlotte Amalie harbor", "USVI street", "Caribbean port town"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // SOUTH AMERICA
  // ══════════════════════════════════════════════════════════════════
  { country: "Colombia", city: "Bogota", coordinates: [4.711, -74.0721], continent: "South America", searchTerms: ["Bogota center", "Colombian capital", "highland city"], streetView: true },
  { country: "Venezuela", city: "Caracas", coordinates: [10.4806, -66.9036], continent: "South America", searchTerms: ["Caracas valley", "Venezuelan capital", "mountain city"], streetView: false },
  { country: "Ecuador", city: "Quito", coordinates: [-0.1807, -78.4678], continent: "South America", searchTerms: ["Quito colonial", "Ecuadorian capital", "equatorial city"], streetView: true },
  { country: "Peru", city: "Lima", coordinates: [-12.0464, -77.0428], continent: "South America", searchTerms: ["Lima Miraflores", "Peruvian coast", "Lima center"], streetView: true },
  { country: "Brazil", city: "Sao Paulo", coordinates: [-23.5505, -46.6333], continent: "South America", searchTerms: ["Sao Paulo Paulista", "Brazilian megacity", "urban jungle"], streetView: true },
  { country: "Bolivia", city: "La Paz", coordinates: [-16.4897, -68.1193], continent: "South America", searchTerms: ["La Paz Bolivia", "highland city", "Andean capital"], streetView: true },
  { country: "Paraguay", city: "Asuncion", coordinates: [-25.2637, -57.5759], continent: "South America", searchTerms: ["Asuncion street", "Paraguayan capital", "river city"], streetView: true },
  { country: "Chile", city: "Santiago", coordinates: [-33.4489, -70.6693], continent: "South America", searchTerms: ["Santiago Chile", "Andes city", "Chilean capital"], streetView: true },
  { country: "Argentina", city: "Buenos Aires", coordinates: [-34.6037, -58.3816], continent: "South America", searchTerms: ["Buenos Aires avenue", "Palermo street", "Argentine capital"], streetView: true },
  { country: "Uruguay", city: "Montevideo", coordinates: [-34.9011, -56.1645], continent: "South America", searchTerms: ["Montevideo rambla", "Uruguayan capital", "river plate city"], streetView: true },
  { country: "Guyana", city: "Georgetown", coordinates: [6.8013, -58.1551], continent: "South America", searchTerms: ["Georgetown Guyana", "wooden colonial", "Caribbean South America"], streetView: false },
  { country: "Suriname", city: "Paramaribo", coordinates: [5.852, -55.2038], continent: "South America", searchTerms: ["Paramaribo wooden city", "Surinamese capital", "Dutch colonial"], streetView: false },

  // ══════════════════════════════════════════════════════════════════
  // WESTERN EUROPE
  // ══════════════════════════════════════════════════════════════════
  { country: "Iceland", city: "Reykjavik", coordinates: [64.1466, -21.9426], continent: "Europe", searchTerms: ["Reykjavik street", "Nordic harbor", "Icelandic town"], streetView: true },
  { country: "Ireland", city: "Dublin", coordinates: [53.3498, -6.2603], continent: "Europe", searchTerms: ["Dublin street", "Irish pub", "Georgian doors"], streetView: true },
  { country: "United Kingdom", city: "London", coordinates: [51.5074, -0.1278], continent: "Europe", searchTerms: ["London street", "red bus", "British city"], streetView: true },
  { country: "France", city: "Paris", coordinates: [48.8566, 2.3522], continent: "Europe", searchTerms: ["Paris boulevard", "Haussmann", "French cafe"], streetView: true },
  { country: "Belgium", city: "Brussels", coordinates: [50.8503, 4.3517], continent: "Europe", searchTerms: ["Brussels Grand Place", "Belgian street", "EU quarter"], streetView: true },
  { country: "Netherlands", city: "Amsterdam", coordinates: [52.3676, 4.9041], continent: "Europe", searchTerms: ["Amsterdam canal", "Dutch bikes", "narrow houses"], streetView: true },
  { country: "Luxembourg", city: "Luxembourg City", coordinates: [49.6116, 6.13], continent: "Europe", searchTerms: ["Luxembourg fortress", "European city", "small capital"], streetView: true },
  { country: "Germany", city: "Berlin", coordinates: [52.52, 13.405], continent: "Europe", searchTerms: ["Berlin street", "Brandenburg area", "German capital"], streetView: true },
  { country: "Switzerland", city: "Zurich", coordinates: [47.3769, 8.5417], continent: "Europe", searchTerms: ["Zurich street", "Swiss city", "alpine urban"], streetView: true },
  { country: "Austria", city: "Vienna", coordinates: [48.2082, 16.3738], continent: "Europe", searchTerms: ["Vienna Ringstrasse", "Austrian capital", "imperial city"], streetView: true },
  { country: "Spain", city: "Madrid", coordinates: [40.4168, -3.7038], continent: "Europe", searchTerms: ["Madrid plaza", "Gran Via", "Spanish capital"], streetView: true },
  { country: "Portugal", city: "Lisbon", coordinates: [38.7223, -9.1393], continent: "Europe", searchTerms: ["Lisbon tram", "Alfama street", "Portuguese capital"], streetView: true },
  { country: "Italy", city: "Rome", coordinates: [41.9028, 12.4964], continent: "Europe", searchTerms: ["Rome street", "Italian piazza", "ancient city"], streetView: true },
  { country: "Greece", city: "Athens", coordinates: [37.9838, 23.7275], continent: "Europe", searchTerms: ["Athens Plaka", "Acropolis area", "Greek street"], streetView: true },
  { country: "Denmark", city: "Copenhagen", coordinates: [55.6761, 12.5683], continent: "Europe", searchTerms: ["Copenhagen Nyhavn", "Danish bike lane", "Scandinavian city"], streetView: true },
  { country: "Norway", city: "Oslo", coordinates: [59.9139, 10.7522], continent: "Europe", searchTerms: ["Oslo waterfront", "Norwegian capital", "fjord city"], streetView: true },
  { country: "Sweden", city: "Stockholm", coordinates: [59.3293, 18.0686], continent: "Europe", searchTerms: ["Stockholm archipelago", "Swedish capital", "Nordic city"], streetView: true },
  { country: "Finland", city: "Helsinki", coordinates: [60.1699, 24.9384], continent: "Europe", searchTerms: ["Helsinki harbor", "Finnish capital", "Nordic architecture"], streetView: true },
  { country: "Malta", city: "Valletta", coordinates: [35.8989, 14.5146], continent: "Europe", searchTerms: ["Valletta street", "Maltese capital", "Mediterranean fortress"], streetView: true },
  { country: "Cyprus", city: "Nicosia", coordinates: [35.1856, 33.3823], continent: "Europe", searchTerms: ["Nicosia old town", "Cypriot capital", "divided city"], streetView: true },
  { country: "Monaco", city: "Monaco", coordinates: [43.7384, 7.4246], continent: "Europe", searchTerms: ["Monaco harbor", "Monte Carlo", "Mediterranean microstate"], streetView: true },
  { country: "Andorra", city: "Andorra la Vella", coordinates: [42.5063, 1.5218], continent: "Europe", searchTerms: ["Andorra la Vella street", "Pyrenees town", "mountain microstate"], streetView: true },
  { country: "San Marino", city: "San Marino", coordinates: [43.9424, 12.4578], continent: "Europe", searchTerms: ["San Marino fortress", "hilltop republic", "Italian microstate"], streetView: true },
  { country: "Liechtenstein", city: "Vaduz", coordinates: [47.141, 9.5215], continent: "Europe", searchTerms: ["Vaduz castle", "Liechtenstein capital", "Alpine microstate"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // CENTRAL & EASTERN EUROPE
  // ══════════════════════════════════════════════════════════════════
  { country: "Poland", city: "Warsaw", coordinates: [52.2297, 21.0122], continent: "Europe", searchTerms: ["Warsaw street", "Polish capital", "Central European city"], streetView: true },
  { country: "Czech Republic", city: "Prague", coordinates: [50.0755, 14.4378], continent: "Europe", searchTerms: ["Prague old town", "Czech capital", "Central European city"], streetView: true },
  { country: "Slovakia", city: "Bratislava", coordinates: [48.1486, 17.1077], continent: "Europe", searchTerms: ["Bratislava center", "Slovak capital", "Danube city"], streetView: true },
  { country: "Hungary", city: "Budapest", coordinates: [47.4979, 19.0402], continent: "Europe", searchTerms: ["Budapest Danube", "Hungarian capital", "thermal city"], streetView: true },
  { country: "Romania", city: "Bucharest", coordinates: [44.4268, 26.1025], continent: "Europe", searchTerms: ["Bucharest boulevard", "Romanian capital", "Eastern European"], streetView: true },
  { country: "Bulgaria", city: "Sofia", coordinates: [42.6977, 23.3219], continent: "Europe", searchTerms: ["Sofia street", "Bulgarian capital", "Balkan city"], streetView: true },
  { country: "Latvia", city: "Riga", coordinates: [56.9496, 24.1052], continent: "Europe", searchTerms: ["Riga old town", "Art Nouveau", "Baltic capital"], streetView: true },
  { country: "Lithuania", city: "Vilnius", coordinates: [54.6872, 25.2797], continent: "Europe", searchTerms: ["Vilnius street", "Baltic capital", "old town"], streetView: true },
  { country: "Estonia", city: "Tallinn", coordinates: [59.437, 24.7536], continent: "Europe", searchTerms: ["Tallinn old town", "Estonian capital", "medieval city"], streetView: true },
  { country: "Croatia", city: "Zagreb", coordinates: [45.815, 15.9819], continent: "Europe", searchTerms: ["Zagreb center", "Croatian capital", "Adriatic city"], streetView: true },
  { country: "Slovenia", city: "Ljubljana", coordinates: [46.0569, 14.5058], continent: "Europe", searchTerms: ["Ljubljana street", "Slovenian capital", "alpine city"], streetView: true },
  { country: "Serbia", city: "Belgrade", coordinates: [44.7866, 20.4489], continent: "Europe", searchTerms: ["Belgrade fortress", "Serbian capital", "Danube city"], streetView: true },
  { country: "Montenegro", city: "Podgorica", coordinates: [42.4304, 19.2594], continent: "Europe", searchTerms: ["Podgorica street", "Montenegrin capital", "Balkan city"], streetView: true },
  { country: "Bosnia and Herzegovina", city: "Sarajevo", coordinates: [43.8563, 18.4131], continent: "Europe", searchTerms: ["Sarajevo old town", "Bosnian capital", "valley city"], streetView: true },
  { country: "North Macedonia", city: "Skopje", coordinates: [41.9973, 21.428], continent: "Europe", searchTerms: ["Skopje center", "Macedonian capital", "Balkan city"], streetView: true },
  { country: "Albania", city: "Tirana", coordinates: [41.3275, 19.8187], continent: "Europe", searchTerms: ["Tirana colorful buildings", "Albanian capital", "Balkan city"], streetView: true },
  { country: "Moldova", city: "Chisinau", coordinates: [47.0105, 28.8638], continent: "Europe", searchTerms: ["Chisinau boulevard", "Moldovan capital", "Soviet era"], streetView: true },
  { country: "Ukraine", city: "Kyiv", coordinates: [50.4501, 30.5234], continent: "Europe", searchTerms: ["Kyiv Khreshchatyk", "Ukrainian capital", "golden domes"], streetView: true },
  { country: "Georgia", city: "Tbilisi", coordinates: [41.7151, 44.8271], continent: "Europe", searchTerms: ["Tbilisi old town", "Georgian capital", "Caucasus city"], streetView: true },
  { country: "Armenia", city: "Yerevan", coordinates: [40.1872, 44.5152], continent: "Europe", searchTerms: ["Yerevan pink stone", "Armenian capital", "Ararat view"], streetView: false },
  { country: "Kosovo", city: "Pristina", coordinates: [42.6629, 21.1655], continent: "Europe", searchTerms: ["Pristina street", "Kosovar capital", "Balkan city"], streetView: true },
  { country: "Belarus", city: "Minsk", coordinates: [53.9006, 27.559], continent: "Europe", searchTerms: ["Minsk boulevard", "Belarusian capital", "Soviet architecture"], streetView: true },
  { country: "Turkey", city: "Istanbul", coordinates: [41.0082, 28.9784], continent: "Europe", searchTerms: ["Istanbul bazaar", "Bosphorus", "Turkish city"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // NORTH AFRICA
  // ══════════════════════════════════════════════════════════════════
  { country: "Morocco", city: "Casablanca", coordinates: [33.5731, -7.5898], continent: "Africa", searchTerms: ["Casablanca street", "Moroccan city", "North African port"], streetView: true },
  { country: "Algeria", city: "Algiers", coordinates: [36.7538, 3.0588], continent: "Africa", searchTerms: ["Algiers Casbah", "Algerian capital", "Mediterranean city"], streetView: false },
  { country: "Tunisia", city: "Tunis", coordinates: [36.8065, 10.1815], continent: "Africa", searchTerms: ["Tunis medina", "Tunisian capital", "North African city"], streetView: true },
  { country: "Libya", city: "Tripoli", coordinates: [32.8872, 13.1913], continent: "Africa", searchTerms: ["Tripoli old city", "Libyan capital", "Mediterranean port"], streetView: false },
  { country: "Egypt", city: "Cairo", coordinates: [30.0444, 31.2357], continent: "Africa", searchTerms: ["Cairo street", "Egyptian capital", "Nile city"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // WEST AFRICA
  // ══════════════════════════════════════════════════════════════════
  { country: "Senegal", city: "Dakar", coordinates: [14.7167, -17.4677], continent: "Africa", searchTerms: ["Dakar street", "Senegalese capital", "West African coast"], streetView: true },
  { country: "Ghana", city: "Accra", coordinates: [5.6037, -0.187], continent: "Africa", searchTerms: ["Accra market", "Ghanaian capital", "West African city"], streetView: true },
  { country: "Nigeria", city: "Lagos", coordinates: [6.5244, 3.3792], continent: "Africa", searchTerms: ["Lagos traffic", "Nigerian megacity", "West African hub"], streetView: true },
  { country: "Ivory Coast", city: "Abidjan", coordinates: [5.3599, -4.0083], continent: "Africa", searchTerms: ["Abidjan Plateau", "Ivorian city", "West African port"], streetView: false },
  { country: "Mali", city: "Bamako", coordinates: [12.6392, -8.0029], continent: "Africa", searchTerms: ["Bamako market", "Malian capital", "Niger River city"], streetView: false },
  { country: "Burkina Faso", city: "Ouagadougou", coordinates: [12.3714, -1.5197], continent: "Africa", searchTerms: ["Ouagadougou street", "Burkinabe capital", "Sahel city"], streetView: false },

  // ══════════════════════════════════════════════════════════════════
  // EAST AFRICA
  // ══════════════════════════════════════════════════════════════════
  { country: "Kenya", city: "Nairobi", coordinates: [-1.2921, 36.8219], continent: "Africa", searchTerms: ["Nairobi CBD", "Kenyan capital", "East African city"], streetView: true },
  { country: "Tanzania", city: "Dar es Salaam", coordinates: [-6.7924, 39.2083], continent: "Africa", searchTerms: ["Dar es Salaam", "Tanzanian port", "East African coast"], streetView: true },
  { country: "Uganda", city: "Kampala", coordinates: [0.3476, 32.5825], continent: "Africa", searchTerms: ["Kampala hills", "Ugandan capital", "East African city"], streetView: true },
  { country: "Ethiopia", city: "Addis Ababa", coordinates: [9.0054, 38.7636], continent: "Africa", searchTerms: ["Addis Ababa street", "Ethiopian capital", "highland city"], streetView: false },
  { country: "Rwanda", city: "Kigali", coordinates: [-1.9706, 30.1044], continent: "Africa", searchTerms: ["Kigali clean street", "Rwandan capital", "thousand hills"], streetView: true },
  { country: "Madagascar", city: "Antananarivo", coordinates: [-18.8792, 47.5079], continent: "Africa", searchTerms: ["Antananarivo hills", "Malagasy capital", "island city"], streetView: true },
  { country: "Mauritius", city: "Port Louis", coordinates: [-20.1609, 57.5012], continent: "Africa", searchTerms: ["Port Louis waterfront", "Mauritian capital", "Indian Ocean island"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // SOUTHERN AFRICA
  // ══════════════════════════════════════════════════════════════════
  { country: "South Africa", city: "Johannesburg", coordinates: [-26.2041, 28.0473], continent: "Africa", searchTerms: ["Johannesburg street", "South African city", "Joburg"], streetView: true },
  { country: "Namibia", city: "Windhoek", coordinates: [-22.5609, 17.0658], continent: "Africa", searchTerms: ["Windhoek street", "Namibian capital", "desert city"], streetView: true },
  { country: "Botswana", city: "Gaborone", coordinates: [-24.6282, 25.9231], continent: "Africa", searchTerms: ["Gaborone mall", "Botswana capital", "southern African city"], streetView: true },
  { country: "Zimbabwe", city: "Harare", coordinates: [-17.8252, 31.0335], continent: "Africa", searchTerms: ["Harare street", "Zimbabwean capital", "southern city"], streetView: false },
  { country: "Mozambique", city: "Maputo", coordinates: [-25.9692, 32.5732], continent: "Africa", searchTerms: ["Maputo street", "Mozambican capital", "Indian Ocean port"], streetView: false },
  { country: "Eswatini", city: "Mbabane", coordinates: [-26.3054, 31.1367], continent: "Africa", searchTerms: ["Mbabane street", "Eswatini capital", "Swazi highland city"], streetView: true },
  { country: "Lesotho", city: "Maseru", coordinates: [-29.3151, 27.4869], continent: "Africa", searchTerms: ["Maseru street", "Lesotho capital", "mountain kingdom"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // MIDDLE EAST
  // ══════════════════════════════════════════════════════════════════
  { country: "Oman", city: "Muscat", coordinates: [23.588, 58.3829], continent: "Middle East", searchTerms: ["Muscat highway", "Omani capital", "Gulf coast city"], streetView: true },
  { country: "Jordan", city: "Amman", coordinates: [31.9454, 35.9284], continent: "Middle East", searchTerms: ["Amman hills", "Jordanian capital", "Levant city"], streetView: true },
  { country: "Qatar", city: "Doha", coordinates: [25.2854, 51.531], continent: "Middle East", searchTerms: ["Doha corniche", "Qatari capital", "Gulf city"], streetView: true },
  { country: "United Arab Emirates", city: "Dubai", coordinates: [25.2048, 55.2708], continent: "Middle East", searchTerms: ["Dubai Marina", "UAE skyline", "Gulf megacity"], streetView: true },
  { country: "Saudi Arabia", city: "Riyadh", coordinates: [24.7136, 46.6753], continent: "Middle East", searchTerms: ["Riyadh tower", "Saudi capital", "desert metropolis"], streetView: false },
  { country: "Kuwait", city: "Kuwait City", coordinates: [29.3759, 47.9774], continent: "Middle East", searchTerms: ["Kuwait City towers", "Kuwaiti capital", "Gulf state"], streetView: false },
  { country: "Bahrain", city: "Manama", coordinates: [26.2285, 50.586], continent: "Middle East", searchTerms: ["Manama skyline", "Bahraini capital", "island city"], streetView: false },
  { country: "Iraq", city: "Baghdad", coordinates: [33.3152, 44.3661], continent: "Middle East", searchTerms: ["Baghdad street", "Iraqi capital", "Tigris city"], streetView: false },
  { country: "Iran", city: "Tehran", coordinates: [35.6892, 51.389], continent: "Middle East", searchTerms: ["Tehran street", "Iranian capital", "mountain backdrop"], streetView: false },
  { country: "Israel", city: "Tel Aviv", coordinates: [32.0853, 34.7818], continent: "Middle East", searchTerms: ["Tel Aviv Bauhaus", "Israeli city", "Mediterranean coast"], streetView: true },
  { country: "Lebanon", city: "Beirut", coordinates: [33.8938, 35.5018], continent: "Middle East", searchTerms: ["Beirut Hamra", "Lebanese capital", "Mediterranean city"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // CENTRAL ASIA
  // ══════════════════════════════════════════════════════════════════
  { country: "Kazakhstan", city: "Almaty", coordinates: [43.2551, 76.9126], continent: "South Asia", searchTerms: ["Almaty mountains", "Kazakh city", "Central Asian city"], streetView: true },
  { country: "Uzbekistan", city: "Tashkent", coordinates: [41.2995, 69.2401], continent: "South Asia", searchTerms: ["Tashkent metro", "Uzbek capital", "Silk Road city"], streetView: true },
  { country: "Kyrgyzstan", city: "Bishkek", coordinates: [42.8746, 74.5698], continent: "South Asia", searchTerms: ["Bishkek street", "Kyrgyz capital", "mountain capital"], streetView: true },
  { country: "Mongolia", city: "Ulaanbaatar", coordinates: [47.9077, 106.9057], continent: "East Asia", searchTerms: ["Ulaanbaatar street", "Mongolian capital", "steppe city"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // SOUTH ASIA
  // ══════════════════════════════════════════════════════════════════
  { country: "India", city: "Delhi", coordinates: [28.6139, 77.209], continent: "South Asia", searchTerms: ["Delhi street", "Indian capital", "crowded road"], streetView: true },
  { country: "Pakistan", city: "Lahore", coordinates: [31.5204, 74.3587], continent: "South Asia", searchTerms: ["Lahore old city", "Pakistani city", "Mughal architecture"], streetView: false },
  { country: "Bangladesh", city: "Dhaka", coordinates: [23.8103, 90.4125], continent: "South Asia", searchTerms: ["Dhaka rickshaw", "Bangladeshi capital", "river delta city"], streetView: true },
  { country: "Sri Lanka", city: "Colombo", coordinates: [6.9271, 79.8612], continent: "South Asia", searchTerms: ["Colombo street", "Sri Lankan capital", "tropical port"], streetView: true },
  { country: "Nepal", city: "Kathmandu", coordinates: [27.7172, 85.324], continent: "South Asia", searchTerms: ["Kathmandu valley", "Nepali capital", "mountain town"], streetView: true },
  { country: "Maldives", city: "Male", coordinates: [4.1755, 73.5093], continent: "South Asia", searchTerms: ["Male Maldives", "island capital", "tropical lagoon"], streetView: false },
  { country: "Bhutan", city: "Thimphu", coordinates: [27.4712, 89.6339], continent: "South Asia", searchTerms: ["Thimphu dzong", "Bhutanese capital", "Himalayan city"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // EAST ASIA
  // ══════════════════════════════════════════════════════════════════
  { country: "Japan", city: "Tokyo", coordinates: [35.6762, 139.6503], continent: "East Asia", searchTerms: ["Shibuya crossing", "Tokyo neon", "Japanese city"], streetView: true },
  { country: "South Korea", city: "Seoul", coordinates: [37.5665, 126.978], continent: "East Asia", searchTerms: ["Seoul Hongdae", "Korean city", "Hangul street"], streetView: true },
  { country: "China", city: "Shanghai", coordinates: [31.2304, 121.4737], continent: "East Asia", searchTerms: ["Shanghai Bund", "Chinese megacity", "Pudong skyline"], streetView: false },
  { country: "Taiwan", city: "Taipei", coordinates: [25.033, 121.5654], continent: "East Asia", searchTerms: ["Taipei night market", "Taiwanese city", "101 tower area"], streetView: true },
  { country: "Hong Kong", city: "Hong Kong", coordinates: [22.3193, 114.1694], continent: "East Asia", searchTerms: ["Hong Kong harbor", "neon signs", "dense high-rise"], streetView: true },
  { country: "Macau", city: "Macau", coordinates: [22.1987, 113.5439], continent: "East Asia", searchTerms: ["Macau casinos", "Portuguese colonial", "Chinese gambling city"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // SOUTHEAST ASIA
  // ══════════════════════════════════════════════════════════════════
  { country: "Thailand", city: "Bangkok", coordinates: [13.7563, 100.5018], continent: "Southeast Asia", searchTerms: ["Bangkok Sukhumvit", "Thai street", "tropical city"], streetView: true },
  { country: "Vietnam", city: "Ho Chi Minh City", coordinates: [10.8231, 106.6297], continent: "Southeast Asia", searchTerms: ["HCMC street", "Vietnamese city", "scooter lane"], streetView: true },
  { country: "Cambodia", city: "Phnom Penh", coordinates: [11.5564, 104.9282], continent: "Southeast Asia", searchTerms: ["Phnom Penh riverside", "Cambodian capital", "Mekong city"], streetView: true },
  { country: "Laos", city: "Vientiane", coordinates: [17.9757, 102.6331], continent: "Southeast Asia", searchTerms: ["Vientiane temple", "Laotian capital", "Mekong town"], streetView: true },
  { country: "Myanmar", city: "Yangon", coordinates: [16.8661, 96.1951], continent: "Southeast Asia", searchTerms: ["Yangon pagoda", "Myanmar street", "colonial downtown"], streetView: false },
  { country: "Malaysia", city: "Kuala Lumpur", coordinates: [3.139, 101.6869], continent: "Southeast Asia", searchTerms: ["KL street", "Petronas area", "Malaysian capital"], streetView: true },
  { country: "Singapore", city: "Singapore", coordinates: [1.3521, 103.8198], continent: "Southeast Asia", searchTerms: ["Marina Bay", "Singapore street", "garden city"], streetView: true },
  { country: "Indonesia", city: "Jakarta", coordinates: [-6.2088, 106.8456], continent: "Southeast Asia", searchTerms: ["Jakarta traffic", "Indonesian capital", "tropical megacity"], streetView: true },
  { country: "Philippines", city: "Manila", coordinates: [14.5995, 120.9842], continent: "Southeast Asia", searchTerms: ["Manila Intramuros", "Filipino city", "jeepney street"], streetView: true },
  { country: "Brunei", city: "Bandar Seri Begawan", coordinates: [4.9031, 114.9398], continent: "Southeast Asia", searchTerms: ["Bandar Seri Begawan mosque", "Brunei capital", "oil-rich sultanate"], streetView: true },
  { country: "East Timor", city: "Dili", coordinates: [-8.5569, 125.5603], continent: "Southeast Asia", searchTerms: ["Dili waterfront", "Timorese capital", "tropical port town"], streetView: true },

  // ══════════════════════════════════════════════════════════════════
  // OCEANIA
  // ══════════════════════════════════════════════════════════════════
  { country: "Australia", city: "Sydney", coordinates: [-33.8688, 151.2093], continent: "Oceania", searchTerms: ["Sydney CBD", "Australian city", "harbor bridge"], streetView: true },
  { country: "New Zealand", city: "Auckland", coordinates: [-36.8485, 174.7633], continent: "Oceania", searchTerms: ["Auckland harbor", "NZ city", "Oceanian port"], streetView: true },
  { country: "Fiji", city: "Suva", coordinates: [-18.1416, 178.4419], continent: "Oceania", searchTerms: ["Suva harbor", "Fijian capital", "Pacific island city"], streetView: false },
  { country: "Papua New Guinea", city: "Port Moresby", coordinates: [-9.4438, 147.1803], continent: "Oceania", searchTerms: ["Port Moresby", "PNG capital", "Melanesian city"], streetView: false },
  { country: "Samoa", city: "Apia", coordinates: [-13.8333, -171.75], continent: "Oceania", searchTerms: ["Apia harbor", "Samoan capital", "Pacific town"], streetView: false },
  { country: "Tonga", city: "Nukualofa", coordinates: [-21.2087, -175.1982], continent: "Oceania", searchTerms: ["Nukualofa street", "Tongan capital", "Pacific island"], streetView: false },
  { country: "New Caledonia", city: "Noumea", coordinates: [-22.2558, 166.4505], continent: "Oceania", searchTerms: ["Noumea bay", "French Pacific", "New Caledonia coast"], streetView: true },
  { country: "Vanuatu", city: "Port Vila", coordinates: [-17.7334, 168.3273], continent: "Oceania", searchTerms: ["Port Vila harbor", "Vanuatu capital", "Melanesian town"], streetView: true },
];

/** Fast lookup: country name → catalog entry */
export const CITY_BY_COUNTRY: Record<string, CityCatalogEntry> = Object.fromEntries(
  CITY_CATALOG.map((entry) => [entry.country, entry])
);

export const STREET_VIEW_CATALOG = CITY_CATALOG.filter((e) => e.streetView);

/**
 * Broad continent grouping used for continent-mode display labels.
 * Merges fine-grained ContinentLabel values into the 6 player-facing groups.
 */
export function getBroadContinent(label: ContinentLabel): string {
  switch (label) {
    case "North America":
    case "Central America":
    case "Caribbean":
      return "The Americas";
    case "South America":
      return "South America";
    case "Europe":
      return "Europe";
    case "Africa":
      return "Africa";
    case "Middle East":
    case "South Asia":
      return "Asia";
    case "East Asia":
    case "Southeast Asia":
      return "Asia";
    case "Oceania":
      return "Oceania";
  }
}

/**
 * Returns true if two countries belong to different broad continents.
 */
export function areDifferentContinents(countryA: string, countryB: string): boolean {
  const a = CITY_BY_COUNTRY[countryA];
  const b = CITY_BY_COUNTRY[countryB];
  if (!a || !b) return false;
  return getBroadContinent(a.continent) !== getBroadContinent(b.continent);
}

// ── Region assignment ─────────────────────────────────────────────

import type { RegionStage, DifficultyBand } from "../types/game";

const CONTINENT_TO_STAGE: Record<ContinentLabel, RegionStage> = {
  "North America": "americas",
  "Central America": "americas",
  "Caribbean": "americas",
  "South America": "americas",
  "Europe": "europe",
  "Africa": "africa_middle_east",
  "Middle East": "africa_middle_east",
  "South Asia": "asia_oceania",
  "East Asia": "asia_oceania",
  "Southeast Asia": "asia_oceania",
  "Oceania": "asia_oceania"
};

export function countryToStage(country: string): RegionStage {
  const entry = CITY_BY_COUNTRY[country];
  return entry ? CONTINENT_TO_STAGE[entry.continent] : "americas";
}

// ── Combinatorial pair generator ──────────────────────────────────

export interface GeneratedPair {
  id: string;
  options: [string, string];
  difficultyBand: DifficultyBand;
  regionStage: RegionStage;
  rationale: string;
  coachingLine: string;
  regionTag: string;
  visualTags: string[];
  teachingClues: string[];
  contextSearchTerms: string[];
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = (b[0] - a[0]) * Math.PI / 180;
  const dLng = (b[1] - a[1]) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(a[0] * Math.PI / 180) * Math.cos(b[0] * Math.PI / 180) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function inferDifficulty(a: CityCatalogEntry, b: CityCatalogEntry): DifficultyBand {
  const sameContinent = getBroadContinent(a.continent) === getBroadContinent(b.continent);
  const dist = haversineKm(a.coordinates, b.coordinates);

  if (sameContinent && dist < 1200) return "hard";
  if (sameContinent && dist < 4000) return "medium";
  if (!sameContinent && dist < 3000) return "hard";
  if (!sameContinent && dist < 7000) return "medium";
  return "easy";
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-");
}

function buildAllPairs(): GeneratedPair[] {
  const pairs: GeneratedPair[] = [];
  const entries = CITY_CATALOG;

  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i];
      const b = entries[j];
      if (!a.streetView || !b.streetView) continue;
      const stageA = CONTINENT_TO_STAGE[a.continent];
      const stageB = CONTINENT_TO_STAGE[b.continent];
      const stages = stageA === stageB ? [stageA] : [stageA, stageB];
      const difficulty = inferDifficulty(a, b);

      for (const stage of stages) {
        pairs.push({
          id: `${slugify(a.country)}-vs-${slugify(b.country)}-${stage}`,
          options: [a.country, b.country],
          difficultyBand: difficulty,
          regionStage: stage,
          rationale: `${a.city} (${a.country}) vs ${b.city} (${b.country}) — test your eye for the visual differences.`,
          coachingLine: `Look for signage, vegetation, and road style to tell ${a.country} from ${b.country}.`,
          regionTag: `${a.continent} vs ${b.continent}`,
          visualTags: [...a.searchTerms.slice(0, 2), ...b.searchTerms.slice(0, 2)],
          teachingClues: [`Compare the urban texture of ${a.city} and ${b.city}.`],
          contextSearchTerms: [...a.searchTerms, ...b.searchTerms]
        });
      }
    }
  }

  return pairs;
}

/** All combinatorial pairs. ~150 countries → tens of thousands of pairs. */
export const ALL_PAIRS: GeneratedPair[] = buildAllPairs();

export const PAIRS_BY_STAGE: Record<RegionStage, GeneratedPair[]> = {
  americas: ALL_PAIRS.filter((p) => p.regionStage === "americas"),
  europe: ALL_PAIRS.filter((p) => p.regionStage === "europe"),
  africa_middle_east: ALL_PAIRS.filter((p) => p.regionStage === "africa_middle_east"),
  asia_oceania: ALL_PAIRS.filter((p) => p.regionStage === "asia_oceania")
};
