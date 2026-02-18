import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import type { StepperIdType } from "../../../state/state.types";
import "../StepperControls/StepperControls";
import "../Stepper/Stepper";
import State from "../../../state/State";

@customElement("rythm-panel")
export class RythmPanel extends LitElement {
  override createRenderRoot() {
    return this;
  }

  renderSteppers() {
    const steppers = State.getInitialStepperOptions().map((options, i) => {
      return html`<stepper-element
        stepsPerBeat="4"
        beats="4"
        stepperId=${i}
        .selectedSteps=${options.selectedSteps as boolean[]}
      ></stepper-element>`;
    });
    return html`${steppers}`;
  }

  renderStepperControls() {
    const controls = Array(8)
      .fill(null)
      .map((_, i) => {
        return html`<stepper-controls
          stepsPerBeat="4"
          beats="4"
          name="test"
          stepperId=${i as StepperIdType}
        ></stepper-controls>`;
      });
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

  static styles = css`
    rythm-panel {
      height: 50%;
      width: 100%;
      display: flex;
      flex-direction: row;
    }

    #content {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 0.6rem;
    }

    #stepper-controls {
      width: 30%;
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    #steppers {
      height: 100%;
      width: 70%;
      display: flex;
      flex-direction: column;
    }

    stepper-element {
      flex: 1;
      min-height: 0;
    }

    .stepper {
      /* distributes the 8 rows evenly in the column */
      width: 100%;
      height: 98%;
      box-sizing: content-box;
      margin-bottom: 4px;
      display: flex;
    }

    .step {
      border-radius: 2px;
      background-color: rgb(105, 105, 105);
      margin-right: 4px;
      flex: 1;
      cursor: pointer;
      opacity: 0.6;
      box-sizing: border-box;
    }

    .step.beat[data-selected="off"] {
      background-color: #b0b0b0;
    }
    .step[data-selected="on"] {
      opacity: 0.6;
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
  `;
}
