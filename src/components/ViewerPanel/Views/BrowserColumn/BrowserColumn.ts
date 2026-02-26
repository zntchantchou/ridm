import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import { styleMap } from "lit/directives/style-map.js";

export type ColumnItem = {
  label: string;
  secondaryText?: string;
  onClick?: () => void;
  selected: boolean;
};

@customElement("browser-column")
export class BrowserColumn extends LitElement {
  @property({ attribute: false })
  items: ColumnItem[] = [];

  handleClick = (item: ColumnItem) => {
    console.log("Browser column handleClick");
    if (item.onClick) item.onClick();
  };

  render() {
    let itemsAsList = [];
    itemsAsList = this.items?.map((item) => {
      return html`<div
        class="column-item"
        @click=${() => this.handleClick(item)}
        style=${item.selected
          ? styleMap({ backgroundColor: "#121212", color: "white" })
          : {}}
      >
        ${item.label}
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

    .column-item {
      height: 2rem;
      width: 100%;
      display: flex;
      align-items: center;
      font-size: 0.8rem;
      padding: 0rem 0.9rem;
      box-sizing: content-box;

      border-bottom: 2px solid #080808;
    }
    .column-item:hover {
      background-color: #303030;
      cursor: pointer;
    }
  `;
}

//   private selectSample(sample: SampleDescriptor) {
//     this.dispatchEvent(new CustomEvent('sample-selected', {
//       detail: { stepperId: this.stepperId, sample },
//       bubbles: true,
//       composed: true,
//     }));
//   }
// }
