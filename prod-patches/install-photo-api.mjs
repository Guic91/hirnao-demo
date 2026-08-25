import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const SRC = "/tmp/profile-photo.ts";
const DEST = "/app/apps/api/src/routes/profile-photo.ts";
const SERVER = "/app/apps/api/src/server.ts";
const URL = "https://raw.githubusercontent.com/Guic91/hirnao-demo/main/prod-patches/profile-photo.ts";

if (!existsSync(SRC)) {
  const res = await fetch(URL);
  if (!res.ok) throw new Error("download profile-photo.ts " + res.status);
  writeFileSync(SRC, await res.text());
}
writeFileSync(DEST, readFileSync(SRC, "utf8"));
console.log("wrote profile-photo.ts");
mkdirSync("/app/data/avatars", { recursive: true });

let s = readFileSync(SERVER, "utf8");
if (!s.includes("profile-photo")) {
  if (s.includes("import { profileRoutes }")) {
    s = s.replace(
      "import { profileRoutes } from \"./routes/profile.js\";",
      "import { profileRoutes } from \"./routes/profile.js\";\nimport { profilePhotoRoutes } from \"./routes/profile-photo.js\";",
    );
  } else {
    s = 'import { profilePhotoRoutes } from \"./routes/profile-photo.js\";\n' + s;
  }
  s = s.replace(
    'await app.register(profileRoutes, { prefix: "/v1/profile" });',
    'await app.register(profileRoutes, { prefix: "/v1/profile" });\n  await app.register(profilePhotoRoutes, { prefix: "/v1/profile", bodyLimit: 3500000 });',
  );
  writeFileSync(SERVER, s);
  console.log("patched server.ts");
} else {
  console.log("server.ts already has photo routes");
}
console.log("photo api install done");
