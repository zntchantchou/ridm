import type {
  Manifest,
  SampleDescriptor,
  SampleType,
} from "../types/samples.types";

const SAMPLES_DIR = "samples/machines";
const MANIFEST_PATH = "samples/manifest.json";

class SampleRegistry {
  private manifest?: Manifest;
  private sampleMap = new Map<string, SampleDescriptor>();
  private machineIndex = new Map<string, SampleDescriptor[]>();
  private typeIndex = new Map<SampleType, SampleDescriptor[]>();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    const response = await fetch(MANIFEST_PATH);
    this.manifest = await response.json();
    this.buildIndices();
    this.initialized = true;
  }

  private buildIndices(): void {
    if (!this.manifest) return;

    this.manifest.samples.forEach((sample) => {
      this.sampleMap.set(sample.id, sample);
    });

    this.manifest.samples.forEach((sample) => {
      if (!this.machineIndex.has(sample.machine)) {
        this.machineIndex.set(sample.machine, []);
      }
      this.machineIndex.get(sample.machine)!.push(sample);
    });

    this.manifest.samples.forEach((sample) => {
      if (!this.typeIndex.has(sample.type)) {
        this.typeIndex.set(sample.type, []);
      }
      this.typeIndex.get(sample.type)!.push(sample);
    });
  }

  resolve(id: string): SampleDescriptor | undefined {
    return this.sampleMap.get(id);
  }

  resolvePath(id: string): string | undefined {
    const sample = this.sampleMap.get(id);
    return sample ? `${SAMPLES_DIR}/${sample.path}` : undefined;
  }

  getSamplesByMachine(machineId: string): SampleDescriptor[] {
    return this.machineIndex.get(machineId) || [];
  }

  getSamplesByType(type: SampleType): SampleDescriptor[] {
    return this.typeIndex.get(type) || [];
  }

  getAllSamples() {
    return this.manifest?.samples;
  }

  search(query: string): SampleDescriptor[] {
    if (!this.manifest) return [];

    const lowerQuery = query.toLowerCase();
    return this.manifest.samples.filter(
      (s) =>
        s.machineName.toLowerCase().includes(lowerQuery) ||
        s.typeLabel.toLowerCase().includes(lowerQuery) ||
        s.file.toLowerCase().includes(lowerQuery),
    );
  }
  getMachines(): Array<{ id: string; name: string; count: number }> {
    return Array.from(this.machineIndex.entries())
      .map(([id, samples]) => ({
        id,
        name: samples[0].machineName,
        count: samples.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getTypes(): Array<{ id: string; label: string; count: number }> {
    return Array.from(this.typeIndex.entries())
      .map(([id, samples]) => ({
        id,
        label: samples[0].typeLabel,
        count: samples.length,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
}

export default new SampleRegistry();
