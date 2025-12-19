import Controls from "./Controls";
import StepQueue, { type Step } from "./StepQueue";
import Audio from "./Audio";

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
  nextNoteTime: number = 0;
  currentStep: number = 0;
  lastStep: number = -1;
  tps: number = 0;

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

    StepQueue.push({
      stepNumber: this.currentStep,
      time: this.nextNoteTime,
      totalSteps: this.steps,
    });

    // We need to emit an event to all steppers of this size, we send the current step
    // all steppers keep track of their "active" or "selected" steps in a dictionary accessible by number (array) for easy access
    // At each step, steppers are notified and will play if their sound is "active"
    // Performance: Do use audiotime to measure delays as we notify more steppers using observables

    // Eventually metronome will be possible to play for each pulse but OPTIONAL
    // Instead we must now decide how to trigger sounds to create rythms
    // A pulse can get its steppers since they are related via their totalSteps
    // But where to store all steppers at register
    // MARK A STEPPER STEP AS ACTIVE BY CLICKING (TOGGLE)
    // Start thinking about how to trigger a sound
    // Similar steppers with similar Pulses will have different "active steps" creating different sound patterns
    // GRAB ALL STEPPER WITH SAME TOTALSTEP
    // USE SUBS CHAIN TO FIND CHILDREN STEPPERS
    // ALL STEPPERS WHOSE CURRENT STEP IS ACTIVE SHOULD TRIGGER THEIR RESPECTIVE SOUNDS (if no two sounds are the same)
    Audio.playMetronome(this.currentStep, this.nextNoteTime, this.steps);
  }

  /** Delay the nextStepTime by timePerStep, updates the current step */
  next() {
    this.lastStep = this.currentStep;
    if (this.currentStep < this.steps - 1) {
      this.currentStep++;
    } else {
      this.currentStep = 0;
    }
    this.nextNoteTime += this.getTps(); // Adjust to current TPC
    // console.log("[Pulse] next ", this.nextNoteTime);
  }

  /** adds one to the number of steppers currently listening */
  increment() {
    this.count++;
    // console.log("[Increment] ", this.count, " steps: ", this.steps);
  }

  addSub(pulse: Pulse) {
    this.subs.push(pulse);
  }

  promote() {
    this.lead = true;
    // console.log("[PROMOTED] ", this);
  }

  /** set lead to false */
  demote() {
    // console.log("[DEMOTED] ", this);
    this.lead = false;
    this.clearSubs();
  }

  clearSubs() {
    // console.log("[clearSubs] ", this);
    this.subs = [];
  }

  getTps() {
    return Controls.tpc / this.steps;
  }

  get empty() {
    return this.subs.length === 0;
  }
  // getSteppers(): HTMLDivElement[] {
  //   // from the
  // }

  getCurrentStep(parentStep: Step) {
    const parentChildRatio = parentStep.totalSteps / this.steps;
    return Math.floor(parentStep.stepNumber / parentChildRatio);
  }

  getPrevStep(parentStep: Step) {
    const parentChildRatio = parentStep.totalSteps / this.steps;
    const prevStep =
      parentStep.stepNumber === 0
        ? //  should be total steps
          this.steps - 1
        : Math.floor(parentStep.stepNumber / parentChildRatio) - 1;
    return prevStep;
  }
}

export default Pulse;
