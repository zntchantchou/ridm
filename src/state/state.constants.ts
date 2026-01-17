import type { StepperColorType } from "../components/Stepper";
import type { Effect, Settings } from "./state.types";
import { generateRandomSteps } from "./state.utils";

export const COLORS: StepperColorType[] = [
  {
    name: "cyan",
    cssColor: "#00ffff",
  },
  {
    name: "hotPink",
    cssColor: "#ff0066",
  },
  {
    name: "yellow",
    cssColor: "#ffff00",
  },
  {
    name: "lime",
    cssColor: "#00ff00",
  },
  {
    name: "orange",
    cssColor: "#ff6600",
  },
  {
    name: "skyBlue",
    cssColor: "#0099ff",
  },
  {
    name: "magenta",
    cssColor: "#ff00ff",
  },
  {
    name: "chartreuse",
    cssColor: "#99ff00",
  },
];

// [
//   {
//     name: "blue",
//     cssColor: "#00d0ff",
//   },
//   {
//     name: "purple",
//     cssColor: "#9c37fb",
//   },
//   {
//     name: "yellow",
//     cssColor: "#eeff04",
//   },
//   {
//     name: "pink",
//     cssColor: "#ff0ae6",
//   },
//   {
//     name: "green",
//     cssColor: "#2eff04",
//   },
//   {
//     name: "orange",
//     cssColor: "#ff9204",
//   },
//   {
//     name: "palePink",
//     cssColor: "#feaaff",
//   },

//   {
//     name: "red",
//     cssColor: "#ff2929",
//   },
// ];

export const SAMPLES_DIRS = [
  {
    name: "bd",
    path: "bd.wav",
  },
  {
    name: "sd",
    path: "sd.wav",
  },
  {
    name: "hh",
    path: "hh.wav",
  },
  {
    name: "oh",
    path: "oh.wav",
  },
  {
    name: "ht",
    path: "ht.wav",
  },
  {
    name: "bo",
    path: "bo.wav",
  },
  {
    name: "sh",
    path: "sh.wav",
  },
  {
    name: "cp",
    path: "cp.wav",
  },
  {
    name: "rs",
    path: "rs.wav",
  },
];

export const DEFAULT_STEPPER_OPTIONS = {
  beats: 4,
  stepsPerBeat: 4,
  selectedSteps: generateRandomSteps({ stepsPerBeat: 4, beats: 4 }),
};

export const INITIAL_EFFECTS: Effect[] = [
  {
    name: "reverb",
    value: { decay: 0.001, preDelay: 0, wet: 0 },
  },
  {
    name: "pitch",
    value: { pitch: 0 },
  },
  {
    name: "delay",
    value: {
      delayTime: 0,
      feedback: 0,
      wet: 0,
    },
  },
  {
    name: "panning",
    value: {
      pan: 0,
    },
  },
  {
    name: "volume",
    value: {
      volume: 0,
    },
  },
];

export const INITIAL_SETTINGS: Settings = {
  tpc: 4,
  volume: -10,
  selectedStepperId: 0,
};

export const MIN_VOLUME_DB = -80;
export const MAX_VOLUME_DB = 10;
