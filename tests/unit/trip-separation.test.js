import { describe, it, expect } from 'vitest';
import { isBusTrip, filterP2PTrips, filterBusTrips } from '../../src/lib/business-logic';

describe('Trip Type Classification', () => {
  const p2pTrip = {
    id: 'trip_1',
    status: 'active',
    from_city: 'Paris',
    to_city: 'London',
    available_weight_kg: 10,
    traveler_email: 'user@test.com'
  };

  const busTrip = {
    id: 'trip_2',
    operator_id: 'op_express',
    trip_status: 'scheduled',
    route_id: 'route_1',
    vehicle_id: 'vehicle_1',
    base_price_xaf: 5000
  };

  const canceledBusTrip = {
    id: 'trip_3',
    operator_id: 'op_express',
    trip_status: 'canceled',
    route_id: 'route_2'
  };

  describe('isBusTrip', () => {
    it('returns false for P2P trip', () => {
      expect(isBusTrip(p2pTrip)).toBe(false);
    });

    it('returns true for bus trip', () => {
      expect(isBusTrip(busTrip)).toBe(true);
    });

    it('returns false for null', () => {
      expect(isBusTrip(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isBusTrip(undefined)).toBe(false);
    });
  });

  describe('filterP2PTrips', () => {
    const mixed = [p2pTrip, busTrip, canceledBusTrip];

    it('excludes bus trips', () => {
      const result = filterP2PTrips(mixed);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('trip_1');
    });

    it('only includes active P2P trips', () => {
      const withInactive = [...mixed, { ...p2pTrip, id: 'trip_4', status: 'completed' }];
      const result = filterP2PTrips(withInactive);
      expect(result).toHaveLength(1);
    });

    it('handles empty array', () => {
      expect(filterP2PTrips([])).toEqual([]);
    });

    it('handles null', () => {
      expect(filterP2PTrips(null)).toEqual([]);
    });
  });

  describe('filterBusTrips', () => {
    const mixed = [p2pTrip, busTrip, canceledBusTrip];

    it('only includes trips with operator_id and trip_status', () => {
      const result = filterBusTrips(mixed);
      expect(result).toHaveLength(2);
      expect(result.every(t => t.operator_id)).toBe(true);
    });

    it('excludes P2P trips', () => {
      const result = filterBusTrips(mixed);
      expect(result.find(t => t.id === 'trip_1')).toBeUndefined();
    });
  });
});
