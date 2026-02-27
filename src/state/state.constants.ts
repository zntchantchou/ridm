import type { StepperColorType } from "../types";
import type { ChannelOptions, Effect, Settings } from "./state.types";
import { generateEmptySteps } from "./state.utils";

export const COLORS: StepperColorType[] = [
  {
    name: "skyBlue",
    cssColor: "#0099ff",
  },
  {
    name: "hotPink",
    cssColor: "#b655ff",
  },
  {
    name: "yellow",
    cssColor: "#ffff00",
  },
  {
    name: "chartreuse",
    cssColor: "#99ff00",
  },
  {
    name: "magenta",
    cssColor: "#ff7fff",
  },
  {
    name: "orange",
    cssColor: "#ff4500",
  },

  {
    name: "cyan",
    cssColor: "#00ffff",
  },
  {
    name: "purple",
    cssColor: "#ff0066",
  },
];

export const SAMPLES_DIRS = [
  {
    name: "01",
    path: "bd.wav",
  },
  {
    name: "02",
    path: "sd.wav",
  },
  {
    name: "03",
    path: "hh.wav",
  },
  {
    name: "04",
    path: "oh.wav",
  },
  {
    name: "05",
    path: "ht.wav",
  },
  {
    name: "06",
    path: "bo.wav",
  },
  {
    name: "07",
    path: "sh.wav",
  },
  {
    name: "08",
    path: "cp.wav",
  },
];

export const DEFAULT_STEPPER_OPTIONS = {
  beats: 4,
  stepsPerBeat: 4,
  selectedSteps: generateEmptySteps({ stepsPerBeat: 4, beats: 4 }),
};

export const DEFAULT_CHANNEL_OPTIONS: ChannelOptions = {
  volume: 10,
  pan: 0,
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
];

export const INITIAL_CHANNEL_OPTIONS = {
  pan: 0,
  volume: 0,
  mute: false,
  solo: false,
};

export const INITIAL_SETTINGS: Settings = {
  tpc: 3.7,
  volume: -10,
  selectedStepperId: 0,
};
export const MIN_VOLUME_DB = -80;
export const MAX_VOLUME_DB = 10;
export const DEFAULT_STEPPER_BORDER_COLOR = "rgb(80, 80, 80)";
export const DEBOUNCE_TIME_MS = 200;
