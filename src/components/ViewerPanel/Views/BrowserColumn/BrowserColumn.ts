import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

export type ColumnItem = {
  label: string;
  secondaryText?: string;
  onClick?: () => void;
  onAction?: () => void;
  selected: boolean;
};

@customElement("browser-column")
export class BrowserColumn extends LitElement {
  @property({ attribute: false })
  items: ColumnItem[] = [];
  @property({ type: Boolean })
  withActionButton: boolean = false;

  handleClick = (item: ColumnItem) => {
    console.log("Browser column handleClick");
    if (item.onClick) item.onClick();
  };

  renderActionBtn(item: ColumnItem) {
    if (!this.withActionButton) return null;
    return html`<div
      class="action-btn"
      @click=${(e: Event) => {
        if (item.onAction) item?.onAction();
        e.preventDefault();
      }}
    >
      LOAD
    </div>`;
  }

  render() {
    let itemsAsList = [];
    itemsAsList = this.items?.map((item) => {
      return html`<div
        class="column-item"
        style=${item.selected
          ? styleMap({ backgroundColor: "#121212", color: "white" })
          : {}}
      >
        <div class="label" @click=${() => this.handleClick(item)}>
          ${item.label}
        </div>
        ${this.renderActionBtn(item)}
      </div>`;
    });
    return html`<div class="column">${itemsAsList}</div>`;
  }

  static styles = css`
    :host {
      width: 100%;
      max-height: 100%;
      overflow-y: auto;
      /* Firefox scrollbar styling */
      scrollbar-width: thin;
      scrollbar-color: #666666 #151515;
    }
    .column {
      width: 100%;
      overflow-x: hidden;
      overflow-y: auto;
    }

    .action-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 4rem;
      height: 70%;
      display: none;
      background-color: #024d0e;
      margin-right: 0.2rem;
    }

    .column-item:hover .action-btn {
      display: flex;
    }

    .action-btn:hover {
      background-color: #03961b;
    }

    .column-item {
      height: 2rem;
      width: 100%;
      display: flex;
      align-items: center;
      font-size: 0.8rem;
      padding: 0rem 0.9rem 0 0rem;
      box-sizing: content-box;
      border-bottom: 2px solid #080808;
    }
    .column-item:hover {
      background-color: #303030;
      cursor: pointer;
    }
    .label {
      display: flex;
      align-items: center;
      padding-left: 0.8rem;
      height: 100%;
      width: calc(100%);
    }

    /* Webkit browsers (Chrome, Safari, Edge) scrollbar styling */
    :host::-webkit-scrollbar {
      width: 0.8rem;
      border-radius: 0px;
    }

    :host::-webkit-scrollbar-track {
      border-radius: 0px;
    }
    :host::-webkit-scrollbar-thumb {
      border-radius: 0px;
    }

    :host::-webkit-scrollbar-track {
      background: #0a0a0a;
    }

    :host::-webkit-scrollbar-thumb {
      background: #666666;
      border-radius: 0px;
    }

    :host::-webkit-scrollbar-thumb:hover {
      background: #808080;
    }
  `;
}
