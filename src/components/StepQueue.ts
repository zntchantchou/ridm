export interface Step {
  time: number;
  stepNumber: number;
  totalSteps: number;
}

class StepQueue {
  steps: Step[] = [];
  constructor() {
    console.log("[STEPQUEUE] created");
  }

  head() {
    return this.steps[0];
  }

  push(step: Step): void {
    this.steps.push(step);
  }

  pop() {
    const oldest = this.steps[0];
    this.steps.splice(0, 1);
    return oldest;
  }

  size() {
    return this.steps.length;
  }
}

export default new StepQueue();
