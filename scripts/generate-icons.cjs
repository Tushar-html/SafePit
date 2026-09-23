/* Regenerates the Android launcher icons + splash from public/logo.png.
   Usage: npm run icons  (requires the devDependency `sharp`) */
const sharp = require("sharp");
const path = "android/app/src/main/res/";
const sizes = { "mipmap-mdpi": 48, "mipmap-hdpi": 72, "mipmap-xhdpi": 96, "mipmap-xxhdpi": 144, "mipmap-xxxhdpi": 192 };

(async () => {
  for (const [d, s] of Object.entries(sizes)) {
    const canvas = Buffer.from(`<svg width="${s}" height="${s}"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>`);
    const logo = await sharp("public/logo.png").resize(Math.round(s * 0.82), Math.round(s * 0.82), { fit: "inside" }).png().toBuffer();
    await sharp(canvas).composite([{ input: logo, gravity: "centre" }]).png().toFile(path + d + "/ic_launcher.png");
    await sharp(canvas).composite([{ input: logo, gravity: "centre" }]).png().toFile(path + d + "/ic_launcher_round.png");
    const pad = Math.round(s * 0.14);
    const logoFg = await sharp("public/logo.png").resize(s - pad * 2, s - pad * 2, { fit: "inside" }).png().toBuffer();
    await sharp(canvas).composite([{ input: logoFg, gravity: "centre" }]).png().toFile(path + d + "/ic_launcher_foreground.png");
  }
  // splash (base + Capacitor density folders that exist)
  const w = 1280, h = 960;
  const canvas = Buffer.from(`<svg width="${w}" height="${h}"><rect width="100%" height="100%" fill="#FFFFFF"/></svg>`);
  const logo = await sharp("public/logo.png").resize(Math.round(w * 0.35), Math.round(w * 0.35), { fit: "inside" }).png().toBuffer();
  const targets = ["drawable"];
  for (const suf of ["-mdpi", "-hdpi", "-xhdpi", "-xxhdpi", "-xxxhdpi", "-land-hdpi", "-land-mdpi", "-land-xhdpi", "-land-xxhdpi", "-land-xxxhdpi", "-port-hdpi", "-port-mdpi", "-port-xhdpi", "-port-xxhdpi", "-port-xxxhdpi"]) {
    targets.push("drawable" + suf);
  }
  for (const dir of targets) {
    try {
      await sharp(canvas).composite([{ input: logo, gravity: "centre" }]).png().toFile(path + dir + "/splash.png");
    } catch { /* folder does not exist — skip */ }
  }
  console.log("icons + splash regenerated from public/logo.png");
})().catch(e => { console.error(e); process.exit(1); });
