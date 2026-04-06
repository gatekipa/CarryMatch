// Exports wave-1 Base44 entity data into local JSON files as a safe extraction scaffold.
import { createClient } from "@base44/sdk";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputDir = resolve(scriptDir, "output");
const defaultBase44ServerUrl = "https://app.base44.com";
const exportLimit = Number.parseInt(process.env.BASE44_EXPORT_LIMIT || "500", 10);

const exportSpecs = [
  { tableName: "user_profiles", collectionNames: ["User"], requiresAuth: true, readStrategy: "userProfiles" },
  { tableName: "bus_operators", collectionNames: ["BusOperator"], readStrategy: "busOperators" },
  { tableName: "trips", collectionNames: ["Trip", "BusTrip"], readStrategy: "trips" },
  { tableName: "trip_seat_inventory", collectionNames: ["TripSeatInventory"], readStrategy: "tripSeatInventory" },
  { tableName: "orders", collectionNames: ["Order"], readStrategy: "orders" },
  { tableName: "order_seats", collectionNames: ["OrderSeat"], readStrategy: "orderSeats" },
  { tableName: "tickets", collectionNames: ["Ticket", "BusTicket"], readStrategy: "tickets" },
  { tableName: "operator_staff", collectionNames: ["OperatorStaff"], readStrategy: "operatorStaff" },
  { tableName: "operator_branches", collectionNames: ["OperatorBranch"], readStrategy: "operatorBranches" },
  { tableName: "bus_routes", collectionNames: ["BusRoute"], readStrategy: "busRoutes" },
  { tableName: "vehicles", collectionNames: ["Vehicle", "BusVehicle"], readStrategy: "vehicles" },
  { tableName: "seat_map_templates", collectionNames: ["SeatMapTemplate"], readStrategy: "seatMapTemplates" },
  { tableName: "seat_allocation_rules", collectionNames: ["SeatAllocationRule"], readStrategy: "allocationRules" },
  { tableName: "seat_allocations", collectionNames: ["SeatAllocation"], readStrategy: "allocations" },
];

const getBase44AuthToken = () =>
  process.env.BASE44_AUTH_TOKEN ||
  process.env.BASE44_ACCESS_TOKEN ||
  process.env.BASE44_TOKEN ||
  process.env.VITE_BASE44_ACCESS_TOKEN ||
  process.env.ACCESS_TOKEN ||
  undefined;

const getBase44ClientConfig = () => {
  // Mirrors the current repo's Base44 client/config contract:
  // src/api/base44Client.js -> src/lib/app-params.js
  return {
    appId: process.env.VITE_BASE44_APP_ID || "",
    serverUrl: process.env.VITE_BASE44_BACKEND_URL || defaultBase44ServerUrl,
    token: getBase44AuthToken(),
    functionsVersion:
      process.env.BASE44_FUNCTIONS_VERSION ||
      process.env.FUNCTIONS_VERSION ||
      undefined,
    requiresAuth: false,
  };
};

const toOutputPath = (tableName) => resolve(outputDir, `${tableName}.json`);

const writeRows = async (tableName, rows) => {
  await writeFile(toOutputPath(tableName), `${JSON.stringify(rows, null, 2)}\n`, "utf8");
};

const logSkip = async (tableName, reason) => {
  await writeRows(tableName, []);
  console.log(`SKIP ${tableName} ${reason}`);
};

const isCollectionHandle = (value) =>
  Boolean(value) &&
  typeof value.list === "function" &&
  typeof value.filter === "function";

function createCompatibilityBase44Client() {
  const config = getBase44ClientConfig();

  if (!config.appId) {
    return null;
  }

  return createClient(config);
}

async function tryReadCurrentUser(base44Client, hasAuthToken) {
  if (!hasAuthToken) {
    return null;
  }

  try {
    return await base44Client.auth.me();
  } catch {
    return null;
  }
}

function resolveCollectionHandles(spec, base44Client) {
  const handles = [];

  for (const collectionName of spec.collectionNames) {
    if (isCollectionHandle(base44Client?.entities?.[collectionName])) {
      handles.push({
        collectionName,
        handle: base44Client.entities[collectionName],
      });
    }
  }

  return handles;
}

async function fetchRows(collectionHandle) {
  if (!Number.isInteger(exportLimit) || exportLimit <= 0) {
    return await collectionHandle.list();
  }

  return await collectionHandle.list(undefined, exportLimit);
}

async function fetchRowsForCompoundField(collectionHandle, fieldName, values, extraQuery = {}) {
  const normalizedValues = values.filter(Boolean);
  if (normalizedValues.length === 0) {
    return [];
  }

  const rows = [];
  for (const batch of chunk(normalizedValues)) {
    const query = {
      ...extraQuery,
      [fieldName]:
        batch.length === 1
          ? batch[0]
          : { $in: batch },
    };
    const result = await collectionHandle.filter(query);
    if (Array.isArray(result)) {
      rows.push(...result);
    }
  }

  return dedupeRows(rows);
}

function chunk(values, size = 25) {
  const chunks = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

function dedupeRows(rows) {
  const seen = new Set();
  const deduped = [];

  for (const row of rows) {
    const key = row?.id || JSON.stringify(row);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(row);
  }

  return deduped;
}

async function fetchRowsByChunks(collectionHandle, fieldName, values) {
  const normalizedValues = values.filter(Boolean);
  if (normalizedValues.length === 0) {
    return [];
  }

  const rows = [];
  for (const batch of chunk(normalizedValues)) {
    const query =
      batch.length === 1
        ? { [fieldName]: batch[0] }
        : { [fieldName]: { $in: batch } };
    const result = await collectionHandle.filter(query);
    if (Array.isArray(result)) {
      rows.push(...result);
    }
  }

  return dedupeRows(rows);
}

async function fetchAllocationRules(collectionHandle, context) {
  const rows = [];

  rows.push(...await fetchRowsByChunks(collectionHandle, "trip_id", context.tripIds));

  if (context.routeIds.length > 0) {
    rows.push(
      ...await fetchRowsByChunks(collectionHandle, "route_template_id", context.routeIds),
    );
  }

  return dedupeRows(rows);
}

async function fetchAllocations(collectionHandle, context) {
  const allocationRuleIds = context.seatAllocationRules.map((row) => row?.id).filter(Boolean);
  return await fetchRowsByChunks(collectionHandle, "seat_allocation_rule_id", allocationRuleIds);
}

async function fetchBusOperators(collectionHandle, context) {
  if (context.currentUser?.email) {
    const ownedOperators = await collectionHandle.filter({ created_by: context.currentUser.email });
    if (Array.isArray(ownedOperators) && ownedOperators.length > 0) {
      return ownedOperators;
    }
  }

  return await fetchRows(collectionHandle);
}

async function fetchTrips(collectionHandle, collectionName, context) {
  const query = {
    departure_datetime: { $gte: new Date().toISOString() },
  };

  if (context.operatorIds.length > 0) {
    query.operator_id =
      context.operatorIds.length === 1
        ? context.operatorIds[0]
        : { $in: context.operatorIds };
  }

  if (collectionName === "BusTrip") {
    query.status = { $in: ["scheduled", "boarding"] };
  } else {
    query.trip_status = { $in: ["scheduled", "boarding"] };
  }

  return await collectionHandle.filter(query, "departure_datetime", exportLimit);
}

async function fetchOrders(collectionHandle, context) {
  return await fetchRowsForCompoundField(collectionHandle, "trip_id", context.tripIds, {
    order_status: "paid",
  });
}

async function fetchTickets(collectionHandle, collectionName, context) {
  if (collectionName === "BusTicket") {
    return await fetchRowsByChunks(collectionHandle, "trip_id", context.tripIds);
  }

  return await fetchRowsByChunks(collectionHandle, "order_id", context.orderIds);
}

async function fetchBusRoutes(collectionHandle, context) {
  if (context.operatorIds.length > 0) {
    return await fetchRowsByChunks(collectionHandle, "operator_id", context.operatorIds);
  }

  return await collectionHandle.filter({ route_status: "active" });
}

async function fetchWithStrategy(spec, resolvedHandle, context) {
  const { handle: collectionHandle, collectionName } = resolvedHandle;

  switch (spec.readStrategy) {
    case "userProfiles":
      return await fetchRows(collectionHandle);
    case "busOperators":
      return await fetchBusOperators(collectionHandle, context);
    case "trips":
      return await fetchTrips(collectionHandle, collectionName, context);
    case "tripSeatInventory":
      return await fetchRowsByChunks(collectionHandle, "trip_id", context.tripIds);
    case "orders":
      return await fetchOrders(collectionHandle, context);
    case "orderSeats":
      return await fetchRowsByChunks(collectionHandle, "order_id", context.orderIds);
    case "tickets":
      return await fetchTickets(collectionHandle, collectionName, context);
    case "operatorStaff":
      return await fetchRowsByChunks(collectionHandle, "operator_id", context.operatorIds);
    case "operatorBranches":
      return await fetchRowsByChunks(collectionHandle, "operator_id", context.operatorIds);
    case "busRoutes":
      return await fetchBusRoutes(collectionHandle, context);
    case "vehicles":
      return await fetchRowsByChunks(collectionHandle, "operator_id", context.operatorIds);
    case "seatMapTemplates":
      return await fetchRowsByChunks(collectionHandle, "operator_id", context.operatorIds);
    case "allocationRules":
      return await fetchAllocationRules(collectionHandle, context);
    case "allocations":
      return await fetchAllocations(collectionHandle, context);
    default:
      return await fetchRows(collectionHandle);
  }
}

function getSkipReason(spec, error) {
  const message = error?.message || "Unknown error";

  if (spec.requiresAuth && /authentication required|unauthorized|forbidden|401/i.test(message)) {
    return "(Base44 auth is not available for this entity under Node)";
  }

  return `(${message})`;
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  console.log("INFO using Base44 client contract from src/api/base44Client.js and src/lib/app-params.js");
  const base44Client = createCompatibilityBase44Client();
  const hasAuthToken = Boolean(getBase44AuthToken());
  const currentUser = await tryReadCurrentUser(base44Client, hasAuthToken);
  const exportContext = {
    currentUser,
    operatorIds: [],
    tripIds: [],
    routeIds: [],
    orderIds: [],
    seatAllocationRules: [],
  };

  if (!base44Client) {
    for (const spec of exportSpecs) {
      await logSkip(spec.tableName, "(missing VITE_BASE44_APP_ID; wrote empty export file)");
    }
    return;
  }

  for (const spec of exportSpecs) {
    if (spec.requiresAuth && !hasAuthToken) {
      await logSkip(spec.tableName, "(Base44 auth token not available under Node)");
      continue;
    }

    const collectionHandles = resolveCollectionHandles(spec, base44Client);

    if (collectionHandles.length === 0) {
      await logSkip(spec.tableName, "(entity not available through current seam)");
      continue;
    }

    try {
      let chosenCollectionName = collectionHandles[0].collectionName;
      let normalizedRows = [];

      for (const resolvedHandle of collectionHandles) {
        const rows = await fetchWithStrategy(spec, resolvedHandle, exportContext);
        const candidateRows = Array.isArray(rows) ? rows : [];
        chosenCollectionName = resolvedHandle.collectionName;
        normalizedRows = candidateRows;

        if (candidateRows.length > 0) {
          break;
        }
      }

      await writeRows(spec.tableName, normalizedRows);
      console.log(`EXPORTED ${spec.tableName} ${normalizedRows.length} rows via ${chosenCollectionName}`);

      if (spec.tableName === "bus_operators") {
        exportContext.operatorIds = normalizedRows.map((row) => row?.id).filter(Boolean);
      }

      if (spec.tableName === "trips") {
        exportContext.tripIds = normalizedRows.map((row) => row?.id).filter(Boolean);
        exportContext.routeIds = normalizedRows.map((row) => row?.route_id).filter(Boolean);
      }

      if (spec.tableName === "orders") {
        exportContext.orderIds = normalizedRows.map((row) => row?.id).filter(Boolean);
      }

      if (spec.tableName === "seat_allocation_rules") {
        exportContext.seatAllocationRules = normalizedRows;
      }
    } catch (error) {
      await logSkip(spec.tableName, getSkipReason(spec, error));
    }
  }
}

await main();
