import { css, html, LitElement } from "lit";
import { customElement, state } from "lit/decorators.js";

export type ViewName = "mix" | "samples";
@customElement("viewer-panel")
export class ViewerPanel extends LitElement {
  @state()
  currentView: ViewName = "samples";

  renderPanel() {
    if (this.currentView === "mix") {
      return html`<sound-panel></sound-panel>`;
    }
    if (this.currentView === "samples") {
      return html`<sample-browser></sample-browser>`;
    }
    return html`<sample-browser></sample-browser>`;
    // return html`<sound-panel></sound-panel>`;
  }

  changeView = (viewName: ViewName) => {
    this.currentView = viewName;
  };

  render() {
    return html`
      <div id="viewer-panel">
        ${this.renderPanel()}
        <viewer-nav .onViewChange=${this.changeView}></viewer-nav>
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
