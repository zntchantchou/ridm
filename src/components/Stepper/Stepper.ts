import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { debounceTime, filter, tap, type Subscription } from "rxjs";
import type Track from "../../modules/Track";
// import type { StepperColorType } from "../Stepper";
import Audio from "../../modules/Audio";
import State from "../../state/State";
import type Pulse from "../../modules/Pulse";
import Controls from "../../modules/Controls";
import { ifDefined } from "lit/directives/if-defined.js";
import type { StepperIdType } from "../../state/state.types";

const DEBOUNCE_TIME_MS = 200;

@customElement("stepper-element")
export class Stepper extends LitElement {
  @property({ type: Number })
  stepperId?: number = 0;
  @property({ type: Number })
  beats = 4;
  @property({ type: Number })
  stepsPerBeat = 4;
  @property({ attribute: false })
  track?: Track;
  @property({ attribute: false })
  color?: string;
  @property({ attribute: false })
  selectedSteps: boolean[] = Array(this.steps).fill(false);

  pulseSubscription: Subscription | null = null;
  templateReloadSubscription: Subscription | null = null;
  resizeSubscription: Subscription | null = null;

  get steps() {
    return this.beats * this.stepsPerBeat;
  }

  override createRenderRoot() {
    return this; // no shadow root — children land in the real DOM
  }

  hasSelectedSteps() {
    return this.selectedSteps.includes(true);
  }

  private listenToClear() {
    State.stepperSelectedStepsSubject
      .pipe(filter(({ stepperId }) => stepperId === this.stepperId))
      .subscribe(({ selectedSteps }) => {
        if (!selectedSteps.includes(true) && this.hasSelectedSteps()) {
          this.selectedSteps = selectedSteps;
        }
      });
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.listenToResize();
    this.listenToClear();
    this.listenToTemplateReload();
  }

  private listenToTemplateReload() {
    this.templateReloadSubscription = State.templateReloadSubject.subscribe(
      () => {
        console.log("STEPPER: TEMPLATE RELOAD");
        this.handleReload();
      },
    );
  }

  disconnectedCallback(): void {
    this.resizeSubscription?.unsubscribe();
    this.templateReloadSubscription?.unsubscribe();
  }

  private listenToResize() {
    let currentVolume = Audio.getCurrentVolume() as number;
    this.resizeSubscription = State.stepperResizeSubject
      .pipe(
        tap(() => {
          State.steppersLoadingSubject.next(true);
        }),
      )
      .pipe(debounceTime(DEBOUNCE_TIME_MS))
      .pipe(filter(({ stepperId }) => stepperId === this.stepperId))
      .pipe(
        tap(() => {
          currentVolume = Audio.getCurrentVolume() as number;
          Audio.mute();
        }),
      )
      .subscribe(({ beats, stepsPerBeat }) => {
        this.updateSteps({ beats, stepsPerBeat });
        State.steppersLoadingSubject.next(false);
        Audio.setMasterVolume(currentVolume as number);
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

  listenToPulse(pulse: Pulse) {
    if (this.pulseSubscription) {
      this.pulseSubscription?.unsubscribe();
    }
    this.pulseSubscription = pulse.currentStepSubject
      // Only trigger if note is selected
      .pipe(
        filter(({ stepNumber, totalSteps }) =>
          this.isSelectedStep({ totalSteps, stepNumber }),
        ),
      )
      .pipe(
        tap(({ time }) => {
          try {
            this?.track?.playSample(time);
          } catch (e) {
            // an error related to tone.player note timing actually takes place here
            // it is non blocking but it does paint the console red...
            // the error is way worse when Tone.now is not added to the offset parameter in Tone.player.start()
            console.error("[Stepper] Error playing sample:", e);
            // Don't propagate the error - keep the subscription alive
          }
        }),
      )
      .subscribe();
  }

  private handleReload() {
    const options = State.getStepperOptions(this.stepperId as StepperIdType);
    console.log("[Stepper]: handleReload ", options);
    if (!options) return;
    if (Array.isArray(options?.selectedSteps))
      this.selectedSteps = options.selectedSteps;
    this.updateSteps({
      beats: options.beats,
      stepsPerBeat: options.stepsPerBeat,
    });
    this.requestUpdate();
  }

  updateSteps = async ({
    beats,
    stepsPerBeat,
  }: {
    beats?: number;
    stepsPerBeat?: number;
  }) => {
    let paused = false;
    if (Controls.isPlaying) {
      Controls.pause();
      paused = true;
      // Give browser a chance to repaint and show the loader
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    if (stepsPerBeat) this.stepsPerBeat = stepsPerBeat;
    if (beats) this.beats = beats;
    this.updateSelectedSteps(this.steps);
    if (paused) Controls.play();
  };

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

  convertNumbersToSteps(targetSize: number, numbers: number[]) {
    if (!numbers.length) return [];
    const steps: boolean[] = Array(targetSize)
      .fill(false)
      .map((_, i) => numbers.includes(i));
    return steps;
  }

  private getSelectedBeatAsNumber() {
    const selectedIndexes = [];
    for (const [index, selectedStep] of this.selectedSteps.entries()) {
      if (selectedStep) selectedIndexes.push(index);
    }
    return selectedIndexes;
  }

  private handleStepClick = (index: number) => {
    this.selectedSteps[index] = !this.selectedSteps[index];
    State.stepperSelectedStepsSubject.next({
      stepperId: this.stepperId as StepperIdType,
      selectedSteps: this.selectedSteps,
    });
    this.requestUpdate();
  };

  render() {
    const steps = Array(this.steps)
      .fill(null)
      .map((_, i) => {
        let classes = "step";
        if (i % this.stepsPerBeat === 0) {
          classes += " beat";
        }
        return html`<div
          class=${classes}
          data-selected=${this.selectedSteps[i] ? "on" : "off"}
          data-stepper-id=${ifDefined(this.stepperId)}
          data-steps=${this.steps}
          data-step=${i}
          data-ticking="off"
          @click=${() => this.handleStepClick(i)}
        ></div>`;
      });
    return html`<div
      class="stepper"
      data-stepper-id=${ifDefined(this.stepperId)}
    >
      ${steps}
    </div>`;
  }

  static styles = css`
    .step:active {
      animation: bounce 0.3s ease-in-out;
    }
    .step.beat[data-selected="off"] {
      background-color: #b0b0b0;
    }
    .step[data-selected="on"] {
      opacity: 0.6;
    }
    .step[data-ticking="on"][data-selected="on"] {
      animation: bounce 0.25s ease-in-out;
      opacity: 1;
    }
    [data-ticking="on"] {
      background-color: #f3ef94;
    }
    .step.beat[data-ticking="on"] {
      background-color: rgb(174, 229, 36);
    }

    .step[data-selected="on"][data-stepper-id="0"] {
      background-color: var(--color-0);
    }
    .step[data-selected="on"][data-stepper-id="1"] {
      background-color: var(--color-1);
    }
    .step[data-selected="on"][data-stepper-id="2"] {
      background-color: var(--color-2);
    }
    .step[data-selected="on"][data-stepper-id="3"] {
      background-color: var(--color-3);
    }
    .step[data-selected="on"][data-stepper-id="4"] {
      background-color: var(--color-4);
    }
    .step[data-selected="on"][data-stepper-id="5"] {
      background-color: var(--color-5);
    }
    .step[data-selected="on"][data-stepper-id="6"] {
      background-color: var(--color-6);
    }
    .step[data-selected="on"][data-stepper-id="7"] {
      background-color: var(--color-7);
    }

    :root {
      --ring-width: 14%;
      --ring-space: 20%;
      --color-0: #0099ff; /* Cyan */
      --color-1: #b655ff; /* Hot Red */
      --color-2: #ffff00; /* Yellow */
      --color-3: #99ff00; /* Lime */
      --color-4: #ff7fff; /* Pink */
      --color-5: #ff6600ff; /* Orange */
      --color-6: #00ffff; /* Sky Blue */
      --color-7: #ff0066 /* salmon */;
    }
  `;
}
