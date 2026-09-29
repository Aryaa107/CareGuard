/**
 * CareGuard API server — process entry point.
 *
 * Connects to MongoDB, makes sure indexes exist, seeds an empty database, and
 * starts listening. Startup is fail-fast: if the database is unreachable the
 * process exits rather than accepting requests it cannot serve.
 */
import { config, redactUri } from "./config.js";
import { connectDb, disconnectDb, mongoose } from "./db.js";
import { ensureIndexes } from "./lib/indexes.js";
import { seedIfEmpty } from "./seed.js";
import { createApp } from "./app.js";

async function start() {
  console.log(`[careguard] MONGODB_URI=${redactUri(config.mongo.uri)}`);
  await connectDb();
  console.log(`[careguard] connected to database "${mongoose.connection.name}"`);

  await ensureIndexes();

  if (await seedIfEmpty()) {
    console.log("[careguard] seeded demo dataset (run `npm run seed` to reseed)");
  }

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[careguard] API listening on http://localhost:${config.port}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[careguard] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    // Don't hang forever on a stuck connection.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error("[careguard] failed to start:", err.message);
  process.exit(1);
});
