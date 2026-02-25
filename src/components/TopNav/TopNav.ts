import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("top-nav")
export class TopNav extends LitElement {
  render() {
    return html`
      <div id="top-nav">
        <span>Ridm</span>
      </div>
    `;
  }

  static styles = css`
    :host {
      background-color: var(--sequencer-primary-color);
      font-family: "conthrax";
      font-size: 2.2rem;
      width: 100vw;
      height: 3.6rem;
      display: flex;
      align-items: center;
      padding-left: 2rem;
    }

    span {
      color: white;
    }
  `;
}
