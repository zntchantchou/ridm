import { generateBlankSteps } from "./state.utils";

export const CROWDED_STEPPER_OPTIONS = {
  beats: 4,
  stepsPerBeat: 4,
  selectedSteps: generateBlankSteps({ stepsPerBeat: 4, beats: 4 }),
};

export const generateStepperOptions = () => {
  const generate = () => Math.ceil(Math.random() * 8);
  const beats = generate();
  const stepsPerBeat = generate();
  return {
    beats,
    stepsPerBeat,
    selectedSteps: generateBlankSteps({ stepsPerBeat, beats }),
  };
};
