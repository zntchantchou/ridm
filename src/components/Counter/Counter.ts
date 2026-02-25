import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("counter-element")
export class CounterElement extends LitElement {
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 2;
  @property({ type: Number }) max = 10;
  @property({ attribute: false }) onChange?: (value: number) => void;

  @state() private _value = 0;

  connectedCallback() {
    super.connectedCallback();
    this._value = this.value;
  }

  private increment = () => {
    if (this._value < this.max) {
      this._value++;
      this.onChange?.(this._value);
    }
  };

  private decrement = () => {
    if (this._value > this.min) {
      this._value--;
      this.onChange?.(this._value);
    }
  };

  render() {
    return html`
      <div class="counter">
        <div
          class="counter-item counter-btn counter-minus"
          @click=${this.decrement}
        >
          -
        </div>
        <div class="counter-item counter-value">${this._value}</div>
        <div
          class="counter-item counter-btn counter-plus"
          @click=${this.increment}
        >
          +
        </div>
      </div>
    `;
  }

  static styles = css`
    .counter {
      display: flex;
      cursor: pointer;
    }

    .counter-item {
      min-width: 1rem;
      flex: 1;
      color: white;
      padding: 0.4rem;
      display: flex;
      justify-content: center;
      align-items: center;
      box-sizing: content-box;
      font-size: 0.9rem;
      overflow: hidden;
      background-color: rgb(28, 28, 28);
    }

    .counter-btn {
      font-size: 1.2rem;
    }

    .counter-btn:hover:active {
      background-color: rgb(133, 133, 133);
      animation: bounce 0.3s ease-in-out;
    }

    .counter-btn:hover {
      color: rgb(38, 38, 38);
      background-color: rgb(255, 255, 255);
    }

    .counter-plus {
      border-radius: 0 2rem 2rem 0;
    }

    .counter-minus {
      border-radius: 2rem 0 0 2rem;
    }

    .counter-value {
      font-family: "technology";
      font-size: 1.2rem;
      border-left: 1px solid rgb(81, 81, 81);
      border-right: 1px solid rgb(81, 81, 81);
      font-weight: bolder;
    }
  `;
}
