import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";
import Application from "../../main";

@customElement("reset-button")
export class ResetButton extends LitElement {
  render() {
    return html`
      <button @click=${async () => await Application.loadTemplate("initial")}>
        RESET
      </button>
    `;
  }

  static styles = css`
    button {
      border: 0.2rem solid white;
      border-radius: 0.2rem;
      width: 3.3rem;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      background: none;
      font-size: 0.8;
      color: white;
      height: 4rem;
      width: 4rem;
    }

    button:hover {
      background-color: white;
      color: #a8a8a8;
    }
    button:active {
      background-color: gray;
      color: black;
    }
  `;
}
