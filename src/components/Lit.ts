import { html, css, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("lit-panel")
export class LitComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 20px;
      background-color: red;
      color: white;
      font-size: 24px;
      border: 3px solid yellow;
    }
  `;

  render() {
    console.log("LIT COMPONENT RENDERED");
    return html`<div>I am a lit component</div>`;
  }
}
