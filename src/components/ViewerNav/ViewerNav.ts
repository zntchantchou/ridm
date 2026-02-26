import { css, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";
import note from "/pictures/note.svg";
import mixer from "/pictures/mixer.svg";
import folder from "/pictures/folder.svg";
import type { ViewName } from "../ViewerPanel/ViewerPanel";

@customElement("viewer-nav")
export class ViewerNav extends LitElement {
  @state()
  selectedView: ViewName = "mix";

  @property()
  @property({ attribute: false })
  onViewChange!: (viewName: ViewName) => void;

  handleSelectView = (view: ViewName) => {
    this.selectedView = view;
    this.onViewChange(view);
  };

  getItemStyleMap = (view: string) => {
    const itemStyleMap = styleMap({
      backgroundColor:
        this.selectedView === view ? "#1e1e1e" : "rgb(15, 15, 15)",
      color: this.selectedView === view ? "white" : "gray",
      opacity: this.selectedView === view ? "1" : "0.2",
    });
    return itemStyleMap;
  };

  render() {
    return html`
      <div id="viewer-nav">
        <div
          class="nav-item"
          @click=${() => this.handleSelectView("mix")}
          style=${this.getItemStyleMap("mix")}
        >
          <img src=${mixer} />
        </div>
        <div
          class="nav-item"
          @click=${() => this.handleSelectView("samples")}
          style=${this.getItemStyleMap("samples")}
        >
          <img src=${note} />
        </div>
        <!-- <div
          class="nav-item"
          @click=${() => this.handleSelectView("three")}
          style=${this.getItemStyleMap("three")}
        >
          <img src=${folder} />
        </div> -->
      </div>
    `;
  }

  static styles = css`
    :host {
      width: 3rem;
      height: 100%;
      /* margin-left: 1rem; */
    }
    .nav-item {
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 3rem;
      height: 3rem;
      cursor: pointer;
    }

    img {
      max-width: 55%;
      max-height: 55%;
    }
  `;
}
