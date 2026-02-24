import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import type { StepperIdType } from "../../../state/state.types";
import State from "../../../state/State";
import "../Toggle/Toggle";
import "../Counter/Counter";

@customElement("stepper-controls")
export class StepperControlsElement extends LitElement {
  @property({ type: Number }) stepperId: StepperIdType = 0;
  @property({ type: Number }) stepsPerBeats = 4;
  @property({ type: Number }) beats = 4;
  @property({ type: String }) name = "";
  @property({ type: String }) color = "";

  private handleClick = () => {
    State.currentStepperIdSubject.next(this.stepperId as StepperIdType);
  };

  private handleSolo = (v: boolean) => {
    State.channelUpdateSubject.next({
      stepperId: this.stepperId as StepperIdType,
      channelOptions: { solo: v },
    });
  };

  private handleMute = (v: boolean) => {
    State.channelUpdateSubject.next({
      stepperId: this.stepperId as StepperIdType,
      channelOptions: { mute: v },
    });
  };

  private handleClear = () => {
    State.stepperSelectedStepsSubject.next({
      stepperId: this.stepperId,
      selectedSteps: Array(this.stepsPerBeats * this.beats).fill(false),
    });
  };

  private handleStepsUpdate = (value: number) => {
    State.stepperResizeSubject.next({
      stepsPerBeat: value,
      oldSteps: this.steps,
      stepperId: this.stepperId,
    });
    this.stepsPerBeats = value;
  };

  private handleBeatsUpdate = (value: number) => {
    State.stepperResizeSubject.next({
      beats: value,
      oldSteps: this.steps,
      stepperId: this.stepperId,
    });
    this.beats = value;
  };

  get steps() {
    return this.stepsPerBeats * this.beats;
  }
  render() {
    return html`
      <div
        class="stepper-controls"
        data-stepper-id=${this.stepperId}
        data-selected="off"
        @click=${this.handleClick}
      >
        <div class="stepper-info-container">
          <span class="stepperControlName">${this.name}</span>
        </div>
        <div class="solo-mute-container">
          <toggle-element
            text="M"
            color=${this.color}
            .onClick=${this.handleMute}
          ></toggle-element>
          <toggle-element
            text="S"
            color=${this.color}
            .onClick=${this.handleSolo}
          ></toggle-element>
        </div>
        <div class="stepper-resize-container">
          <span>BEATS</span>
          <counter-element
            .value=${this.beats}
            .min=${2}
            .max=${10}
            .onChange=${this.handleBeatsUpdate}
          ></counter-element>
          <span>STEPS</span>
          <counter-element
            .value=${this.stepsPerBeats}
            .min=${2}
            .max=${10}
            .onChange=${this.handleStepsUpdate}
          ></counter-element>
        </div>
        <div class="delete-container">
          <div class="clear-btn" @click=${this.handleClear}>clear</div>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      display: flex;
      height: 100%;
      cursor: pointer;
    }

    .stepper-controls {
      display: flex;
      background-color: rgb(59, 58, 58);
      box-sizing: border-box;
      color: white;
      border-left: 0.5rem solid transparent;
      border-radius: 4px;
      border-bottom: 2px solid black;
      height: 100%;
      width: 100%;
      margin-right: 0.4rem;
    }

    .stepper-controls span {
      box-sizing: border-box;
    }

    .solo-mute-container,
    .stepper-info-container,
    .stepper-resize-container,
    .delete-container {
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      height: 100%;
      font-size: 0.8rem;
    }

    .stepper-info-container {
      flex: 1;
    }

    .solo-mute-container {
      flex: 2;
    }

    .stepper-resize-container {
      flex: 8;
    }

    .delete-container {
      flex: 1;
    }

    .clear-btn {
      background-color: rgb(28, 28, 28);
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      font-size: 0.6rem;
      justify-content: center;
      align-items: center;
      height: 2rem;
      width: 2rem;
    }

    .clear-btn:active {
      animation: bounce 0.3s ease-in-out;
    }

    .clear-btn:hover:active {
      background-color: rgb(133, 133, 133);
      animation: bounce 0.3s ease-in-out;
    }

    .clear-btn span {
      text-align: center;
    }

    .clear-btn:hover {
      color: rgb(38, 38, 38);
      background-color: rgb(255, 255, 255);
    }

    .clear-btn img {
      width: 100%;
      height: 100%;
    }
  `;
}
