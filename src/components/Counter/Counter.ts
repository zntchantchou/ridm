import type { StepperIdType } from "../../state/state.types";

type CounterOptions = {
  initialValue?: number;
  min?: number;
  max?: number;
  stepperId?: StepperIdType;
  onChange?: (value: number) => void;
};

class Counter {
  value: number;
  min: number;
  max: number;
  stepperId?: StepperIdType;
  rootElt: HTMLDivElement;
  minusBtn: HTMLDivElement;
  valueDisplay: HTMLDivElement;
  plusBtn: HTMLDivElement;
  onChange?: (value: number) => void;

  constructor({
    initialValue,
    min,
    max,
    onChange,
    stepperId,
  }: CounterOptions = {}) {
    this.value = initialValue ?? 0;
    this.min = min ?? 0;
    this.max = max ?? 10;
    if (Number.isInteger(stepperId)) this.stepperId = stepperId;
    this.onChange = onChange;

    this.rootElt = document.createElement("div");
    this.rootElt.classList.add("counter");
    this.minusBtn = document.createElement("div");
    this.valueDisplay = document.createElement("div");
    this.plusBtn = document.createElement("div");
    [this.minusBtn, this.valueDisplay, this.plusBtn].forEach((elt) =>
      elt.classList.add("counter-item"),
    );
    this.minusBtn.addEventListener("click", this.decrement);
    this.plusBtn.addEventListener("click", this.increment);

    this.render();
  }

  increment = () => {
    if (this.value < this.max) {
      this.value++;
      this.updateDisplay();
      this.onChange?.(this.value);
    }
  };

  decrement = () => {
    if (this.value > this.min) {
      this.value--;
      this.updateDisplay();
      this.onChange?.(this.value);
    }
  };

  private updateDisplay() {
    this.valueDisplay.textContent = this.value.toString();
  }

  private render(): HTMLDivElement {
    this.rootElt.className = "counter";

    this.minusBtn.classList.add("counter-minus");
    this.minusBtn.classList.add("counter-btn");
    this.minusBtn.textContent = "-";

    this.valueDisplay.classList.add("counter-value");
    this.valueDisplay.textContent = this.value.toString();

    this.plusBtn.classList.add("counter-plus");
    this.plusBtn.classList.add("counter-btn");
    this.plusBtn.textContent = "+";

    this.rootElt.appendChild(this.minusBtn);
    this.rootElt.appendChild(this.valueDisplay);
    this.rootElt.appendChild(this.plusBtn);

    return this.rootElt;
  }

  getElement() {
    return this.rootElt;
  }
}

export default Counter;
