import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { SampleDescriptor } from "../../../../types/samples.types";
import SampleRegistry from "../../../../modules/SampleRegistry";

type OrderBy = "name" | "type" | "machine";
@customElement("sample-browser")
export class SampleBrowser extends LitElement {
  @property({ type: Number }) stepperId!: number;
  @property({ type: String }) filterType?: string;

  @state() private searchQuery = "";
  @state() private selectedMachine?: string;
  @state() private samples: SampleDescriptor[] = [];
  @state() private orderBy: OrderBy = "name";

  async connectedCallback() {
    super.connectedCallback();
    this.updateSamples();
  }

  private updateSamples() {
    let samples = SampleRegistry.getAllSamples() || [];

    // Apply search filter
    if (this.searchQuery) {
      samples = SampleRegistry.search(this.searchQuery);
    }

    // Apply type filter
    if (this.filterType) {
      samples = samples.filter((s) => s.type === this.filterType);
    }

    // Apply machine filter
    if (this.selectedMachine) {
      samples = samples.filter((s) => s.machine === this.selectedMachine);
    }

    this.samples = samples;
  }

  private handleSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
    this.updateSamples();
  }

  createItems() {
    return Array(10);
  }
  render() {
    return html`
      <div class="sample-browser">
        <div class="column">
          <input type="text" id="search-input" placeholder="search ..." />
          <browser-column
            .items=${[
              { label: "all", onClick: () => console.log("all onclick") },
              {
                label: "machines",
                onClick: () => console.log("machines onclick"),
              },
              { label: "types", onClick: () => console.log("types onclick") },
            ]}
          ></browser-column>
        </div>
        <div class="column"></div>
        <div class="column"></div>
      </div>
    `;
  }

  // <input
  //         type="text"
  //         placeholder="Search samples..."
  //         @input=${this.handleSearch}
  //       />

  //       <select
  //         @change=${(e: Event) => {
  //           this.selectedMachine = (e.target as HTMLSelectElement).value;
  //           this.updateSamples();
  //         }}
  //       >
  //         <option value="">All Machines</option>
  //         ${machines.map(
  //           (m) => html`
  //             <option value="${m.id}">${m.name} (${m.count})</option>
  //           `,
  //         )}
  //       </select>

  //       <div class="samples-grid">
  //         ${this.samples.map(
  //           (sample) => html`
  //             <button @click=${() => console.log("SAMPLE SELECTED")}>
  //               <div class="machine">${sample.machineName}</div>
  //               <div class="type">${sample.typeLabel}</div>
  //               <div class="file">${sample.file}</div>
  //             </button>
  //           `,
  //         )}
  //       </div>
  static styles = css`
    :host {
      --container-border-radius: 10px;
      --section-background-color: rgb(33, 33, 33);
      --panel-section-padding: 0.6rem 1.8rem;
      --panel-section-border: rgb(209, 209, 209) solid 0.2rem;
      box-sizing: border-box;
      height: 100%;
      display: flex;
      flex-direction: row;
      width: 100%;
    }

    .sample-browser {
      box-sizing: border-box;
      border-radius: 6px;
      background-color: #1e1e1e;
      padding: 1rem 0rem;
      display: flex;
      width: calc(100% - 1rem);
      color: white;
    }
    .column {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      border-right: solid black 2px;
      height: 100%;
      width: 20rem;
    }

    #search-input {
      all: unset;
      font-size: 1rem;
      padding: 0.4rem 1rem;
      border-radius: 0.2rem;
      background-color: #d9d8d8;
      color: #373737;
      border: none;
      width: 80%;
      margin-bottom: 0.4rem;
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
