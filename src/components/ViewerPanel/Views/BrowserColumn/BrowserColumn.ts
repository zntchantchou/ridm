import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

type ColumnItem = {
  label: string;
  secondaryText?: string;
  onClick?: () => void;
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
    const itemsAsList = this.items.map((item) => {
      return html`<div
        class="column-item"
        @click=${() => this.handleClick(item)}
      >
        ${item.label}
      </div>`;
    });
    return html`<div class="column">${itemsAsList}</div>`;
  }

  static styles = css`
    :host {
      width: 100%;
    }
    .column {
      width: 100%;
      height: 100%;
    }
    .column-item {
      height: 2rem;
      width: 100%;
      display: flex;
      align-items: center;
      font-size: 0.9rem;
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
