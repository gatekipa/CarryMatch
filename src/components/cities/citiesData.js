// Comprehensive global cities database with focus on Cameroon and Africa
export const cities = [
  // ── Cameroon (all 10 regional capitals + major towns) ──────────────
  { name: "Douala", country: "Cameroon", region: "Littoral" },
  { name: "Yaoundé", country: "Cameroon", region: "Centre" },
  { name: "Bamenda", country: "Cameroon", region: "Northwest" },
  { name: "Bafoussam", country: "Cameroon", region: "West" },
  { name: "Garoua", country: "Cameroon", region: "North" },
  { name: "Maroua", country: "Cameroon", region: "Far North" },
  { name: "Ngaoundéré", country: "Cameroon", region: "Adamawa" },
  { name: "Bertoua", country: "Cameroon", region: "East" },
  { name: "Ebolowa", country: "Cameroon", region: "South" },
  { name: "Buea", country: "Cameroon", region: "Southwest" },
  { name: "Kribi", country: "Cameroon", region: "South" },
  { name: "Limbe", country: "Cameroon", region: "Southwest" },
  { name: "Kumba", country: "Cameroon", region: "Southwest" },
  { name: "Nkongsamba", country: "Cameroon", region: "Littoral" },
  { name: "Dschang", country: "Cameroon", region: "West" },
  { name: "Foumban", country: "Cameroon", region: "West" },
  { name: "Edéa", country: "Cameroon", region: "Littoral" },
  { name: "Mbalmayo", country: "Cameroon", region: "Centre" },
  { name: "Sangmélima", country: "Cameroon", region: "South" },
  { name: "Tiko", country: "Cameroon", region: "Southwest" },
  { name: "Loum", country: "Cameroon", region: "Littoral" },
  { name: "Kumbo", country: "Cameroon", region: "Northwest" },
  { name: "Mamfe", country: "Cameroon", region: "Southwest" },
  { name: "Wum", country: "Cameroon", region: "Northwest" },
  { name: "Mbouda", country: "Cameroon", region: "West" },
  { name: "Meiganga", country: "Cameroon", region: "Adamawa" },
  { name: "Mokolo", country: "Cameroon", region: "Far North" },
  { name: "Kousseri", country: "Cameroon", region: "Far North" },
  { name: "Batouri", country: "Cameroon", region: "East" },
  { name: "Tibati", country: "Cameroon", region: "Adamawa" },
  { name: "Banyo", country: "Cameroon", region: "Adamawa" },
  { name: "Yokadouma", country: "Cameroon", region: "East" },
  { name: "Obala", country: "Cameroon", region: "Centre" },
  { name: "Mora", country: "Cameroon", region: "Far North" },
  { name: "Fundong", country: "Cameroon", region: "Northwest" },
  { name: "Akonolinga", country: "Cameroon", region: "Centre" },

  // ── Nigeria ────────────────────────────────────────────────────────
  { name: "Lagos", country: "Nigeria", region: "Lagos" },
  { name: "Abuja", country: "Nigeria", region: "FCT" },
  { name: "Kano", country: "Nigeria", region: "Kano" },
  { name: "Ibadan", country: "Nigeria", region: "Oyo" },
  { name: "Port Harcourt", country: "Nigeria", region: "Rivers" },
  { name: "Benin City", country: "Nigeria", region: "Edo" },
  { name: "Kaduna", country: "Nigeria", region: "Kaduna" },
  { name: "Enugu", country: "Nigeria", region: "Enugu" },
  { name: "Calabar", country: "Nigeria", region: "Cross River" },
  { name: "Warri", country: "Nigeria", region: "Delta" },
  { name: "Owerri", country: "Nigeria", region: "Imo" },
  { name: "Uyo", country: "Nigeria", region: "Akwa Ibom" },
  { name: "Jos", country: "Nigeria", region: "Plateau" },

  // ── Ghana ──────────────────────────────────────────────────────────
  { name: "Accra", country: "Ghana", region: "Greater Accra" },
  { name: "Kumasi", country: "Ghana", region: "Ashanti" },
  { name: "Tamale", country: "Ghana", region: "Northern" },
  { name: "Takoradi", country: "Ghana", region: "Western" },
  { name: "Cape Coast", country: "Ghana", region: "Central" },
  { name: "Ho", country: "Ghana", region: "Volta" },
  { name: "Sunyani", country: "Ghana", region: "Bono" },

  // ── Senegal ────────────────────────────────────────────────────────
  { name: "Dakar", country: "Senegal", region: "Dakar" },
  { name: "Saint-Louis", country: "Senegal", region: "Saint-Louis" },
  { name: "Thiès", country: "Senegal", region: "Thiès" },
  { name: "Ziguinchor", country: "Senegal", region: "Ziguinchor" },

  // ── Ivory Coast (Côte d'Ivoire) ───────────────────────────────────
  { name: "Abidjan", country: "Ivory Coast", region: "Lagunes" },
  { name: "Yamoussoukro", country: "Ivory Coast", region: "Lacs" },
  { name: "Bouaké", country: "Ivory Coast", region: "Vallée du Bandama" },
  { name: "San-Pédro", country: "Ivory Coast", region: "Bas-Sassandra" },

  // ── DR Congo ───────────────────────────────────────────────────────
  { name: "Kinshasa", country: "DR Congo", region: "Kinshasa" },
  { name: "Lubumbashi", country: "DR Congo", region: "Haut-Katanga" },
  { name: "Mbuji-Mayi", country: "DR Congo", region: "Kasaï-Oriental" },
  { name: "Kisangani", country: "DR Congo", region: "Tshopo" },
  { name: "Goma", country: "DR Congo", region: "North Kivu" },
  { name: "Bukavu", country: "DR Congo", region: "South Kivu" },

  // ── Republic of Congo ──────────────────────────────────────────────
  { name: "Brazzaville", country: "Republic of Congo", region: "Brazzaville" },
  { name: "Pointe-Noire", country: "Republic of Congo", region: "Pointe-Noire" },

  // ── Gabon ──────────────────────────────────────────────────────────
  { name: "Libreville", country: "Gabon", region: "Estuaire" },
  { name: "Port-Gentil", country: "Gabon", region: "Ogooué-Maritime" },
  { name: "Franceville", country: "Gabon", region: "Haut-Ogooué" },

  // ── Chad ────────────────────────────────────────────────────────────
  { name: "N'Djamena", country: "Chad", region: "N'Djamena" },
  { name: "Moundou", country: "Chad", region: "Logone Occidental" },

  // ── Central African Republic ───────────────────────────────────────
  { name: "Bangui", country: "CAR", region: "Bangui" },

  // ── Equatorial Guinea ──────────────────────────────────────────────
  { name: "Malabo", country: "Equatorial Guinea", region: "Bioko Norte" },
  { name: "Bata", country: "Equatorial Guinea", region: "Litoral" },

  // ── Kenya ──────────────────────────────────────────────────────────
  { name: "Nairobi", country: "Kenya", region: "Nairobi" },
  { name: "Mombasa", country: "Kenya", region: "Coast" },
  { name: "Kisumu", country: "Kenya", region: "Nyanza" },
  { name: "Nakuru", country: "Kenya", region: "Rift Valley" },
  { name: "Eldoret", country: "Kenya", region: "Rift Valley" },

  // ── South Africa ───────────────────────────────────────────────────
  { name: "Johannesburg", country: "South Africa", region: "Gauteng" },
  { name: "Cape Town", country: "South Africa", region: "Western Cape" },
  { name: "Durban", country: "South Africa", region: "KwaZulu-Natal" },
  { name: "Pretoria", country: "South Africa", region: "Gauteng" },
  { name: "Port Elizabeth", country: "South Africa", region: "Eastern Cape" },

  // ── Tanzania ───────────────────────────────────────────────────────
  { name: "Dar es Salaam", country: "Tanzania", region: "Dar es Salaam" },
  { name: "Dodoma", country: "Tanzania", region: "Dodoma" },
  { name: "Arusha", country: "Tanzania", region: "Arusha" },
  { name: "Zanzibar City", country: "Tanzania", region: "Zanzibar" },

  // ── Uganda ─────────────────────────────────────────────────────────
  { name: "Kampala", country: "Uganda", region: "Central" },
  { name: "Entebbe", country: "Uganda", region: "Central" },
  { name: "Jinja", country: "Uganda", region: "Eastern" },

  // ── Rwanda ─────────────────────────────────────────────────────────
  { name: "Kigali", country: "Rwanda", region: "Kigali" },
  { name: "Butare", country: "Rwanda", region: "Southern" },

  // ── Ethiopia ───────────────────────────────────────────────────────
  { name: "Addis Ababa", country: "Ethiopia", region: "Addis Ababa" },
  { name: "Dire Dawa", country: "Ethiopia", region: "Dire Dawa" },

  // ── Morocco ────────────────────────────────────────────────────────
  { name: "Casablanca", country: "Morocco", region: "Casablanca-Settat" },
  { name: "Rabat", country: "Morocco", region: "Rabat-Salé-Kénitra" },
  { name: "Marrakesh", country: "Morocco", region: "Marrakesh-Safi" },
  { name: "Fez", country: "Morocco", region: "Fès-Meknès" },
  { name: "Tangier", country: "Morocco", region: "Tanger-Tétouan" },

  // ── Egypt ──────────────────────────────────────────────────────────
  { name: "Cairo", country: "Egypt", region: "Cairo" },
  { name: "Alexandria", country: "Egypt", region: "Alexandria" },
  { name: "Giza", country: "Egypt", region: "Giza" },
  { name: "Sharm El Sheikh", country: "Egypt", region: "South Sinai" },

  // ── United States ──────────────────────────────────────────────────
  { name: "New York", country: "United States", region: "New York" },
  { name: "Los Angeles", country: "United States", region: "California" },
  { name: "Chicago", country: "United States", region: "Illinois" },
  { name: "Houston", country: "United States", region: "Texas" },
  { name: "Phoenix", country: "United States", region: "Arizona" },
  { name: "Philadelphia", country: "United States", region: "Pennsylvania" },
  { name: "San Antonio", country: "United States", region: "Texas" },
  { name: "San Diego", country: "United States", region: "California" },
  { name: "Dallas", country: "United States", region: "Texas" },
  { name: "San Francisco", country: "United States", region: "California" },
  { name: "Seattle", country: "United States", region: "Washington" },
  { name: "Miami", country: "United States", region: "Florida" },
  { name: "Atlanta", country: "United States", region: "Georgia" },
  { name: "Boston", country: "United States", region: "Massachusetts" },
  { name: "Washington D.C.", country: "United States", region: "DC" },
  { name: "Denver", country: "United States", region: "Colorado" },
  { name: "Minneapolis", country: "United States", region: "Minnesota" },
  { name: "Detroit", country: "United States", region: "Michigan" },
  { name: "Charlotte", country: "United States", region: "North Carolina" },
  { name: "Austin", country: "United States", region: "Texas" },

  // ── Canada ─────────────────────────────────────────────────────────
  { name: "Toronto", country: "Canada", region: "Ontario" },
  { name: "Montreal", country: "Canada", region: "Quebec" },
  { name: "Vancouver", country: "Canada", region: "British Columbia" },
  { name: "Calgary", country: "Canada", region: "Alberta" },
  { name: "Ottawa", country: "Canada", region: "Ontario" },
  { name: "Edmonton", country: "Canada", region: "Alberta" },

  // ── France ─────────────────────────────────────────────────────────
  { name: "Paris", country: "France", region: "Île-de-France" },
  { name: "Marseille", country: "France", region: "Provence-Alpes-Côte d'Azur" },
  { name: "Lyon", country: "France", region: "Auvergne-Rhône-Alpes" },
  { name: "Toulouse", country: "France", region: "Occitanie" },
  { name: "Nice", country: "France", region: "Provence-Alpes-Côte d'Azur" },
  { name: "Bordeaux", country: "France", region: "Nouvelle-Aquitaine" },
  { name: "Lille", country: "France", region: "Hauts-de-France" },
  { name: "Strasbourg", country: "France", region: "Grand Est" },

  // ── United Kingdom ─────────────────────────────────────────────────
  { name: "London", country: "United Kingdom", region: "England" },
  { name: "Manchester", country: "United Kingdom", region: "England" },
  { name: "Birmingham", country: "United Kingdom", region: "England" },
  { name: "Edinburgh", country: "United Kingdom", region: "Scotland" },
  { name: "Glasgow", country: "United Kingdom", region: "Scotland" },
  { name: "Liverpool", country: "United Kingdom", region: "England" },
  { name: "Leeds", country: "United Kingdom", region: "England" },

  // ── Germany ────────────────────────────────────────────────────────
  { name: "Berlin", country: "Germany", region: "Berlin" },
  { name: "Munich", country: "Germany", region: "Bavaria" },
  { name: "Frankfurt", country: "Germany", region: "Hesse" },
  { name: "Hamburg", country: "Germany", region: "Hamburg" },
  { name: "Cologne", country: "Germany", region: "North Rhine-Westphalia" },
  { name: "Stuttgart", country: "Germany", region: "Baden-Württemberg" },
  { name: "Düsseldorf", country: "Germany", region: "North Rhine-Westphalia" },

  // ── Italy ──────────────────────────────────────────────────────────
  { name: "Rome", country: "Italy", region: "Lazio" },
  { name: "Milan", country: "Italy", region: "Lombardy" },
  { name: "Naples", country: "Italy", region: "Campania" },
  { name: "Turin", country: "Italy", region: "Piedmont" },
  { name: "Florence", country: "Italy", region: "Tuscany" },

  // ── Spain ──────────────────────────────────────────────────────────
  { name: "Madrid", country: "Spain", region: "Community of Madrid" },
  { name: "Barcelona", country: "Spain", region: "Catalonia" },
  { name: "Seville", country: "Spain", region: "Andalusia" },
  { name: "Valencia", country: "Spain", region: "Valencian Community" },
  { name: "Bilbao", country: "Spain", region: "Basque Country" },

  // ── Belgium ────────────────────────────────────────────────────────
  { name: "Brussels", country: "Belgium", region: "Brussels-Capital" },
  { name: "Antwerp", country: "Belgium", region: "Flanders" },
  { name: "Ghent", country: "Belgium", region: "Flanders" },

  // ── Switzerland ────────────────────────────────────────────────────
  { name: "Zurich", country: "Switzerland", region: "Zürich" },
  { name: "Geneva", country: "Switzerland", region: "Geneva" },
  { name: "Bern", country: "Switzerland", region: "Bern" },
  { name: "Basel", country: "Switzerland", region: "Basel-Stadt" },

  // ── Netherlands ────────────────────────────────────────────────────
  { name: "Amsterdam", country: "Netherlands", region: "North Holland" },
  { name: "Rotterdam", country: "Netherlands", region: "South Holland" },
  { name: "The Hague", country: "Netherlands", region: "South Holland" },

  // ── Turkey ─────────────────────────────────────────────────────────
  { name: "Istanbul", country: "Turkey", region: "Istanbul" },
  { name: "Ankara", country: "Turkey", region: "Ankara" },
  { name: "Izmir", country: "Turkey", region: "Izmir" },
  { name: "Antalya", country: "Turkey", region: "Antalya" },

  // ── China ──────────────────────────────────────────────────────────
  { name: "Beijing", country: "China", region: "Beijing" },
  { name: "Shanghai", country: "China", region: "Shanghai" },
  { name: "Guangzhou", country: "China", region: "Guangdong" },
  { name: "Shenzhen", country: "China", region: "Guangdong" },
  { name: "Hong Kong", country: "China", region: "Hong Kong" },
  { name: "Chengdu", country: "China", region: "Sichuan" },

  // ── India ──────────────────────────────────────────────────────────
  { name: "Mumbai", country: "India", region: "Maharashtra" },
  { name: "New Delhi", country: "India", region: "Delhi" },
  { name: "Bangalore", country: "India", region: "Karnataka" },
  { name: "Hyderabad", country: "India", region: "Telangana" },
  { name: "Chennai", country: "India", region: "Tamil Nadu" },
  { name: "Kolkata", country: "India", region: "West Bengal" },

  // ── Japan ──────────────────────────────────────────────────────────
  { name: "Tokyo", country: "Japan", region: "Tokyo" },
  { name: "Osaka", country: "Japan", region: "Osaka" },
  { name: "Kyoto", country: "Japan", region: "Kyoto" },
  { name: "Yokohama", country: "Japan", region: "Kanagawa" },

  // ── South Korea ────────────────────────────────────────────────────
  { name: "Seoul", country: "South Korea", region: "Seoul" },
  { name: "Busan", country: "South Korea", region: "Busan" },
  { name: "Incheon", country: "South Korea", region: "Incheon" },

  // ── UAE ────────────────────────────────────────────────────────────
  { name: "Dubai", country: "UAE", region: "Dubai" },
  { name: "Abu Dhabi", country: "UAE", region: "Abu Dhabi" },
  { name: "Sharjah", country: "UAE", region: "Sharjah" },

  // ── Saudi Arabia ───────────────────────────────────────────────────
  { name: "Riyadh", country: "Saudi Arabia", region: "Riyadh" },
  { name: "Jeddah", country: "Saudi Arabia", region: "Makkah" },
  { name: "Mecca", country: "Saudi Arabia", region: "Makkah" },
  { name: "Medina", country: "Saudi Arabia", region: "Medina" },
  { name: "Dammam", country: "Saudi Arabia", region: "Eastern" },

  // ── Brazil ─────────────────────────────────────────────────────────
  { name: "São Paulo", country: "Brazil", region: "São Paulo" },
  { name: "Rio de Janeiro", country: "Brazil", region: "Rio de Janeiro" },
  { name: "Brasília", country: "Brazil", region: "Federal District" },
  { name: "Salvador", country: "Brazil", region: "Bahia" },
  { name: "Fortaleza", country: "Brazil", region: "Ceará" },

  // ── Mexico ─────────────────────────────────────────────────────────
  { name: "Mexico City", country: "Mexico", region: "CDMX" },
  { name: "Guadalajara", country: "Mexico", region: "Jalisco" },
  { name: "Monterrey", country: "Mexico", region: "Nuevo León" },
  { name: "Cancún", country: "Mexico", region: "Quintana Roo" },
  { name: "Tijuana", country: "Mexico", region: "Baja California" },

  // ── Australia ──────────────────────────────────────────────────────
  { name: "Sydney", country: "Australia", region: "New South Wales" },
  { name: "Melbourne", country: "Australia", region: "Victoria" },
  { name: "Brisbane", country: "Australia", region: "Queensland" },
  { name: "Perth", country: "Australia", region: "Western Australia" },
  { name: "Adelaide", country: "Australia", region: "South Australia" },
];

// Country name aliases — maps shortened/alternate names to the name used in cities[]
const COUNTRY_ALIASES = {
  "United States of America": "United States",
  "USA": "United States",
  "US": "United States",
  "UK": "United Kingdom",
  "Britain": "United Kingdom",
  "Great Britain": "United Kingdom",
  "Côte d'Ivoire": "Ivory Coast",
  "Cote d'Ivoire": "Ivory Coast",
  "Democratic Republic of Congo": "DR Congo",
  "Democratic Republic of the Congo": "DR Congo",
  "DRC": "DR Congo",
  "Central African Republic": "CAR",
  "United Arab Emirates": "UAE",
  "Emirates": "UAE",
  "Republic of the Congo": "Republic of Congo",
  "Congo-Brazzaville": "Republic of Congo",
  "Congo-Kinshasa": "DR Congo",
  "Cameroun": "Cameroon",
  "Allemagne": "Germany",
  "Japon": "Japan",
  "Chine": "China",
  "Inde": "India",
  "Brésil": "Brazil",
  "Mexique": "Mexico",
  "Espagne": "Spain",
  "Italie": "Italy",
  "Belgique": "Belgium",
  "Suisse": "Switzerland",
  "Pays-Bas": "Netherlands",
  "Turquie": "Turkey",
  "Arabie Saoudite": "Saudi Arabia",
  "Corée du Sud": "South Korea",
  "Afrique du Sud": "South Africa",
  "Australie": "Australia",
  "Éthiopie": "Ethiopia",
  "Tanzanie": "Tanzania",
  "Ouganda": "Uganda",
  "Guinée Équatoriale": "Equatorial Guinea",
  "Tchad": "Chad",
  "République Centrafricaine": "CAR",
  "République du Congo": "Republic of Congo",
};

// Normalize a string by removing accents and converting to lowercase
const normalize = (str) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

// Resolve a country name to its canonical form used in cities[]
const resolveCountry = (name) => {
  if (!name) return null;
  const trimmed = name.trim();
  // Direct match
  if (cities.some(c => c.country === trimmed)) return trimmed;
  // Alias match
  if (COUNTRY_ALIASES[trimmed]) return COUNTRY_ALIASES[trimmed];
  // Case-insensitive match
  const lower = trimmed.toLowerCase();
  const found = cities.find(c => c.country.toLowerCase() === lower);
  if (found) return found.country;
  // Alias case-insensitive
  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
    if (alias.toLowerCase() === lower) return canonical;
  }
  // Diacritic/punctuation-insensitive fallback
  const norm = normalize(trimmed);
  const foundNorm = cities.find(c => normalize(c.country) === norm);
  if (foundNorm) return foundNorm.country;
  for (const [alias, canonical] of Object.entries(COUNTRY_ALIASES)) {
    if (normalize(alias) === norm) return canonical;
  }
  return null;
};

// Search cities by query, optionally filtered to a specific country
export const searchCities = (query, filterCountry = null) => {
  if (!query || query.length < 1) return [];

  const searchTerm = normalize(query);
  const minChars = filterCountry ? 1 : 2;
  if (searchTerm.length < minChars) return [];

  const resolvedCountry = filterCountry ? resolveCountry(filterCountry) : null;

  // If a country filter was requested but couldn't be resolved, return no results
  if (filterCountry && !resolvedCountry) return [];

  // Precompute normalized fields once per city
  const normalized = cities.map(city => ({
    city,
    normName: normalize(city.name),
    normCountry: normalize(city.country),
    normRegion: normalize(city.region || ""),
  }));

  return normalized
    .filter(({ city, normName, normCountry, normRegion }) => {
      // Country filter
      if (resolvedCountry && city.country !== resolvedCountry) return false;

      return (
        normName.includes(searchTerm) ||
        normCountry.includes(searchTerm) ||
        normRegion.includes(searchTerm)
      );
    })
    .sort((a, b) => {
      // Exact match first
      const aExact = a.normName === searchTerm;
      const bExact = b.normName === searchTerm;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Starts-with next
      const aStarts = a.normName.startsWith(searchTerm);
      const bStarts = b.normName.startsWith(searchTerm);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // City name match over country/region match
      const aCityMatch = a.normName.includes(searchTerm);
      const bCityMatch = b.normName.includes(searchTerm);
      if (aCityMatch && !bCityMatch) return -1;
      if (!aCityMatch && bCityMatch) return 1;

      // Alphabetical fallback
      return a.city.name.localeCompare(b.city.name);
    })
    .slice(0, 10)
    .map(({ city }) => city);
};

// Get all cities for a given country
export const getCitiesByCountry = (country) => {
  if (!country) return [];
  const resolved = resolveCountry(country);
  if (!resolved) return [];
  return cities
    .filter(c => c.country === resolved)
    .sort((a, b) => a.name.localeCompare(b.name));
};

// Exported Cameroon city names (replaces hardcoded CAMEROON_CITIES arrays)
export const CAMEROON_CITIES = cities
  .filter(c => c.country === "Cameroon")
  .map(c => c.name)
  .sort((a, b) => a.localeCompare(b));

export default {
  cities,
  searchCities,
  getCitiesByCountry,
  CAMEROON_CITIES,
};
