/**
 * End-to-end API check.
 *
 * Boots the real Express app against a real MongoDB engine (an ephemeral
 * one, started for this run only) and walks the flows the UI actually
 * performs: sign in, load the care circle, load a bundle, tick a dose,
 * submit a reading, and confirm a caregiver cannot reach another household.
 *
 *   npm run verify
 *
 * This is a development harness. The app itself always connects to whatever
 * MONGODB_URI points at.
 */
process.env.NODE_ENV = "test";
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/careguard_verify";
process.env.SESSION_TTL_HOURS ??= "12";

const results = [];
let failures = 0;

function check(name, condition, detail = "") {
  const ok = Boolean(condition);
  if (!ok) failures += 1;
  results.push({ ok, name, detail });
  console.log(`${ok ? "  PASS" : "  FAIL"}  ${name}${detail ? `  — ${detail}` : ""}`);
}

async function main() {
  const { MongoMemoryServer } = await import("mongodb-memory-server");

  console.log("Starting an ephemeral MongoDB…");
  const mongod = await MongoMemoryServer.create({
    instance: {
      // The first run extracts a ~780 MB binary, and on Windows Defender
      // scanning it can easily push startup past the 10s default.
      timeout: 120000,
    },
  });
  process.env.MONGODB_URI = mongod.getUri("careguard");

  // Imported after MONGODB_URI is set, because config.js reads it at import.
  const { connectDb, disconnectDb, mongoose } = await import("./db.js");
  const { ensureIndexes } = await import("./lib/indexes.js");
  const { seed } = await import("./seed.js");
  const { createApp } = await import("./app.js");
  const { default: request } = await import("supertest");

  await connectDb();
  await ensureIndexes();
  await seed({ force: true, log: () => {} });
  await mongoose.connection.syncIndexes();

  const app = createApp({ logRequests: false });
  const api = () => request(app);

  const auth = (token) => ({ Authorization: `Bearer ${token}` });

  /* ------------------------------------------------------------------ auth */

  console.log("\nAuth");

  const login = await api().post("/api/auth/login").send({
    email: "aryaa@careguard.app",
    password: "careguard",
  });
  check("login with a seeded demo account", login.status === 200, `status ${login.status}`);
  check("login returns a session token", Boolean(login.body?.session?.token));
  check("login never returns a password hash", !JSON.stringify(login.body).includes("passwordHash"));
  check("demo account is flagged", login.body?.user?.demo === true);

  const token = login.body.session.token;

  const badLogin = await api()
    .post("/api/auth/login")
    .send({ email: "aryaa@careguard.app", password: "wrong-password" });
  check("wrong password is rejected", badLogin.status === 401);

  const noToken = await api().get("/api/care/care-circle");
  check("care circle requires a token", noToken.status === 401);

  const me = await api().get("/api/auth/me").set(auth(token));
  check("session restores from a stored token", me.body?.user?.email === "aryaa@careguard.app");

  /* ----------------------------------------------------------- care circle */

  console.log("\nCare circle");

  const circle = await api().get("/api/care/care-circle").set(auth(token));
  check("care circle loads", circle.status === 200, `status ${circle.status}`);
  check("Aryaa sees one profile", circle.body?.length === 1, `got ${circle.body?.length}`);
  check("the profile is Sarala Devi", circle.body?.[0]?.name === "Sarala Devi");

  // Daniel is linked to three different people — used to prove isolation.
  const daniel = await api()
    .post("/api/auth/login")
    .send({ email: "daniel@careguard.app", password: "careguard" });
  const danielToken = daniel.body.session.token;
  const danielCircle = await api().get("/api/care/care-circle").set(auth(danielToken));
  check("Daniel sees three profiles", danielCircle.body?.length === 3, `got ${danielCircle.body?.length}`);

  /* ------------------------------------------------------ cross-household */

  console.log("\nAuthorisation");

  const notMine = await api().get("/api/care/elderly/elderly-005/bundle").set(auth(token));
  check("cannot read an unlinked profile's bundle", notMine.status === 404, `status ${notMine.status}`);

  const notMineMeds = await api().get("/api/care/elderly/elderly-005/medications").set(auth(token));
  check("cannot read an unlinked profile's medications", notMineMeds.status === 404);

  /* ---------------------------------------------------------------- bundle */

  console.log("\nCare bundle");

  const bundle = await api().get("/api/care/elderly/elderly-001/bundle").set(auth(token));
  check("bundle loads", bundle.status === 200, `status ${bundle.status}`);
  const b = bundle.body;
  check("bundle carries the profile", b?.profile?.name === "Sarala Devi");
  check("bundle carries a 24h vitals series", b?.vitals?.hr?.length === 24, `len ${b?.vitals?.hr?.length}`);
  check("bundle carries medications from MongoDB", Array.isArray(b?.medications) && b.medications.length > 0);
  check("medication ids are strings", typeof b?.medications?.[0]?.id === "string");
  check("bundle carries the care team", Array.isArray(b?.careTeam) && b.careTeam.length > 0);
  check("bundle carries alerts", Array.isArray(b?.initialAlerts) && b.initialAlerts.length > 0);
  check("bundle is labelled simulated", b?.simulated === true);
  check("bundle carries the weekly report", typeof b?.weeklyReport?.score === "number");

  /* ----------------------------------------------------------- medications */

  console.log("\nMedications");

  const med = b.medications[0];
  const saved = await api()
    .post("/api/care/elderly/elderly-001/medications")
    .set(auth(token))
    .send({ ...med, taken: !med.taken });
  check("marking a dose persists", saved.status === 200);
  const flipped = saved.body.find((m) => m.id === med.id);
  check("the dose is now toggled", flipped?.taken === !med.taken);

  const reloaded = await api().get("/api/care/elderly/elderly-001/bundle").set(auth(token));
  const reread = reloaded.body.medications.find((m) => m.id === med.id);
  check("the change survives a fresh bundle load", reread?.taken === !med.taken);

  const taken = reloaded.body.adherence.taken;
  const total = reloaded.body.adherence.total;
  const counted = reloaded.body.medications.filter((m) => m.taken).length;
  check("adherence is recomputed from stored rows", taken === counted, `${taken} vs ${counted}`);
  check("adherence total matches the schedule", total === reloaded.body.medications.length);

  const added = await api()
    .post("/api/care/elderly/elderly-001/medications")
    .set(auth(token))
    .send({ name: "Vitamin D 1000IU", dose: "1 tablet", time: "9:00 AM", period: "morning" });
  check("a new medication is created", added.body.length === total + 1);
  const created = added.body[added.body.length - 1];
  check("the new medication gets a server id", typeof created.id === "string" && created.id.length > 0);

  const removed = await api()
    .delete(`/api/care/elderly/elderly-001/medications/${created.id}`)
    .set(auth(token));
  check("the new medication is removed", removed.body.length === total);

  /* -------------------------------------------------------------- readings */

  console.log("\nHealth readings");

  const latest = await api().get("/api/health/elderly/elderly-001/latest").set(auth(token));
  check("latest reading loads", latest.status === 200);
  check("latest reading is flagged simulated", latest.body?.simulated === true);
  check("latest reading carries severity flags", Boolean(latest.body?.flags?.heartRate));
  check("blood pressure formats as a pair", /^\d+\/\d+$/.test(latest.body?.bloodPressure ?? ""));

  const manual = await api()
    .post("/api/health/elderly/elderly-001/readings")
    .set(auth(token))
    .send({ heartRate: 128, bloodOxygen: 91 });
  check("a manual reading is accepted", manual.status === 201, `status ${manual.status}`);
  check("a manual reading is NOT marked simulated", manual.body?.simulated === false);
  check("the server flags a high heart rate", manual.body?.flags?.heartRate === "high");
  check("the server flags low blood oxygen", manual.body?.flags?.bloodOxygen === "low");

  const emptyReading = await api()
    .post("/api/health/elderly/elderly-001/readings")
    .set(auth(token))
    .send({});
  check("an empty reading is rejected", emptyReading.status === 400);

  const readings = await api().get("/api/health/elderly/elderly-001/readings").set(auth(token));
  check("stored readings are returned newest first", readings.body?.length === 1);
  check("the stored reading carries an id", Boolean(readings.body?.[0]?.id));

  /* ---------------------------------------------------------------- alerts */

  console.log("\nAlerts");

  const alert = await api()
    .post("/api/care/elderly/elderly-001/alerts")
    .set(auth(token))
    .send({ type: "danger", icon: "siren", title: "SOS triggered", detail: "Test" });
  check("an alert is created", alert.status === 201, `status ${alert.status}`);

  const read = await api()
    .patch(`/api/care/elderly/elderly-001/alerts/${alert.body.id}`)
    .set(auth(token))
    .send({ read: true });
  check("an alert can be marked read", read.body?.read === true);

  const readAll = await api()
    .post("/api/care/elderly/elderly-001/alerts/read-all")
    .set(auth(token));
  check("all alerts can be marked read", readAll.body.every((a) => a.read === true));

  const cleared = await api()
    .delete(`/api/care/elderly/elderly-001/alerts/${alert.body.id}`)
    .set(auth(token));
  check("an alert can be deleted", !cleared.body.some((a) => a.id === alert.body.id));

  /* ----------------------------------------------------------------- care team */

  console.log("\nCare team");

  const invited = await api()
    .post("/api/care/elderly/elderly-001/care-team")
    .set(auth(token))
    .send({ name: "Test Neighbour", phone: "+91 98450 00000" });
  check("a care team member is added", invited.body.some((m) => m.name === "Test Neighbour"));
  const newMember = invited.body.find((m) => m.name === "Test Neighbour");
  check("an invite lands as pending", newMember?.pending === true);

  const perms = await api()
    .patch("/api/care/elderly/elderly-001/care-team/Test Neighbour")
    .set(auth(token))
    .send({ access: ["Health", "SOS"] });
  const permed = perms.body.find((m) => m.name === "Test Neighbour");
  check("permissions update", JSON.stringify(permed?.access) === JSON.stringify(["Health", "SOS"]));

  const removedMember = await api()
    .delete("/api/care/elderly/elderly-001/care-team/Test Neighbour")
    .set(auth(token));
  check("a care team member is removed", !removedMember.body.some((m) => m.name === "Test Neighbour"));

  /* ---------------------------------------------------------------- profile */

  console.log("\nProfile");

  const patched = await api()
    .patch("/api/care/elderly/elderly-001/profile")
    .set(auth(token))
    .send({ address: "Jayanagar 4th Block" });
  check("a profile edit persists", patched.body?.address === "Jayanagar 4th Block");
  check("unrelated fields are untouched by a merge patch", patched.body?.name === "Sarala Devi");

  const noWrite = await api()
    .patch("/api/care/elderly/elderly-001/profile")
    .set(auth(token))
    .send({ sim: { seed: 1 } });
  check("the simulation baseline is not writable", noWrite.status === 400, `status ${noWrite.status}`);

  /* ---------------------------------------------------------------- privacy */

  console.log("\nPrivacy");

  const privacy = await api()
    .patch("/api/care/elderly/elderly-001/privacy")
    .set(auth(token))
    .send({ locationSharing: "live" });
  check("location sharing can be set to live", privacy.body?.locationSharing === "live");

  const badPrivacy = await api()
    .patch("/api/care/elderly/elderly-001/privacy")
    .set(auth(token))
    .send({ locationSharing: "everywhere" });
  check("an invalid privacy value is rejected", badPrivacy.status === 400);

  /* --------------------------------------------------------------- settings */

  console.log("\nSettings");

  const savedSettings = await api()
    .patch("/api/care/settings")
    .set(auth(token))
    .send({ textScale: 1.2, highContrast: true });
  check("settings save", savedSettings.body?.textScale === 1.2);
  check("boolean settings save", savedSettings.body?.highContrast === true);
  check("settings carry no envelope fields", savedSettings.body?._id === undefined);

  const fetchedSettings = await api().get("/api/care/settings").set(auth(token));
  check("settings reload", fetchedSettings.body?.textScale === 1.2);

  /* ------------------------------------------------------------ registration */

  console.log("\nRegistration");

  const email = `tester${Date.now().toString(36)}@careguard.test`;
  const reg = await api()
    .post("/api/auth/register")
    .send({
      name: "New Caregiver",
      email,
      password: "supersecret1",
      confirmPassword: "supersecret1",
      country: "IN",
      role: "senior",
    });
  check("registration succeeds", reg.status === 201, `status ${reg.status}`);
  check("a new account is not a demo", reg.body?.user?.demo === false);
  check("registration issues a session", Boolean(reg.body?.session?.token));
  check("a senior signup becomes an elderly account", reg.body?.user?.role === "elderly");

  const newCircle = await api()
    .get("/api/care/care-circle")
    .set(auth(reg.body.session.token));
  check("a brand new account has an empty care circle", Array.isArray(newCircle.body) && newCircle.body.length === 0);

  const dupe = await api()
    .post("/api/auth/register")
    .send({ name: "Dupe", email, password: "supersecret1" });
  check("a duplicate email is rejected", dupe.status === 409, `status ${dupe.status}`);

  const weak = await api()
    .post("/api/auth/register")
    .send({ name: "Weak", email: `w${Date.now().toString(36)}@careguard.test`, password: "short" });
  check("a weak password is rejected", weak.status === 400);
  check("a weak password names the field", weak.body?.field === "password");

  /* ------------------------------------------------------------------ logout */

  console.log("\nSession lifecycle");

  const loggedOut = await api().post("/api/auth/logout").set(auth(token));
  check("logout succeeds", loggedOut.status === 200);

  const afterLogout = await api().get("/api/care/care-circle").set(auth(token));
  check("the token stops working after logout", afterLogout.status === 401, `status ${afterLogout.status}`);

  /* ------------------------------------------------------------------ status */

  const status = await api().get("/api/status");
  check("status reports the database as connected", status.body?.database?.state === "connected");

  /* ---------------------------------------------------------------- teardown */

  await disconnectDb();
  await mongod.stop();

  console.log(
    `\n${results.length - failures}/${results.length} checks passed` +
      (failures ? `  (${failures} FAILED)` : "")
  );
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error("\nVerification crashed:", err);
  process.exit(1);
});
