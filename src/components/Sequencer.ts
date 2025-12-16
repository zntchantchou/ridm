import Stepper from "./Stepper";
import type { BeatMapType } from "./types";
class Sequencer {
  steppers: Stepper[] = [];
  steppersMap: BeatMapType = new Map<string, { steppers: Stepper[] }>();
  register(stepper: Stepper) {
    this.steppers.push(stepper);
    const existingBeat = this.steppersMap.get(stepper.steps.toString());
    if (!existingBeat) {
      this.steppersMap.set(stepper.steps.toString(), {
        steppers: [stepper],
      });
      return;
    }
    this.steppersMap.set(stepper.steps.toString(), {
      steppers: [...existingBeat.steppers, stepper],
    });
    console.log("steppersMap ", this.steppersMap);
    return;
  }

  removeStepper(stepper: Stepper) {
    console.log("[Sequencer]", stepper);
  }
}

export default new Sequencer();
