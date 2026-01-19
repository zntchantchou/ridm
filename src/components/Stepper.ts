import { debounceTime, filter, Subscription } from "rxjs";
import Pulse from "../modules/Pulse";
import Pulses from "../modules/Pulses";
import type Track from "../modules/Track";
import Controls from "./Controls";
import type StepperControls from "./StepperControls";
import type { StepperIdType } from "../state/state.types";
import State from "../state/State";
import Audio from "../modules/Audio";

const DEBOUNCE_TIME_MS = 200;
const steppersDiv = document.getElementById("steppers");

export type StepperColorType = { name: string; cssColor: string };
export interface StepperOptions {
  beats: number;
  stepsPerBeat: number;
  id: StepperIdType;
  sampleName: string;
  color: StepperColorType;
  controls?: StepperControls;
  track?: Track;
  selectedSteps?: boolean[];
}

class Stepper {
  id?: StepperIdType;
  beats = 4;
  stepsPerBeat = 4;
  lastStep = -1;
  stepPickupRatio = 0;
  stepElements: HTMLDivElement[] = [];
  element: HTMLDivElement | null = null;
  pulseSubscription: Subscription | null = null;
  selectedSteps: boolean[] = Array(this.steps * this.stepsPerBeat).fill(false);
  controls: StepperControls | null = null;
  justUpdated = false;
  sampleName: string;
  color: StepperColorType | null = null;
  track?: Track;
  lastTime?: number;

  constructor({
    beats,
    stepsPerBeat,
    id,
    sampleName,
    controls,
    color,
    track,
    selectedSteps,
  }: StepperOptions) {
    this.beats = beats;
    this.stepsPerBeat = stepsPerBeat;
    this.id = id;
    this.sampleName = sampleName;
    this.color = color;
    this.track = track;
    if (selectedSteps) this.selectedSteps = selectedSteps;
    if (controls) this.controls = controls;
    this.listenToResize();
    this.listenToClear();
    this.render();
  }

  private listenToResize() {
    State.stepperResizeSubject
      .pipe(debounceTime(DEBOUNCE_TIME_MS))
      .pipe(filter(({ stepperId }) => stepperId === this.id))
      .subscribe(({ beats, stepsPerBeat }) =>
        this.updateSteps({ beats, stepsPerBeat }),
      );
  }

  listenToPulse(pulse: Pulse) {
    this.pulseSubscription?.unsubscribe();
    this.pulseSubscription = pulse.currentStepSubject
      .pipe(
        filter(
          ({ stepNumber, totalSteps }) =>
            this.isSelectedStep({ totalSteps, stepNumber }), // Only trigger if note is selected
        ),
      )
      .pipe(
        filter(
          ({ time }) => Audio.lastTime == undefined || time > Audio.lastTime,
        ),
      )
      .subscribe({
        next: ({ time }) => {
          console.log("PLAY sample ", time);
          this?.track?.playSample(time);
          this.lastTime = time;
        },
      });
  }

  private listenToClear() {
    State.stepperSelectedStepsSubject
      .pipe(filter(({ stepperId }) => stepperId === this.id))
      .subscribe(({ selectedSteps }) => {
        if (!selectedSteps.includes(true) && this.hasSelectedSteps()) {
          this.selectedSteps = selectedSteps;
          this.updateUi();
        }
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

  updateSteps = async ({
    beats,
    stepsPerBeat,
  }: {
    beats?: number;
    stepsPerBeat?: number;
  }) => {
    State.steppersLoadingSubject.next(true);
    let paused = false;
    if (Controls.isPlaying) {
      Controls.pause();
      paused = true;
      // Give browser a chance to repaint and show the loader
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const oldSteps = this.steps;
    if (stepsPerBeat) this.stepsPerBeat = stepsPerBeat;
    if (beats) this.beats = beats;
    this.updateSelectedSteps(this.steps);
    // Heavy synchronous operation - but now loader is visible
    Pulses.update(this, oldSteps, this.steps);
    this.updateUi();
    if (paused) Controls.play();
    State.steppersLoadingSubject.next(false);
  };

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
    console.log("UPDATE UI ");
    if (!this.element?.hasChildNodes()) return;
    this.createStepElements();
    while (this.element.lastElementChild) {
      this.element.removeChild(this.element.lastElementChild);
    }
    this.element.append(...this.stepElements);
    this.updateStepsBorder();
  }

  private updateStepsBorder() {
    const borderWidth = this.steps > 50 ? "1px" : "3px";
    const borderRadius = this.steps > 50 ? "2px" : "4px";
    for (const item of this.stepElements) {
      item.style.borderWidth = borderWidth;
      item.style.borderRadius = borderRadius;
    }
  }

  private render() {
    console.log("stepper render ");
    this.createStepElements();
    const stepper = document.createElement("div");
    stepper.classList.add("stepper");
    stepper.dataset.stepperId = this.id?.toString();
    steppersDiv?.appendChild(stepper);
    this.updateStepsBorder();
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

  hasSelectedSteps() {
    return this.selectedSteps.includes(true);
  }

  private toggleStep(stepNumber: number) {
    const currentValue = this.selectedSteps[stepNumber];
    this.selectedSteps[stepNumber] = !currentValue;
    const step = this.stepElements[stepNumber];
    step.dataset.selected = currentValue ? "off" : "on"; // turn on or off

    // Notify State of the change
    if (this.id !== undefined) {
      State.stepperSelectedStepsSubject.next({
        stepperId: this.id,
        selectedSteps: this.selectedSteps,
      });
    }
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

  clear() {
    this.selectedSteps = Array(this.steps).fill(false);
  }

  get steps() {
    return this.stepsPerBeat * this.beats;
  }
}

export default Stepper;
