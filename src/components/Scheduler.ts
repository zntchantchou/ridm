import Stepper from "./Stepper";

class Scheduler {
  steppersMap = new Map<string, { steppers: Stepper[] }>();
}

export default new Scheduler();
