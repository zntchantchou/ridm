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

  constructor({ steps, isLead }: PulseOptions) {
    this.steps = steps;
    if (isLead) this.lead = isLead;
  }

  /** adds one to the number of steppers currently listening */
  increment() {
    this.count++;
    console.log("[Increment] ", this.count, " steps: ", this.steps);
  }

  addSub(pulse: Pulse) {
    this.subs.push(pulse);
  }

  promote() {
    this.lead = true;
    console.log("[PROMOTED] ", this);
  }

  /** set lead to false */
  demote() {
    console.log("[DEMOTED] ", this);
    this.lead = false;
    this.clearSubs();
  }

  clearSubs() {
    console.log("[clearSup] ", this);
    this.subs = [];
  }
}

export default Pulse;
