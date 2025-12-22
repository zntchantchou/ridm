import Controls from "./Controls";
import StepQueue, { type Step } from "./StepQueue";
import { BehaviorSubject } from "rxjs";

type PulseOptions = { steps: number; isLead?: boolean };

/** A pulse is created for each existing stepper size */
class Pulse {
  steps: number = 0;
  /** What pulses depend on this pulse, should be empty if lead is false */
  subs: Pulse[] = [];
  /** How many steppers currently listen to this pulse */
  count: number = 1;
  /** Only leads have subs that listen to them */
  lead: boolean = false;
  private nextNoteTime: number = 0;
  private currentStep: number = 0;
  tps: number = 0;
  /** Source of the currently active step for all steppers to use */
  currentStepSubject = new BehaviorSubject({
    time: this.nextNoteTime,
    totalSteps: this.steps,
    stepNumber: this.currentStep,
  });

  constructor({ steps, isLead }: PulseOptions) {
    this.steps = steps;
    this.tps = Controls.tpc / steps;
    if (isLead) this.lead = isLead;
    // console.log("PULSE ", this);
  }

  /** look to discover next steps to add within the buffer's window (nextNoteWindowMs) */
  discover(audioContextTime: number, discoverWindow: number) {
    // console.log("[Pulse] discover ", audioContextTime);
    while (this.nextNoteTime < audioContextTime + discoverWindow) {
      this.pulsate();
      this.next();
    }
  }

  /** Queue the next step for this pulse */
  pulsate() {
    console.log("[Pulse] pulsate");
    // if (!Controls.isPlaying) {
    //   console.log("[Pulse] pulsate aborted");
    //   return;
    // }
    const nextStep = {
      stepNumber: this.currentStep,
      time: this.nextNoteTime,
      totalSteps: this.steps,
    };

    StepQueue.push(nextStep); // Consumed by UI
    console.log("NEXT STEP ", nextStep);
    this.currentStepSubject.next(nextStep); // Consumed by steppers => audio
  }

  /** Delay the nextStepTime by timePerStep, updates the current step */
  next() {
    if (this.currentStep < this.steps - 1) {
      this.currentStep++;
    } else {
      this.currentStep = 0;
    }
    this.nextNoteTime += this.getTps(); // Adjust to current TPC
  }

  /** adds one to the number of steppers currently listening */
  increment() {
    this.count++;
  }
  /** adds one to the number of steppers currently listening */
  decrement() {
    this.count--;
  }

  addSub(pulse: Pulse) {
    this.subs.push(pulse);
  }

  promote() {
    this.lead = true;
  }

  /** set lead to false */
  demote() {
    this.lead = false;
    this.clearSubs();
    this.currentStepSubject.complete();
  }

  clearSubs() {
    this.subs = [];
  }

  getTps() {
    return Controls.tpc / this.steps;
  }

  get empty() {
    return this.subs.length === 0;
  }

  /** calculate sub pulse current step based on its parent */
  getCurrentStep(parentStep: Step) {
    const parentChildRatio = parentStep.totalSteps / this.steps;
    return Math.floor(parentStep.stepNumber / parentChildRatio);
  }

  /** calculate sub pulse previous step based on its parent */
  getPrevStep(parentStep: Step) {
    const parentChildRatio = parentStep.totalSteps / this.steps;
    const prevStep =
      parentStep.stepNumber === 0
        ? this.steps - 1
        : Math.floor(parentStep.stepNumber / parentChildRatio) - 1;
    return prevStep;
  }
}

export default Pulse;
