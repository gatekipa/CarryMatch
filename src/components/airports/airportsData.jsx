// Comprehensive global airports database with focus on major cities and African airports
export const airports = [
  // North America
  { iata: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States" },
  { iata: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States" },
  { iata: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "United States" },
  { iata: "ATL", name: "Hartsfield-Jackson Atlanta International Airport", city: "Atlanta", country: "United States" },
  { iata: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States" },
  { iata: "MIA", name: "Miami International Airport", city: "Miami", country: "United States" },
  { iata: "SEA", name: "Seattle-Tacoma International Airport", city: "Seattle", country: "United States" },
  { iata: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States" },
  { iata: "IAD", name: "Washington Dulles International Airport", city: "Washington", country: "United States" },
  { iata: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington", country: "United States" },
  { iata: "BOS", name: "Logan International Airport", city: "Boston", country: "United States" },
  { iata: "EWR", name: "Newark Liberty International Airport", city: "Newark", country: "United States" },
  { iata: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States" },
  { iata: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", country: "United States" },
  { iata: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "United States" },
  { iata: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada" },
  { iata: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canada" },
  { iata: "YUL", name: "Montréal-Pierre Elliott Trudeau International Airport", city: "Montreal", country: "Canada" },
  
  // Europe
  { iata: "LHR", name: "Heathrow Airport", city: "London", country: "United Kingdom" },
  { iata: "LGW", name: "Gatwick Airport", city: "London", country: "United Kingdom" },
  { iata: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France" },
  { iata: "ORY", name: "Orly Airport", city: "Paris", country: "France" },
  { iata: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany" },
  { iata: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands" },
  { iata: "MAD", name: "Adolfo Suárez Madrid-Barajas Airport", city: "Madrid", country: "Spain" },
  { iata: "BCN", name: "Barcelona-El Prat Airport", city: "Barcelona", country: "Spain" },
  { iata: "FCO", name: "Leonardo da Vinci-Fiumicino Airport", city: "Rome", country: "Italy" },
  { iata: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy" },
  { iata: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland" },
  { iata: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria" },
  { iata: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium" },
  { iata: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark" },
  { iata: "OSL", name: "Oslo Airport", city: "Oslo", country: "Norway" },
  { iata: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden" },
  { iata: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey" },
  { iata: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece" },
  { iata: "LIS", name: "Lisbon Portela Airport", city: "Lisbon", country: "Portugal" },
  { iata: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland" },
  
  // Africa - West Africa
  { iata: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria" },
  { iata: "ABV", name: "Nnamdi Azikiwe International Airport", city: "Abuja", country: "Nigeria" },
  { iata: "PHC", name: "Port Harcourt International Airport", city: "Port Harcourt", country: "Nigeria" },
  { iata: "KAN", name: "Mallam Aminu Kano International Airport", city: "Kano", country: "Nigeria" },
  { iata: "ACC", name: "Kotoka International Airport", city: "Accra", country: "Ghana" },
  { iata: "ABJ", name: "Port Bouet Airport", city: "Abidjan", country: "Côte d'Ivoire" },
  { iata: "DKR", name: "Blaise Diagne International Airport", city: "Dakar", country: "Senegal" },
  { iata: "FNA", name: "Lungi International Airport", city: "Freetown", country: "Sierra Leone" },
  { iata: "COO", name: "Cadjehoun Airport", city: "Cotonou", country: "Benin" },
  { iata: "LFW", name: "Gnassingbé Eyadéma International Airport", city: "Lomé", country: "Togo" },
  { iata: "NIM", name: "Diori Hamani International Airport", city: "Niamey", country: "Niger" },
  { iata: "OUA", name: "Ouagadougou Airport", city: "Ouagadougou", country: "Burkina Faso" },
  { iata: "BKO", name: "Modibo Keita International Airport", city: "Bamako", country: "Mali" },
  { iata: "NKC", name: "Nouakchott-Oumtounsy International Airport", city: "Nouakchott", country: "Mauritania" },
  { iata: "BJL", name: "Banjul International Airport", city: "Banjul", country: "Gambia" },
  { iata: "CKY", name: "Conakry International Airport", city: "Conakry", country: "Guinea" },
  
  // Africa - Central Africa
  { iata: "DLA", name: "Douala International Airport", city: "Douala", country: "Cameroon" },
  { iata: "NSI", name: "Yaoundé Nsimalen International Airport", city: "Yaoundé", country: "Cameroon" },
  { iata: "BZV", name: "Maya-Maya Airport", city: "Brazzaville", country: "Republic of Congo" },
  { iata: "FIH", name: "N'djili Airport", city: "Kinshasa", country: "Democratic Republic of Congo" },
  { iata: "LBV", name: "Libreville International Airport", city: "Libreville", country: "Gabon" },
  { iata: "BGF", name: "Bangui M'Poko International Airport", city: "Bangui", country: "Central African Republic" },
  { iata: "FMO", name: "Four de Brazzaville Airport", city: "N'Djamena", country: "Chad" },
  { iata: "LBQ", name: "Lambaréné Airport", city: "Lambaréné", country: "Gabon" },
  
  // Africa - East Africa
  { iata: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya" },
  { iata: "MBA", name: "Moi International Airport", city: "Mombasa", country: "Kenya" },
  { iata: "JRO", name: "Kilimanjaro International Airport", city: "Arusha", country: "Tanzania" },
  { iata: "DAR", name: "Julius Nyerere International Airport", city: "Dar es Salaam", country: "Tanzania" },
  { iata: "ZNZ", name: "Abeid Amani Karume International Airport", city: "Zanzibar", country: "Tanzania" },
  { iata: "EBB", name: "Entebbe International Airport", city: "Entebbe", country: "Uganda" },
  { iata: "KGL", name: "Kigali International Airport", city: "Kigali", country: "Rwanda" },
  { iata: "BJM", name: "Bujumbura International Airport", city: "Bujumbura", country: "Burundi" },
  { iata: "ADD", name: "Addis Ababa Bole International Airport", city: "Addis Ababa", country: "Ethiopia" },
  { iata: "JIB", name: "Djibouti-Ambouli International Airport", city: "Djibouti", country: "Djibouti" },
  { iata: "ASM", name: "Asmara International Airport", city: "Asmara", country: "Eritrea" },
  { iata: "MGQ", name: "Mogadishu Aden Adde International Airport", city: "Mogadishu", country: "Somalia" },
  
  // Africa - Southern Africa
  { iata: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", country: "South Africa" },
  { iata: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "South Africa" },
  { iata: "DUR", name: "King Shaka International Airport", city: "Durban", country: "South Africa" },
  { iata: "HRE", name: "Robert Gabriel Mugabe International Airport", city: "Harare", country: "Zimbabwe" },
  { iata: "LUN", name: "Kenneth Kaunda International Airport", city: "Lusaka", country: "Zambia" },
  { iata: "LVI", name: "Livingstone Airport", city: "Livingstone", country: "Zambia" },
  { iata: "WDH", name: "Hosea Kutako International Airport", city: "Windhoek", country: "Namibia" },
  { iata: "GBE", name: "Sir Seretse Khama International Airport", city: "Gaborone", country: "Botswana" },
  { iata: "MRU", name: "Sir Seewoosagur Ramgoolam International Airport", city: "Port Louis", country: "Mauritius" },
  { iata: "RUN", name: "Roland Garros Airport", city: "Saint-Denis", country: "Réunion" },
  { iata: "TNR", name: "Ivato International Airport", city: "Antananarivo", country: "Madagascar" },
  { iata: "SEZ", name: "Seychelles International Airport", city: "Victoria", country: "Seychelles" },
  { iata: "MPM", name: "Maputo International Airport", city: "Maputo", country: "Mozambique" },
  { iata: "BLZ", name: "Chileka International Airport", city: "Blantyre", country: "Malawi" },
  { iata: "MTS", name: "Matsapha International Airport", city: "Manzini", country: "Eswatini" },
  { iata: "MSU", name: "Moshoeshoe I International Airport", city: "Maseru", country: "Lesotho" },
  
  // Africa - North Africa
  { iata: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt" },
  { iata: "SSH", name: "Sharm El Sheikh International Airport", city: "Sharm El Sheikh", country: "Egypt" },
  { iata: "HRG", name: "Hurghada International Airport", city: "Hurghada", country: "Egypt" },
  { iata: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria" },
  { iata: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco" },
  { iata: "RAK", name: "Marrakesh Menara Airport", city: "Marrakesh", country: "Morocco" },
  { iata: "TUN", name: "Tunis-Carthage International Airport", city: "Tunis", country: "Tunisia" },
  { iata: "TIP", name: "Tripoli International Airport", city: "Tripoli", country: "Libya" },
  { iata: "BEN", name: "Benina International Airport", city: "Benghazi", country: "Libya" },
  { iata: "KRT", name: "Khartoum International Airport", city: "Khartoum", country: "Sudan" },
  
  // Middle East
  { iata: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates" },
  { iata: "AUH", name: "Abu Dhabi International Airport", city: "Abu Dhabi", country: "United Arab Emirates" },
  { iata: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar" },
  { iata: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia" },
  { iata: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia" },
  { iata: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel" },
  { iata: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordan" },
  { iata: "BEY", name: "Beirut-Rafic Hariri International Airport", city: "Beirut", country: "Lebanon" },
  { iata: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait" },
  { iata: "BAH", name: "Bahrain International Airport", city: "Manama", country: "Bahrain" },
  { iata: "MCT", name: "Muscat International Airport", city: "Muscat", country: "Oman" },
  
  // Asia
  { iata: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong" },
  { iata: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China" },
  { iata: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China" },
  { iata: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China" },
  { iata: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan" },
  { iata: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan" },
  { iata: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan" },
  { iata: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea" },
  { iata: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore" },
  { iata: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand" },
  { iata: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia" },
  { iata: "CGK", name: "Soekarno-Hatta International Airport", city: "Jakarta", country: "Indonesia" },
  { iata: "DPS", name: "Ngurah Rai International Airport", city: "Bali", country: "Indonesia" },
  { iata: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines" },
  { iata: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam" },
  { iata: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam" },
  { iata: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India" },
  { iata: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India" },
  { iata: "BLR", name: "Kempegowda International Airport", city: "Bangalore", country: "India" },
  { iata: "ISB", name: "Islamabad International Airport", city: "Islamabad", country: "Pakistan" },
  { iata: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "Pakistan" },
  { iata: "LHE", name: "Allama Iqbal International Airport", city: "Lahore", country: "Pakistan" },
  { iata: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh" },
  { iata: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka" },
  
  // Oceania
  { iata: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia" },
  { iata: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia" },
  { iata: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia" },
  { iata: "PER", name: "Perth Airport", city: "Perth", country: "Australia" },
  { iata: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand" },
  { iata: "CHC", name: "Christchurch International Airport", city: "Christchurch", country: "New Zealand" },
  
  // South America
  { iata: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo", country: "Brazil" },
  { iata: "GIG", name: "Rio de Janeiro/Galeão International Airport", city: "Rio de Janeiro", country: "Brazil" },
  { iata: "BSB", name: "Brasília International Airport", city: "Brasília", country: "Brazil" },
  { iata: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina" },
  { iata: "BOG", name: "El Dorado International Airport", city: "Bogotá", country: "Colombia" },
  { iata: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "Peru" },
  { iata: "SCL", name: "Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile" },
  { iata: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "Ecuador" },
  { iata: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela" },
  { iata: "PTY", name: "Tocumen International Airport", city: "Panama City", country: "Panama" },
  { iata: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico" },
  { iata: "CUN", name: "Cancún International Airport", city: "Cancún", country: "Mexico" },
  
  // Caribbean
  { iata: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", country: "Bahamas" },
  { iata: "MBJ", name: "Sangster International Airport", city: "Montego Bay", country: "Jamaica" },
  { iata: "KIN", name: "Norman Manley International Airport", city: "Kingston", country: "Jamaica" },
  { iata: "SJU", name: "Luis Muñoz Marín International Airport", city: "San Juan", country: "Puerto Rico" },
  { iata: "POS", name: "Piarco International Airport", city: "Port of Spain", country: "Trinidad and Tobago" },
  { iata: "BGI", name: "Grantley Adams International Airport", city: "Bridgetown", country: "Barbados" },
];

// Search function
export const searchAirports = (query) => {
  if (!query || query.length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  
  return airports
    .filter(airport => {
      const iataMatch = airport.iata.toLowerCase().startsWith(searchTerm);
      const cityMatch = airport.city.toLowerCase().includes(searchTerm);
      const countryMatch = airport.country.toLowerCase().includes(searchTerm);
      const nameMatch = airport.name.toLowerCase().includes(searchTerm);
      
      return iataMatch || cityMatch || countryMatch || nameMatch;
    })
    .sort((a, b) => {
      const aIataMatch = a.iata.toLowerCase() === searchTerm;
      const bIataMatch = b.iata.toLowerCase() === searchTerm;
      if (aIataMatch && !bIataMatch) return -1;
      if (!aIataMatch && bIataMatch) return 1;
      
      const aIataStart = a.iata.toLowerCase().startsWith(searchTerm);
      const bIataStart = b.iata.toLowerCase().startsWith(searchTerm);
      if (aIataStart && !bIataStart) return -1;
      if (!aIataStart && bIataStart) return 1;
      
      const aCityMatch = a.city.toLowerCase().includes(searchTerm);
      const bCityMatch = b.city.toLowerCase().includes(searchTerm);
      if (aCityMatch && !bCityMatch) return -1;
      if (!aCityMatch && bCityMatch) return 1;
      
      return 0;
    })
    .slice(0, 10);
};

// Get airport by IATA code
export const getAirportByIATA = (iata) => {
  if (!iata) return null;
  return airports.find(airport => airport.iata.toUpperCase() === iata.toUpperCase());
};

// Get airports by city
export const getAirportsByCity = (city) => {
  if (!city) return [];
  return airports.filter(airport => 
    airport.city.toLowerCase().includes(city.toLowerCase())
  );
};

// Get airports by country
export const getAirportsByCountry = (country) => {
  if (!country) return [];
  return airports.filter(airport => 
    airport.country.toLowerCase().includes(country.toLowerCase())
  );
};

// Alias for compatibility
export const getCountryAirports = getAirportsByCountry;

// Get airports in the same metro area/city
export const getMetroClusterAirports = (iata) => {
  const airport = getAirportByIATA(iata);
  if (!airport) return [];
  
  return airports.filter(a => 
    a.city === airport.city && a.iata !== airport.iata
  );
};

// Get airports in the same region/country
export const getRegionAirports = (iata, limit = 5) => {
  const airport = getAirportByIATA(iata);
  if (!airport) return [];
  
  return airports
    .filter(a => 
      a.country === airport.country && a.iata !== airport.iata
    )
    .slice(0, limit);
};

// Calculate distance between two airports (simplified - same country or not)
export const calculateDistance = (iata1, iata2) => {
  const airport1 = getAirportByIATA(iata1);
  const airport2 = getAirportByIATA(iata2);
  
  if (!airport1 || !airport2) return null;
  
  // Simplified: return 0 if same city, 100 if same country, 1000 otherwise
  if (airport1.city === airport2.city) return 0;
  if (airport1.country === airport2.country) return 100;
  return 1000;
};

// Get airports within approximate radius
export const getAirportsWithinRadius = (iata, radiusKm = 500) => {
  const airport = getAirportByIATA(iata);
  if (!airport) return [];
  
  // Simplified: return airports in same country for now
  return airports
    .filter(a => 
      a.country === airport.country && a.iata !== airport.iata
    )
    .slice(0, 10);
};

export default {
  airports,
  searchAirports,
  getAirportByIATA,
  getAirportsByCity,
  getAirportsByCountry,
  getCountryAirports,
  getMetroClusterAirports,
  getRegionAirports,
  getAirportsWithinRadius,
  calculateDistance
};