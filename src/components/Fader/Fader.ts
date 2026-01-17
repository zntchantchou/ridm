import State from "../../state/State";
import type { StepperIdType } from "../../state/state.types";

type FaderOptions = {
  initialValue: number;
  min: number;
  max: number;
  step: number;
  id?: string;
  onChange: (e: Event) => void;
  fillColor?: string;
  variant?: "positive" | "absolute";
  matchStepperColor?: boolean;
  labelElt?: Element;
  /* The fader will get the currently selected stepper's options and retrieve the value using this function **/
  getValueFn?: (options: StepperIdType) => string;
};

class Fader {
  matchStepperColor: boolean = false;
  labelElt?: Element;
  element: HTMLInputElement;
  value: number;
  min: number;
  max: number;
  getValueFn?: (options: StepperIdType) => string;
  onChange: (e: Event) => void;
  id?: string;
  fillColor?: string = "rgb(126, 126, 126)";
  variant: "positive" | "absolute";
  constructor({
    initialValue,
    min,
    max,
    step,
    onChange,
    fillColor,
    variant,
    matchStepperColor,
    getValueFn,
    id,
    labelElt,
  }: FaderOptions) {
    this.value = initialValue;
    this.max = max;
    this.min = min;
    this.getValueFn = getValueFn;
    this.onChange = onChange;
    this.id = id;
    this.element = document.createElement("input");
    if (id) this.element.id = id;
    this.element.type = "range";
    this.element.min = this.min.toString();
    this.element.max = this.max.toString();
    this.element.step = step.toString();
    this.element.value = this.value.toString();
    this.element.addEventListener("change", this.handleChange);
    if (labelElt) this.labelElt = labelElt;
    if (variant) this.variant = variant;
    else this.variant = this.min < 0 ? "absolute" : "positive";
    if (fillColor) {
      this.fillColor = fillColor;
    }
    if (matchStepperColor) this.listenToStepperColor();
    this.updateFillColor();
  }

  private listenToStepperColor() {
    State.currentStepperIdSubject.subscribe((id) => {
      if (this.getValueFn) {
        // state should implement those selectors instead of passing them down from parent
        const value = this?.getValueFn(id as StepperIdType);
        this.value = parseFloat(value);
        this.element.value = value;
        if (this.labelElt) this.labelElt.textContent = value;
      }
      this.fillColor = State.getStepperOptions(id)?.color.cssColor;
      this.updateFillColor();
    });
  }

  private valueToPct(value: number) {
    const amplitude = this.max - this.min;
    const baseValue = value - this.min;
    const ratio = baseValue / amplitude;
    return ratio * 100;
  }

  private handleChange = (e: Event) => {
    this.onChange(e);
    const target = e.target as HTMLInputElement;
    this.value = parseFloat(target.value);
    if (this.labelElt) this.labelElt.textContent = target.value;
    this.updateFillColor();
  };

  private updateFillColor() {
    let gradient;
    const inactiveColor = "rgba(220, 220, 220, 1)";
    if (this.variant === "positive") {
      gradient = `linear-gradient(to right, ${this.fillColor} ${this.valueToPct(
        this.value,
      )}%, ${inactiveColor} ${this.valueToPct(this.value)}%)`;
    } else {
      if (this.value < 0) {
        const ratio = this.value / this.min;
        const start = (1 - ratio) * 50;
        gradient = `linear-gradient(to right, ${inactiveColor} ${start}%, ${this.fillColor}  ${start}%, ${this.fillColor} 50%, ${inactiveColor} 50%)`;
      }
      if (this.value > 0) {
        const ratio = this.value / this.max;
        const start = 50;
        const end = start + ratio * start;
        gradient = `linear-gradient(to right, ${inactiveColor} ${start}%, ${this.fillColor}  ${start}%, ${this.fillColor} ${end}%, ${inactiveColor} ${end}%)`;
      }
      if (this.value === 0) gradient = inactiveColor;
    }
    if (gradient) this.element.style.background = gradient;
  }

  render() {
    if (this.labelElt) this.labelElt.textContent = this.value.toString();
    return this.element;
  }
}

export default Fader;
