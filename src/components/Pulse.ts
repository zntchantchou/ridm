import Controls from "./Controls";
import StepQueue from "./StepQueue";
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
  lastStep: number = 0;
  tps: number = 0;

  constructor({ steps, isLead }: PulseOptions) {
    this.steps = steps;
    this.tps = Controls.tpc / steps;
    if (isLead) this.lead = isLead;
    console.log("PULSE ", this);
  }

  /** try to discover next steps to add within the buffer's window (nextNoteWindowMs) */
  discover(audioContextTime: number, discoverWindow: number) {
    console.log("[Pulse] discover");
    while (this.nextNoteTime < audioContextTime + discoverWindow) {
      this.pulsate();
      this.next(discoverWindow);
    }
  }

  /** Queue the next step for this pulse */
  pulsate() {
    console.log("[Pulse] pulsate", this);
    StepQueue.push({
      stepNumber: this.currentStep,
      time: this.nextNoteTime,
      totalSteps: this.steps,
    });
    Audio.playMetronome(this.currentStep, this.nextNoteTime);
    // play the audio
  }

  /** Delay the nextStepTime by timePerStep, updates the current step */
  next(discoverWindow: number) {
    this.lastStep = this.currentStep;
    if (this.currentStep < this.steps - 1) {
      this.currentStep++;
    } else {
      this.currentStep = 0;
    }
    this.nextNoteTime += discoverWindow;
    console.log("[Pulse] next ");
  }

  /** adds one to the number of steppers currently listening */
  increment() {
    this.count++;
    // console.log("[Increment] ", this.count, " steps: ", this.steps);
  }

  addSub(pulse: Pulse) {
    if (!this.subs) console.error("THIS IS THE BIG ERROR >>>>>>>>>< ", this);
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

  get empty() {
    return this.subs.length === 0;
  }
}

export default Pulse;
