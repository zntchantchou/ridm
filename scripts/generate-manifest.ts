import { readdirSync, statSync, writeFileSync } from "fs";
import { join } from "path";

const MACHINES_DIR = "../public/samples/machines";
const OUTPUT_FILE = "../public/samples/manifest.json";
const MANIFEST_VERSION = "1.0.0";
const TYPE_LABELS: Record<string, string> = {
  bd: "Bass Drum",
  sd: "Snare Drum",
  hh: "Hi-Hat (Closed)",
  oh: "Open Hat",
  ht: "High Tom",
  mt: "Mid Tom",
  lt: "Low Tom",
  cp: "Clap",
  cb: "Cowbell",
  cr: "Crash",
  rim: "Rimshot",
  sh: "Shaker",
  perc: "Percussion",
  tb: "Tambourine",
  rd: "Ride",
  misc: "Miscellaneous",
  fx: "Effects",
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatMachineName(dirName: string): string {
  // Convert "RolandTR808" to "Roland TR-808"
  return dirName
    .replace(/([A-Z])/g, " $1")
    .replace(/(\d+)/g, " $1")
    .trim()
    .replace(/\s+/g, " ");
}

function generateFlatManifest() {
  const samples: any[] = [];

  const machinesDirs = readdirSync(MACHINES_DIR)
    .filter((name) => {
      const path = join(MACHINES_DIR, name);
      return (
        statSync(path).isDirectory() &&
        !name.startsWith(".") &&
        !name.includes("backup")
      );
    })
    .sort();

  for (const machineDir of machinesDirs) {
    const machinePath = join(MACHINES_DIR, machineDir);
    const machineSlug = slugify(machineDir);
    const machineName = formatMachineName(machineDir);

    const typeDirs = readdirSync(machinePath)
      .filter((name) => {
        const path = join(machinePath, name);
        return statSync(path).isDirectory() && !name.startsWith(".");
      })
      .sort();

    for (const typeDir of typeDirs) {
      const typePath = join(machinePath, typeDir);
      const typeLabel = TYPE_LABELS[typeDir] || typeDir.toUpperCase();

      const sampleFiles = readdirSync(typePath)
        .filter((file) => file.endsWith(".WAV") || file.endsWith(".wav"))
        .sort();

      sampleFiles.forEach((file, index) => {
        const id = `${machineSlug}_${typeDir}_${index.toString().padStart(2, "0")}`;
        const path = `${machineDir}/${typeDir}/${file}`;

        samples.push({
          id,
          file,
          path,
          machine: machineSlug,
          machineName,
          type: typeDir,
          typeLabel,
        });
      });
    }
  }
  // Optional: Generate summary statistics
  const machineStats = samples.reduce(
    (acc, s) => {
      acc[s.machine] = (acc[s.machine] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const typeStats = samples.reduce(
    (acc, s) => {
      acc[s.type] = (acc[s.type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const manifest = {
    version: MANIFEST_VERSION,
    generated: new Date().toISOString(),
    manifestId: `ridm-samples-${new Date().toISOString().split("T")[0]}`,
    totalSamples: samples.length,
    samples,
    types: typeStats,
    machines: machineStats,
  };
  console.log("MANIFEST ", manifest);
  writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`Generated flat manifest with ${samples.length} samples`);

  console.log(`✓ ${Object.keys(machineStats).length} machines`);
  console.log(`✓ ${Object.keys(typeStats).length} types`);
}

generateFlatManifest();
