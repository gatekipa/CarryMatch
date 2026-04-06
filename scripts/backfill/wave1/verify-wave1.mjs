// Verifies that the required Supabase wave 1 tables exist.
import { Client } from "pg";

const REQUIRED_TABLES = [
  "user_profiles",
  "bus_operators",
  "trips",
  "trip_seat_inventory",
  "orders",
  "order_seats",
  "tickets",
  "operator_staff",
  "operator_branches",
  "bus_routes",
  "vehicles",
  "seat_map_templates",
  "seat_allocation_rules",
  "seat_allocations",
];

const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error("Missing required environment variable: SUPABASE_DB_URL");
  process.exit(1);
}

async function getExistingTables() {
  const client = new Client({
    connectionString: dbUrl,
    ssl:
      dbUrl.includes("localhost") || dbUrl.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const { rows } = await client.query(
      `
        SELECT tablename
        FROM pg_catalog.pg_tables
        WHERE schemaname = 'public'
          AND tablename = ANY($1::text[])
        ORDER BY tablename;
      `,
      [REQUIRED_TABLES],
    );

    return new Set(rows.map((row) => row.tablename));
  } catch (error) {
    const message = error?.message || "Unknown pg error";
    console.error(`Failed to verify tables via pg: ${message}`);
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

const existingTables = await getExistingTables();
let hasMissingTables = false;

for (const table of REQUIRED_TABLES) {
  const exists = existingTables.has(table);
  console.log(`${exists ? "PASS" : "FAIL"} ${table}`);
  if (!exists) {
    hasMissingTables = true;
  }
}

process.exit(hasMissingTables ? 1 : 0);
