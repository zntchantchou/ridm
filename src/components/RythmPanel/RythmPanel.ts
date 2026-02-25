import { html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";
import "../StepperControls/StepperControls";
import "../Stepper/Stepper";
import State from "../../state/State";
import type { Subscription } from "rxjs";

@customElement("rythm-panel")
export class RythmPanel extends LitElement {
  @state()
  selectedStepperId = 0;
  @state()
  currentStepperIdSubscription: Subscription | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.currentStepperIdSubscription = State.currentStepperIdSubject.subscribe(
      (id) => {
        this.selectedStepperId = id;
      },
    );
  }

  disconnectedCallback(): void {
    this.currentStepperIdSubscription?.unsubscribe();
  }

  override createRenderRoot() {
    return this;
  }

  renderSteppers() {
    const steppers = State.getInitialStepperOptions().map(
      ({ id, beats, stepsPerBeat, selectedSteps }) => {
        return html`<stepper-element
          stepsPerBeat=${stepsPerBeat}
          beats=${beats}
          stepperId=${id}
          .selectedSteps=${selectedSteps as boolean[]}
        ></stepper-element>`;
      },
    );
    return html`${steppers}`;
  }

  renderStepperControls() {
    const controls = State.getInitialStepperOptions().map(
      ({ id, beats, stepsPerBeat, sampleName, color }) => {
        return html`<stepper-controls
          stepsPerBeat=${stepsPerBeat}
          beats=${beats}
          name=${sampleName}
          stepperId=${id}
          color=${color.cssColor}
          ?selected=${id === this.selectedStepperId}
        ></stepper-controls>`;
      },
    );
    return html`${controls}`;
  }

  render() {
    return html`
      <div id="content">
        <div id="stepper-controls">${this.renderStepperControls()}</div>
        <div id="steppers">${this.renderSteppers()}</div>
      </div>
    `;
  }
}
