// Union type for all sample types
export type SampleType =
  | "bd" // Bass Drum
  | "sd" // Snare Drum
  | "hh" // Hi-Hat (Closed)
  | "oh" // Open Hat
  | "ht" // High Tom
  | "mt" // Mid Tom
  | "lt" // Low Tom
  | "cp" // Clap
  | "cb" // Cowbell
  | "cr" // Crash
  | "rim" // Rimshot
  | "sh" // Shaker
  | "perc" // Percussion
  | "tb" // Tambourine
  | "rd" // Ride
  | "misc" // Miscellaneous
  | "fx"; // Effects

export type Manifest = {
  version: string;
  generated: string;
  manifestId: string;
  totalSamples: number;
  samples: SampleDescriptor[];
  meta?: {
    machines: Array<{ id: string; name: string; sampleCount: number }>;
    types: Array<{ id: string; label: string; sampleCount: number }>;
  };
};

// Sample descriptor (matches what's in manifest)
export type SampleDescriptor = {
  id: string; // "rolandtr808_bd_00"
  file: string; // "BD0000.WAV"
  path: string; // "RolandTR808/bd/BD0000.WAV"
  machine: string; // "rolandtr808"
  machineName: string; // "Roland TR-808"
  type: SampleType; // "bd"
  typeLabel: string; // "Bass Drum"
};
