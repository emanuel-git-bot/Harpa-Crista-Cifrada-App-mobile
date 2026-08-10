// Varre assets/hymns e gera src/data/hymnManifest.ts com require() estáticos
// (o Metro bundler exige que require() receba um caminho literal, então não
// dá pra carregar as imagens dinamicamente em tempo de execução).
//
// Rode com: node scripts/generate-manifest.js (ou `npm start`, que já chama isso)

const fs = require("fs");
const path = require("path");
const sizeOf = require("image-size").default || require("image-size");

const ROOT = path.join(__dirname, "..");
const HYMNS_DIR = path.join(ROOT, "assets", "hymns");
const TITLES_FILE = path.join(ROOT, "data", "titles.json");
const OUT_FILE = path.join(ROOT, "src", "data", "hymnManifest.ts");
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function leadingNumber(name) {
  const match = name.match(/^\d+/);
  return match ? parseInt(match[0], 10) : Number.POSITIVE_INFINITY;
}

function readTitles() {
  if (!fs.existsSync(TITLES_FILE)) return {};
  const raw = JSON.parse(fs.readFileSync(TITLES_FILE, "utf8"));
  delete raw._comment;
  return raw;
}

function toRequirePath(absoluteFile) {
  const relative = path.relative(path.dirname(OUT_FILE), absoluteFile);
  return relative.split(path.sep).join("/");
}

function main() {
  const titles = readTitles();
  const hymns = [];

  if (fs.existsSync(HYMNS_DIR)) {
    const folders = fs
      .readdirSync(HYMNS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && /^\d+$/.test(entry.name))
      .sort((a, b) => Number(a.name) - Number(b.name));

    for (const folder of folders) {
      const number = Number(folder.name);
      const folderPath = path.join(HYMNS_DIR, folder.name);
      const imageFiles = fs
        .readdirSync(folderPath)
        .filter((file) => IMAGE_EXT.has(path.extname(file).toLowerCase()))
        .sort((a, b) => leadingNumber(a) - leadingNumber(b));

      if (imageFiles.length === 0) continue;

      const imagePath = path.join(folderPath, imageFiles[0]);
      const { width, height } = sizeOf(fs.readFileSync(imagePath));

      hymns.push({
        number,
        title: titles[String(number)] || `Hino nº ${number}`,
        image: toRequirePath(imagePath),
        width,
        height,
      });
    }
  }

  const lines = [];
  lines.push("// GERADO AUTOMATICAMENTE por scripts/generate-manifest.js");
  lines.push("// Não edite à mão — rode `npm run gerar-hinos` para atualizar.");
  lines.push("");
  lines.push("export type Hymn = {");
  lines.push("  number: number;");
  lines.push("  title: string;");
  lines.push("  image: number;");
  lines.push("  width: number;");
  lines.push("  height: number;");
  lines.push("};");
  lines.push("");
  lines.push("export const hymns: Hymn[] = [");
  for (const hymn of hymns) {
    lines.push(
      `  { number: ${hymn.number}, title: ${JSON.stringify(hymn.title)}, image: require('${hymn.image}'), width: ${hymn.width}, height: ${hymn.height} },`
    );
  }
  lines.push("];");
  lines.push("");

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, lines.join("\n"));

  console.log(`gerar-hinos: ${hymns.length} hino(s) encontrado(s) em assets/hymns/`);
}

main();
