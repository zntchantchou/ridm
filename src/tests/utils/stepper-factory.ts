import StepperMock, {
  type StepperColorType,
} from "../mocks/Stepper.mock.ts";

export interface StepperFactoryOptions {
  beats?: number;
  stepsPerBeat?: number;
  id?: number;
  sampleName?: string;
  color?: StepperColorType;
}

const DEFAULT_COLORS: StepperColorType[] = [
  { name: "blue", cssColor: "#00d0ff" },
  { name: "purple", cssColor: "#9c37fb" },
  { name: "yellow", cssColor: "#eeff04" },
  { name: "green", cssColor: "#00ff00" },
  { name: "red", cssColor: "#ff0000" },
];

const DEFAULT_SAMPLE_NAMES = ["bd", "sd", "hh", "lt", "kk"];

let stepperIdCounter = 0;

export function resetStepperIdCounter(): void {
  stepperIdCounter = 0;
}

export function createStepper(
  options: StepperFactoryOptions = {}
): StepperMock {
  const id = options.id ?? stepperIdCounter++;
  const colorIndex = id % DEFAULT_COLORS.length;
  const sampleIndex = id % DEFAULT_SAMPLE_NAMES.length;

  return new StepperMock({
    beats: options.beats ?? 4,
    stepsPerBeat: options.stepsPerBeat ?? 4,
    id,
    sampleName: options.sampleName ?? DEFAULT_SAMPLE_NAMES[sampleIndex],
    color: options.color ?? DEFAULT_COLORS[colorIndex],
  });
}

export function createStepperWithSteps(
  steps: number,
  options: Omit<StepperFactoryOptions, "beats" | "stepsPerBeat"> = {}
): StepperMock {
  return createStepper({
    beats: steps,
    stepsPerBeat: 1,
    ...options,
  });
}

export function createMultipleSteppers(
  count: number,
  options: StepperFactoryOptions = {}
): StepperMock[] {
  return Array.from({ length: count }, () => createStepper(options));
}
