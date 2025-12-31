import { filter, interval, Subscription, throttle } from "rxjs";
import Pulse from "./Pulse";
import Pulses from "./Pulses";
import Controls from "./Controls";
import type StepperControls from "./StepperControls";
import type Track from "./Track";

const steppersDiv = document.getElementById("steppers");
export type StepperColorType = { name: string; cssColor: string };
export interface StepperOptions {
  beats: number;
  stepsPerBeat: number;
  id: number;
  sampleName: string;
  color: StepperColorType;
  controls: StepperControls;
  track: Track;
}

class Stepper {
  id?: number;
  beats = 4;
  stepsPerBeat = 4;
  lastStep = -1;
  stepPickupRatio = 0;
  stepElements: HTMLDivElement[] = [];
  element: HTMLDivElement | null = null;
  pulseSubscription: Subscription | null = null;
  selectedSteps: boolean[] = Array(this.beats * this.stepsPerBeat).fill(false);
  controls: StepperControls | null = null;
  justUpdated = false;
  sampleName: string;
  color: StepperColorType | null = null;
  track?: Track;

  constructor({
    beats,
    stepsPerBeat,
    id,
    sampleName,
    controls,
    color,
    track,
  }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
    this.id = id;
    this.sampleName = sampleName;
    this.controls = controls;
    this.color = color;
    this.track = track;
    this.render();
  }

  listenToPulse(pulse: Pulse) {
    // console.log("LISTENTOPULSE ", pulse);
    this.pulseSubscription?.unsubscribe();
    this.pulseSubscription = pulse.currentStepSubject
      .pipe(
        filter(({ stepNumber, totalSteps }) =>
          this.isSelectedStep({ totalSteps, stepNumber })
        )
      ) // Only trigger if note is selected
      .pipe(throttle(() => interval(Controls.tpc / this.steps)))
      .subscribe({
        next: ({ time }) => this?.track?.playSample(time),
        complete: () => {
          console.log("[STEPPER] PULSE HAS COMPLETED");
        },
      });
  }

  private isSelectedStep({
    totalSteps,
    stepNumber,
  }: {
    totalSteps: number;
    stepNumber: number;
  }) {
    if (totalSteps === this.steps) return !!this.selectedSteps[stepNumber];
    const parentChildRatio = totalSteps / this.steps;
    const actualStep = stepNumber / parentChildRatio;
    return Number.isInteger(actualStep) && !!this.selectedSteps[actualStep];
  }
  stop() {
    this.pulseSubscription?.unsubscribe();
  }

  private updateSelectedSteps(targetSize: number) {
    const selectedSteps = this.getSelectedBeatAsNumber();
    const ratio = targetSize / this.steps;
    const updatedSteps = [];
    for (const step of selectedSteps) {
      if (step === 0) {
        updatedSteps.push(step);
        continue;
      }
      const nextSelectedStep = Math.floor(step * ratio);
      if (nextSelectedStep < 1) continue;
      updatedSteps.push(nextSelectedStep);
    }
    this.selectedSteps = this.convertNumbersToSteps(targetSize, updatedSteps);
  }

  updateBeats(beats: number) {
    const oldSteps = this.steps;
    this.updateSelectedSteps(this.stepsPerBeat * beats);
    this.beats = beats;
    Pulses.update(this, oldSteps, this.steps);
    this.updateUi();
  }

  updateSteps({
    beats,
    stepsPerBeat,
  }: {
    beats?: number;
    stepsPerBeat?: number;
  }) {
    const oldSteps = this.steps;
    if (stepsPerBeat) this.stepsPerBeat = stepsPerBeat;
    if (beats) this.beats = beats;
    this.updateSelectedSteps(this.beats * this.stepsPerBeat);
    Pulses.update(this, oldSteps, this.steps);
    this.updateUi();
    console.log("PULSES POST UPDATE", Pulses);
  }

  updateStepsPerBeat(spb: number) {
    console.log("PULSES POST UPDATE", Pulses);
    const oldSteps = this.steps;
    this.updateSelectedSteps(this.beats * spb);
    this.stepsPerBeat = spb;
    Pulses.update(this, oldSteps, this.steps);
    this.updateUi();
  }

  convertNumbersToSteps(targetSize: number, numbers: number[]) {
    if (!numbers.length) return [];
    const steps: boolean[] = Array(targetSize)
      .fill(false)
      .map((_, i) => numbers.includes(i));
    return steps;
  }

  getSelectedBeatAsNumber() {
    const selectedIndexes = [];
    for (const [index, selectedStep] of this.selectedSteps.entries()) {
      if (selectedStep) selectedIndexes.push(index);
    }
    return selectedIndexes;
  }

  updateUi() {
    if (!this.element?.hasChildNodes()) return;
    for (const child of this.stepElements) {
      this.element.removeChild(child);
    }
    this.createStepElements();
    for (const item of this.stepElements) {
      this.element.appendChild(item);
    }
  }

  private render() {
    this.createStepElements();
    const stepper = document.createElement("div");
    stepper.classList.add("stepper");
    stepper.dataset.stepperId = this.id?.toString();
    steppersDiv?.appendChild(stepper);
    for (const item of this.stepElements) {
      stepper.appendChild(item);
    }
    this.element = stepper;
    this.element.addEventListener("click", this.handleClick);
  }

  handleClick = (e: Event) => {
    const target = e.target as HTMLDivElement;
    const step = target.dataset.step;
    if (!step) return;
    // OTher guardrails here? runtime type check?
    this.toggleStep(parseInt(step));
  };

  private toggleStep(stepNumber: number) {
    const currentValue = this.selectedSteps[stepNumber];
    this.selectedSteps[stepNumber] = !currentValue;
    const step = this.stepElements[stepNumber];
    step.dataset.selected = currentValue ? "off" : "on"; // turn on or off
  }

  private createStepElements() {
    this.stepElements = Array(this.steps)
      .fill(null)
      .map((_, i) => {
        const element = document.createElement("div");
        element.classList.add("step");
        element.style.width = `calc(100% / ${this.steps})`;
        element.dataset.step = i.toString();
        element.dataset.steps = this.steps.toString();
        element.dataset.selected = this.selectedSteps[i] ? "on" : "off";
        element.dataset.stepperId = this.id?.toString();
        if (i % this.stepsPerBeat === 0) element.classList.add("beat");
        return element;
      });
  }

  get steps() {
    return this.stepsPerBeat * this.beats;
  }
}

export default Stepper;
