import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { fromEvent, Observable, Subscription, tap, throttleTime } from "rxjs";
import State from "../../../state/State";
import type { EffectNameType, IEffectValue } from "../../../types";
import type { StepperIdType } from "../../../state/state.types";
import type { StepperOptions } from "../../Stepper";

@customElement("knob-element")
export class KnobElement extends LitElement {
  @property({ type: String }) label = "";
  @property({ type: String }) id = "";
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Number }) size = 5;
  @property({ type: String }) fillColor = "#fff";
  @property({ type: String }) settingName: keyof IEffectValue = "wet";
  @property({ type: String }) effectName: EffectNameType = "delay";
  @property({ attribute: false }) onChange?: (
    value: string,
    name: keyof IEffectValue,
  ) => void;

  @state() private initialized = false;
  @state() private currentY = 0;
  @state() private lastRotation = 0;
  @state() private startY = 0;
  @state() private selectedStepperId: StepperIdType =
    State.getSelectedStepperId();

  private dragObs: Observable<Event> | null = null;
  private dragSubscription?: Subscription;
  private stateSubscription?: Subscription;
  private maxRotation = 140;
  private minRotation = 0;
  private velocity = 2;

  connectedCallback() {
    super.connectedCallback();
    this.initializeRotation();
    this.initializeEvents();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.cleanup();
  }

  private initializeRotation() {
    if (this.min >= 0) {
      this.maxRotation = this.maxRotation * 2;
      const rawMinRotation =
        this.min < 0 ? -this.maxRotation : -this.maxRotation / 2;
      const belowMinValues = this.min / this.max;
      const minAngle = this.maxRotation * belowMinValues;
      this.minRotation = rawMinRotation + minAngle;
    } else {
      this.minRotation = -this.maxRotation;
    }
    if (this.min >= 0) {
      this.lastRotation = Math.round(
        (this.value / this.max) * this.maxRotation,
      );
    }
  }

  private initializeEvents() {
    this.dragObs = fromEvent(document, "pointermove");
    this.stateSubscription = State.currentStepperIdSubject
      .pipe(tap(this.setRingColor))
      .subscribe(this.handleSelectedStepperChange);
  }

  private cleanup() {
    this.dragSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
    document.removeEventListener("pointermove", this.handleMove);
    document.removeEventListener("pointerup", this.handleRelease);
  }

  private setRingColor = (id: StepperIdType) => {
    const color = State.getStepperOptions(id) as StepperOptions;
    this.fillColor = color.color.cssColor;
  };

  private handleSelectedStepperChange = (currentStepId: StepperIdType) => {
    this.selectedStepperId = currentStepId;
    const effect = State.getEffect({
      trackId: currentStepId,
      name: this.effectName,
    });
    const value = effect?.value as IEffectValue;
    const settingValue = value[this.settingName as keyof IEffectValue];
    this.value = settingValue as number;
    this.initialized = false;
    this.updatePosition();
    this.initialized = true;
    this.requestUpdate();
  };

  private handleClick = (e: PointerEvent) => {
    document.addEventListener("pointermove", this.handleMove);
    document.addEventListener("pointerup", this.handleRelease);
    this.dragSubscription = this.dragObs
      ?.pipe(throttleTime(100))
      .subscribe(() => this.triggerUpdate());
    this.startY = e.clientY;
  };

  private triggerUpdate = () => {
    if (this.settingName && this.onChange) {
      this.onChange(this.getValue(), this.settingName);
    }
  };

  private updatePosition() {
    const value = this.initialized ? parseFloat(this.getValue()) : this.value;
    const ratio = value ? value / this.max : value;
    const angle = this.maxRotation * ratio;
    // const rotation = this.min >= 0 ? angle - this.maxRotation / 2 : angle;
    this.currentY = angle;
    this.requestUpdate();
  }

  private handleMove = ({ clientY }: PointerEvent) => {
    const delta = this.startY - clientY;
    this.currentY = this.lastRotation + delta * this.velocity;
    if (this.currentY > this.maxRotation) {
      this.currentY = this.maxRotation;
    } else if (this.currentY <= this.minRotation) {
      this.currentY = this.minRotation;
    }
    this.updatePosition();
  };

  private handleRelease = () => {
    this.lastRotation = this.currentY;
    this.dragSubscription?.unsubscribe();
    this.dragObs = null;
    document.removeEventListener("pointermove", this.handleMove);
    document.removeEventListener("pointerup", this.handleRelease);
    this.triggerUpdate();
    this.requestUpdate();
  };

  private getValue() {
    if (!this.initialized) return this.value.toString();
    const valueUp = Math.abs((this.currentY / this.maxRotation) * this.max);
    const valueDown = -1 * (this.currentY / this.maxRotation) * this.min;
    if (this.currentY < 0) {
      if (valueDown < this.min) return this.min.toFixed(2);
      return valueDown.toFixed(2);
    }
    if (this.currentY > 0) {
      if (valueUp < this.min) return this.min.toFixed(2);
      return valueUp.toFixed(2);
    }
    return "0";
  }

  private getRingFillBackground() {
    const getBg = (startingAngle: number) =>
      `conic-gradient(${this.fillColor} ${startingAngle}deg, rgba(255,255,255,0.0) 0 360deg, ${this.fillColor} 0deg)`;

    if (this.min < 0) {
      if (this.currentY > 0) {
        return getBg(this.currentY);
      }
      return `conic-gradient(${this.fillColor} 0deg, rgba(255,255,255,0.0) 0 ${
        360 + this.currentY
      }deg, ${this.fillColor} 0deg)`;
    }
    return `conic-gradient(from ${-1 * (this.maxRotation / 2)}deg, ${
      this.fillColor
    } ${this.currentY}deg, rgba(255,255,255,0.0) 0 360deg, ${
      this.fillColor
    } 0deg)`;
  }

  private getRotation() {
    const value = this.initialized ? parseFloat(this.getValue()) : this.value;
    const ratio = value ? value / this.max : value;
    const angle = this.maxRotation * ratio;
    return this.min >= 0 ? angle - this.maxRotation / 2 : angle;
  }

  firstUpdated() {
    this.setRingColor(this.selectedStepperId);
    this.updatePosition();
    this.initialized = true;
  }

  render() {
    const rotation = this.getRotation();
    const ringFillBg = this.getRingFillBackground();

    return html`
      <div class="knob-root">
        <div class="knob-label-container">
          <span class="knob-label">${this.label}</span>
        </div>

        <div
          class="knob-container"
          id=${this.id}
          style="width: ${this.size}rem; height: ${this.size}rem;"
        >
          <div class="ring"></div>
          <div class="ring-fill" style="background: ${ringFillBg}"></div>
          <div class="space"></div>
          <div class="knob">
            <div
              class="knob-indicator-container"
              style="transform: rotate(${rotation}deg)"
              @pointerdown=${this.handleClick}
            >
              <div class="knob-indicator"></div>
            </div>
          </div>
        </div>
        <div class="knob-value-container">
          <span class="knob-value">${this.getValue()}</span>
        </div>
      </div>
    `;
  }

  static styles = css`
    :host {
      --ring-width: 14%;
      --ring-space: 20%;
      --knob-color-1: rgb(67, 68, 67);
      --knob-color-2: rgb(40, 38, 38);
    }

    .knob-root {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 0.2rem 1rem 0 1rem;
      height: fit-content;
    }

    .knob-container {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin-top: 0.4rem;
    }

    .knob-value-container {
      color: #fff;
      display: flex;
      justify-content: center;
    }

    .knob-label,
    .knob-value {
      font-size: 0.8rem;
    }

    .knob-label {
      color: #fff;
      margin: 0.2rem 0px;
    }

    .knob-label-container {
      display: flex;
      flex-wrap: nowrap;
    }

    .ring {
      position: absolute;
      background: conic-gradient(
        #545c64 140deg,
        rgba(176, 161, 161, 0) 0 220deg,
        #545c64 0deg
      );
      border-radius: 50%;
      width: 100%;
      height: 100%;
    }

    .ring-fill {
      position: absolute;
      border-radius: 50%;
      width: 100%;
      height: 100%;
    }

    .space {
      position: absolute;
      background-color: rgb(21, 21, 21);
      border-radius: 50%;
      width: calc((100%) - var(--ring-width));
      height: calc((100%) - var(--ring-width));
    }

    .knob {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      background: radial-gradient(
        circle at center,
        rgb(74, 73, 73) 0%,
        rgb(75, 74, 74) 20%,
        rgb(49, 49, 52) 40%,
        rgb(34, 34, 34) 100%
      );
      border-radius: 50%;
      width: calc((100%) - (var(--ring-width) + var(--ring-space)));
      height: calc((100%) - (var(--ring-width) + var(--ring-space)));
      cursor: pointer;
    }

    .knob-indicator-container {
      display: flex;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .knob-indicator {
      background: #ffffff;
      width: 9%;
      height: 35%;
      margin-top: 4%;
    }
  `;
}
