// One-time image optimization pass. Resizes each image to the real display
// width Lighthouse measured (or a reasonable retina cap for images not yet
// audited) and emits a WebP sibling + a re-compressed fallback in the
// original format, both far smaller than the untouched CAD-render exports.
// Run once from tools/evaluate/: node optimize-images.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const IMG_DIR = "C:\\Users\\Jakda\\git\\Aaronearlerichardson.github.io\\assets\\images";

// [filename, maxWidthPx] — maxWidth is 2x the real CSS display width so
// retina screens stay sharp without shipping the untouched export.
const TARGETS = [
  ["earbud-in-ear.jpg", 1400],       // full-width figure, JPEG source
  ["clinical-eeg-diagram.png", 1400], // full-width figure, PNG source (diagram)
  ["ieeg-brain.png", 1400],          // full-width figure
  ["cmrif-create-image.png", 900],   // figure-row (half width)
  ["cmrif-ami.png", 900],            // figure-row (half width)
  ["earbud-anim-poster.jpg", 1400],  // video poster, full-width
  ["tourniquet-anim-poster.jpg", 1400],
  ["speculum-anim-poster.jpg", 1400],
  ["aaron-headshot.jpg", 800],       // rendered at 400x400 (2x = 800)
];

async function main() {
  for (const [file, maxWidth] of TARGETS) {
    const src = path.join(IMG_DIR, file);
    if (!fs.existsSync(src)) { console.error(`skip (missing): ${file}`); continue; }
    const ext = path.extname(file).toLowerCase();
    const base = file.slice(0, -ext.length);
    const before = fs.statSync(src).size;
    const meta = await sharp(src).metadata();

    const resizeOpts = meta.width > maxWidth ? { width: maxWidth } : {};

    // WebP sibling
    const webpPath = path.join(IMG_DIR, `${base}.webp`);
    await sharp(src).resize(resizeOpts).webp({ quality: 82 }).toFile(webpPath);

    // Re-compressed fallback in original format, written to a temp file
    // then swapped in (sharp can't read+write the same path directly).
    const tmpPath = path.join(IMG_DIR, `${base}.tmp${ext}`);
    let pipeline = sharp(src).resize(resizeOpts);
    if (ext === ".jpg" || ext === ".jpeg") pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    else if (ext === ".png") pipeline = pipeline.png({ quality: 82, compressionLevel: 9 });
    await pipeline.toFile(tmpPath);
    fs.renameSync(tmpPath, src);

    const afterFallback = fs.statSync(src).size;
    const afterWebp = fs.statSync(webpPath).size;
    const newMeta = await sharp(src).metadata();
    console.error(
      `${file}: ${meta.width}x${meta.height} (${(before / 1024).toFixed(0)} KiB) -> ` +
      `${newMeta.width}x${newMeta.height} fallback ${(afterFallback / 1024).toFixed(0)} KiB, ` +
      `webp ${(afterWebp / 1024).toFixed(0)} KiB`
    );
  }
}

main().catch(err => { console.error(err); process.exit(1); });
