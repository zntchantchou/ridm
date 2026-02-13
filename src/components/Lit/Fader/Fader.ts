import { css, html, LitElement } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

@customElement("fader-element")
export class FaderElement extends LitElement {
  @property({ type: Number })
  min: number = 0;
  @property({ type: Boolean })
  normalized = false;
  @property({ type: Number })
  max: number = 100;
  @property({ type: Number })
  step: number = 0.01;
  @property({ type: Number })
  value: number = 0;
  @property({ type: String })
  label = "";
  @property({ type: String })
  variant = "positive";
  @property({ type: String })
  direction = "row";
  @property({ type: String })
  fillColor?: string = "rgb(126, 126, 126)";
  @property({ type: String })
  gradient? = "rgba(220, 220, 220, 1)";
  @property({ attribute: false })
  onChange?: (e: Event) => void;

  connectedCallback(): void {
    super.connectedCallback();
    this.updateFillColor();
  }

  private handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    this.value = parseFloat(target.value);
    this.updateFillColor();
    if (this.onChange) this?.onChange(e);
  };

  private valueToPct(value: number) {
    const amplitude = this.max - this.min;
    const baseValue = value - this.min;
    const ratio = baseValue / amplitude;
    return ratio * 100;
  }

  private normalizeValue() {
    console.log("NORMALIZED ", this.normalized);
    console.log("NORMALIZED LABEL", this.label);
    if (!this.normalized) return this.value.toFixed(1);
    let percentage = 0;
    const amplitude = this.max - this.min;
    if (this.value < 0) {
      const diff = -1 * (this.min - this.value);
      const ratio = diff / amplitude;
      percentage = ratio * 100;
    } else {
      const startRatio = -this.min / amplitude;
      const ratio = this.value / amplitude;
      percentage = (startRatio + ratio) * 100;
    }
    return percentage.toFixed(1);
  }

  private updateFillColor() {
    const inactiveColor = "rgba(220, 220, 220, 1)";
    if (this.variant === "positive") {
      this.gradient = `linear-gradient(to right, ${this.fillColor} ${this.valueToPct(
        this.value,
      )}%, ${inactiveColor} ${this.valueToPct(this.value)}%)`;
    } else {
      if (this.value < 0) {
        const ratio = this.value / this.min;
        const start = (1 - ratio) * 50;
        this.gradient = `linear-gradient(to right, ${inactiveColor} ${start}%, ${this.fillColor}  ${start}%, ${this.fillColor} 50%, ${inactiveColor} 50%)`;
      }
      if (this.value > 0) {
        const ratio = this.value / this.max;
        const start = 50;
        const end = start + ratio * start;
        this.gradient = `linear-gradient(to right, ${inactiveColor} ${start}%, ${this.fillColor}  ${start}%, ${this.fillColor} ${end}%, ${inactiveColor} ${end}%)`;
      }
      if (this.value === 0) this.gradient = inactiveColor;
    }
  }

  renderLabel() {
    if (this.label) return html`<span>${this.label}</span>`;
    return null;
  }

  render() {
    return html`<div class="fader">
      ${this.renderLabel()}
      <input
        type="range"
        step=${this.step}
        variant="positive"
        min=${this.min}
        max=${this.max}
        @change=${(e: Event) => this.handleChange(e)}
        value=${this.value}
        style=${styleMap({ background: this.gradient })}
      />
      <div>${this.normalizeValue()}</div>
    </div> `;
  }

  static styles = css`
    :host {
      height: 100%;
      width: 100%;
      padding: 0 1rem;
      flex-direction: row;
      align-items: center;
    }

    .fader {
      width: 100%;
      height: 100%;
      display: flex;
      justify-items: center;
      align-items: center;
    }

    input[type="range"] {
      --slider-track-color: rgba(220, 220, 220, 1);
      --slider-progress-color: rgb(126, 126, 126);
      --slider-thumb-color: rgb(30, 29, 29);
      --slider-thumb-height: 1.4rem;
      --slider-thumb-width: 0.8rem;
      --thumb-border-width: 0.15rem;
      --slider-height: 0.2rem;
      --slider-width: 1.8rem;
      --slider-border-radius: 50px;
      --track-border-radius: 2px;
      /* removing default appearance */
      -webkit-appearance: none;
      appearance: none;
      width: 100%;
      margin: 0 1rem;
      /* creating a custom design */
      height: var(--slider-height);
      cursor: pointer;
      outline: none;
      /*  slider progress trick  */
      border-radius: var(--track-border-radius);
    }

    /* Track: webkit browsers */
    input[type="range"]::-webkit-slider-runnable-track {
      height: var(--slider-height);
      border-radius: var(--track-border-radius);
    }

    /* Track: Mozilla Firefox */
    input[type="range"]::-moz-range-track {
      height: var(--slider-height);
      border-radius: var(--track-border-radius);
    }

    /* Thumb: webkit */
    input[type="range"]::-webkit-slider-thumb {
      /* removing default appearance */
      -webkit-appearance: none;
      appearance: none;
      height: var(--slider-thumb-height);
      width: var(--slider-thumb-width);
      border-radius: 20%;
      border: solid rgb(115, 113, 113);
      border-width: var(--thumb-border-width);
      box-sizing: content-box;
      transform: translateY(
        calc(
          (-1 * (var(--slider-thumb-height) / 2) - var(--thumb-border-width)) +
            var(--slider-height) / 2
        )
      );
      background-color: var(--slider-thumb-color);
    }

    /* Thumb: Firefox */
    input[type="range"]::-moz-range-thumb {
      appearance: none;
      height: var(--slider-thumb-height);
      width: var(--slider-thumb-width);
      border-radius: 20%;
      border: solid rgb(115, 113, 113);
      border-width: var(--thumb-border-width);
      box-sizing: content-box;
      background-color: var(--slider-thumb-color);
    }
  `;
}
