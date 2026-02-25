import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

@customElement("panel-section")
export class PanelSectionElement extends LitElement {
  @property({ type: String }) title = "";
  @property() color = "white";

  render() {
    return html`
      <div class="panel-section" style=${styleMap({ borderColor: this.color })}>
        <div class="panel-section-title">
          <span>${this.title.toUpperCase()}</span>
        </div>
        <div class="panel-section-controls">
          <slot></slot>
        </div>
      </div>
    `;
  }

  static styles = css`
    .panel-section {
      height: 30%;
      box-sizing: border-box;
      border-right: var(--panel-section-border);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 0 1rem;
    }

    .panel-section-title {
      color: black;
      background-color: whitesmoke;
      border-radius: 4px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 0.6rem;
      /* Font has weird offset towards top */
      padding-top: 0.3rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .panel-section-controls {
      display: flex;
      justify-content: center;
      width: 100%;
    }
  `;
}
