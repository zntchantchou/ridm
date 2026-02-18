import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("toggle-element")
export class ToggleElement extends LitElement {
  @property({ type: String }) text = "";
  @property({ type: Boolean }) checked = false;
  @property({ type: String }) color = "white";
  @property({ attribute: false }) onClick?: (checked: boolean) => void;

  @state() private _checked = false;

  connectedCallback() {
    super.connectedCallback();
    this._checked = this.checked;
  }

  private toggle = () => {
    this._checked = !this._checked;
    this.onClick?.(this._checked);
  };

  render() {
    return html`
      <div
        class="toggle ${this._checked ? "toggle-checked" : ""}"
        style="border-color: ${this._checked ? this.color : ""};"
      >
        <button class="toggle-btn" @click=${this.toggle}>
          <span
            class="toggle-label"
            style="color: ${this._checked ? this.color : ""};"
            >${this.text}</span
          >
        </button>
      </div>
    `;
  }

  static styles = css`
    .toggle {
      background-color: rgb(0, 0, 0);
      opacity: 0.7;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50%;
      height: 1.4rem;
      width: 1.6rem;
      box-sizing: border-box;
      border-radius: 4px;
      cursor: pointer;
    }

    .toggle button {
      background: none;
      border: none;
      outline: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .toggle:active {
      animation: bounce 0.3s ease-in-out;
    }

    .toggle-checked {
      opacity: 1;
      border-width: 0.15rem;
      border-style: solid;
      background-color: black;
    }

    .toggle-label {
      font-weight: 300;
      color: rgb(238, 238, 238);
    }
  `;
}
