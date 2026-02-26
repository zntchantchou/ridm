import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("viewer-panel")
export class ViewerPanel extends LitElement {
  render() {
    return html`
      <div id="viewer-panel">
        <sound-panel></sound-panel>
        <viewer-nav></viewer-nav>
      </div>
    `;
  }

  static styles = css`
    :host {
      height: 100%;
      width: 100%;
    }

    #viewer-panel {
      box-sizing: border-box;
      display: flex;
      flex-wrap: nowrap;
      height: 100%;
      width: 100%;
      max-width: 100%;
      padding: 0rem 0.8rem;
    }
  `;
}
