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

  /** try to discover next steps to add within the buffer's window (nextNoteWindowMs) */
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
    Audio.playMetronome(this.currentStep, this.nextNoteTime);
    // create own metronome based on steps and beatsPerStep
    // play the audio
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
    console.log("[Pulse] next ", this.nextNoteTime);
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
