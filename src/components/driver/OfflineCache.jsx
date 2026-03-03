// Offline cache manager for Driver App
export class OfflineCache {
  static CACHE_KEYS = {
    TRIPS: 'driver-trips-cache',
    PASSENGERS: 'driver-passengers-cache',
    ROUTES: 'driver-routes-cache',
    OPERATORS: 'driver-operators-cache',
    LAST_SYNC: 'driver-last-sync'
  };

  static saveTrips(trips) {
    localStorage.setItem(this.CACHE_KEYS.TRIPS, JSON.stringify(trips));
    this.updateLastSync();
  }

  static getTrips() {
    const cached = localStorage.getItem(this.CACHE_KEYS.TRIPS);
    return cached ? JSON.parse(cached) : [];
  }

  static savePassengers(tripId, passengers) {
    const cache = this.getAllPassengers();
    cache[tripId] = passengers;
    localStorage.setItem(this.CACHE_KEYS.PASSENGERS, JSON.stringify(cache));
  }

  static getPassengers(tripId) {
    const cache = this.getAllPassengers();
    return cache[tripId] || [];
  }

  static getAllPassengers() {
    const cached = localStorage.getItem(this.CACHE_KEYS.PASSENGERS);
    return cached ? JSON.parse(cached) : {};
  }

  static saveRoutes(routes) {
    localStorage.setItem(this.CACHE_KEYS.ROUTES, JSON.stringify(routes));
  }

  static getRoutes() {
    const cached = localStorage.getItem(this.CACHE_KEYS.ROUTES);
    return cached ? JSON.parse(cached) : [];
  }

  static saveOperators(operators) {
    localStorage.setItem(this.CACHE_KEYS.OPERATORS, JSON.stringify(operators));
  }

  static getOperators() {
    const cached = localStorage.getItem(this.CACHE_KEYS.OPERATORS);
    return cached ? JSON.parse(cached) : [];
  }

  static updateLastSync() {
    localStorage.setItem(this.CACHE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  static getLastSync() {
    return localStorage.getItem(this.CACHE_KEYS.LAST_SYNC);
  }

  static clearAll() {
    Object.values(this.CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}