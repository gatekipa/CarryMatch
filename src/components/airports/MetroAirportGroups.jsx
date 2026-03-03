// Metropolitan area airport groupings for flexible destination matching
export const metroAirportGroups = {
  // Washington DC Metro
  "DC": {
    name: "Washington DC Metro Area",
    airports: ["DCA", "IAD", "BWI"],
    state: "DC/MD/VA"
  },
  
  // New York Metro
  "NYC": {
    name: "New York Metro Area",
    airports: ["JFK", "LGA", "EWR"],
    state: "NY/NJ"
  },
  
  // Los Angeles Metro
  "LA": {
    name: "Los Angeles Metro Area",
    airports: ["LAX", "BUR", "SNA", "ONT", "LGB"],
    state: "CA"
  },
  
  // San Francisco Bay Area
  "SF": {
    name: "San Francisco Bay Area",
    airports: ["SFO", "OAK", "SJC"],
    state: "CA"
  },
  
  // Chicago Metro
  "CHI": {
    name: "Chicago Metro Area",
    airports: ["ORD", "MDW"],
    state: "IL"
  },
  
  // Houston Metro
  "HOU": {
    name: "Houston Metro Area",
    airports: ["IAH", "HOU"],
    state: "TX"
  },
  
  // Dallas/Fort Worth Metro
  "DFW": {
    name: "Dallas/Fort Worth Metro Area",
    airports: ["DFW", "DAL"],
    state: "TX"
  },
  
  // South Florida
  "MIA": {
    name: "South Florida Metro Area",
    airports: ["MIA", "FLL", "PBI"],
    state: "FL"
  },
  
  // Orlando Metro
  "ORL": {
    name: "Orlando Metro Area",
    airports: ["MCO", "SFB"],
    state: "FL"
  },
  
  // Phoenix Metro
  "PHX": {
    name: "Phoenix Metro Area",
    airports: ["PHX", "AZA"],
    state: "AZ"
  },
  
  // London Metro
  "LON": {
    name: "London Metro Area",
    airports: ["LHR", "LGW", "STN", "LTN", "LCY"],
    state: "England"
  },
  
  // Paris Metro
  "PAR": {
    name: "Paris Metro Area",
    airports: ["CDG", "ORY"],
    state: "France"
  },
  
  // Tokyo Metro
  "TYO": {
    name: "Tokyo Metro Area",
    airports: ["NRT", "HND"],
    state: "Japan"
  },
  
  // Lagos Metro (Nigeria)
  "LOS": {
    name: "Lagos Metro Area",
    airports: ["LOS", "MMA"],
    state: "Lagos"
  },
  
  // Accra Metro (Ghana)
  "ACC": {
    name: "Accra Metro Area",
    airports: ["ACC"],
    state: "Greater Accra"
  }
};

// Reverse lookup: given an IATA code, find which metro groups it belongs to
export function getMetroGroupsForAirport(iataCode) {
  const groups = [];
  for (const [key, group] of Object.entries(metroAirportGroups)) {
    if (group.airports.includes(iataCode)) {
      groups.push({ key, ...group });
    }
  }
  return groups;
}

// Get all airports in a metro area by metro key
export function getAirportsInMetro(metroKey) {
  return metroAirportGroups[metroKey]?.airports || [];
}

// Find if two airports are in the same metro area
export function areAirportsInSameMetro(iata1, iata2) {
  for (const group of Object.values(metroAirportGroups)) {
    if (group.airports.includes(iata1) && group.airports.includes(iata2)) {
      return true;
    }
  }
  return false;
}

// Get metro group info by IATA code
export function getMetroGroupByAirport(iataCode) {
  for (const [key, group] of Object.entries(metroAirportGroups)) {
    if (group.airports.includes(iataCode)) {
      return { key, ...group };
    }
  }
  return null;
}