import Stepper from "./Stepper";
import Timerworker from "../worker/Timerworker";
import type { BeatMapType } from "./types";
class Sequencer {
  steppers: Stepper[] = [];
  beatMap: BeatMapType = new Map<string, { steppers: Stepper[] }>();
  timeWorker: typeof Timerworker | undefined = undefined;
  constructor(tw: typeof Timerworker) {
    this.timeWorker = tw;
  }
  register(stepper: Stepper) {
    this.steppers.push(stepper);
    const existingBeat = this.beatMap.get(stepper.steps.toString());
    if (!existingBeat) {
      this.beatMap.set(stepper.steps.toString(), {
        steppers: [stepper],
      });
      return;
    }
    this.beatMap.set(stepper.steps.toString(), {
      steppers: [...existingBeat.steppers, stepper],
    });
    this.timeWorker?.updateBeatMap(this.beatMap);
    return;
  }

  removeStepper(stepper: Stepper) {
    console.log("[Sequencer]", stepper);
  }
}

export default Sequencer;
