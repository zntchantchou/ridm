import { LitElement, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type {
  SampleDescriptor,
  SampleType,
} from "../../../../types/samples.types";
import SampleRegistry from "../../../../modules/SampleRegistry";
import type { ColumnItem } from "../BrowserColumn/BrowserColumn";
import State from "../../../../state/State";
import Audio from "../../../../modules/Audio";

type OrderBy = "name" | "category" | "machine";
const ORDER_BY_VALUES: Record<OrderBy, OrderBy> = {
  name: "name",
  category: "category",
  machine: "machine",
};
@customElement("sample-browser")
export class SampleBrowser extends LitElement {
  @property({ type: Number }) stepperId!: number;
  @property({ type: String }) filterType?: string;

  @state() private searchQuery = "";
  @state() private selectedMachineId?: string;
  @state() private selectedCategoryId?: string;
  @state() private selectedSampleId?: string;
  @state() private orderBy: OrderBy = "name";

  async connectedCallback() {
    super.connectedCallback();
    await SampleRegistry.initialize();
    this.requestUpdate();
  }

  private handleSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;
  }

  createItems() {
    return Array(10);
  }

  private handleCategoryClick(orderBy: OrderBy) {
    this.orderBy = orderBy;
    this.clearSelection();
  }

  private clearSelection() {
    this.selectedSampleId = undefined;
    this.selectedMachineId = undefined;
    this.selectedCategoryId = undefined;
  }

  createCategoryItems() {
    return [
      {
        label: "all",
        onClick: () => this.handleCategoryClick(ORDER_BY_VALUES.name),
        selected: this.orderBy === ORDER_BY_VALUES.name,
      },
      {
        label: "drum machines",
        onClick: () => this.handleCategoryClick(ORDER_BY_VALUES.machine),
        selected: this.orderBy === ORDER_BY_VALUES.machine,
      },
      {
        label: "categories",
        onClick: () => this.handleCategoryClick(ORDER_BY_VALUES.category),
        selected: this.orderBy === ORDER_BY_VALUES.category,
      },
    ];
  }

  private selectMachine(machineId: string) {
    this.selectedMachineId = machineId;
  }
  private selectType(typeId: string) {
    this.selectedCategoryId = typeId;
  }

  createSecondColumnItems() {
    let items: ColumnItem[] = [];
    if (this.orderBy === ORDER_BY_VALUES.machine) {
      const filterQuery = this.selectedMachineId ? "" : this.searchQuery;
      items = SampleRegistry.getMachines(filterQuery).map((machine) => {
        return {
          label: machine.name,
          onClick: () => this.selectMachine(machine.id),
          selected: this.selectedMachineId === machine.id,
        };
      });
    }
    if (this.orderBy === ORDER_BY_VALUES.category) {
      const filterQuery = this.selectedCategoryId ? "" : this.searchQuery;
      items = SampleRegistry.getCategories(filterQuery).map((category) => {
        return {
          label: category.label,
          onClick: () => this.selectType(category.id),
          selected: this.selectedCategoryId === category.id,
        };
      });
    }
    if (this.orderBy === ORDER_BY_VALUES.name) {
      items = SampleRegistry.search(this.searchQuery).map((sample) => {
        return {
          label: sample.file,
          onClick: async () => await this.handleSampleClick(sample),
          selected: this.selectedSampleId === sample.id,
        };
      });
    }
    return items;
  }

  createThirdColumnItems = () => {
    let items: ColumnItem[] = [];
    if (this.orderBy === ORDER_BY_VALUES.machine && this.selectedMachineId) {
      items = SampleRegistry.getSamplesByMachine(
        this.selectedMachineId,
        this.searchQuery,
      ).map((sample) => {
        return {
          label: sample.file,
          onClick: async () => await this.handleSampleClick(sample),
          selected: this.selectedSampleId === sample.id,
        };
      });
    }
    if (this.orderBy === ORDER_BY_VALUES.category && this.selectedCategoryId) {
      items = SampleRegistry.getSamplesByType(
        this.selectedCategoryId as SampleType,
        this.searchQuery,
      ).map((sample) => {
        return {
          label: sample.file,
          onClick: async () => await this.handleSampleClick(sample),
          selected: this.selectedSampleId === sample.id,
        };
      });
    }
    return items;
  };

  async handleSampleClick(sample: SampleDescriptor) {
    this.selectedSampleId = sample.id;
    Audio.preview(sample.path);
  }

  render() {
    return html`
      <div class="sample-browser">
        <div class="column">
          <input
            type="text"
            id="search-input"
            placeholder="type to search..."
            @input=${this.handleSearch}
            @blur=${() => State.setIsSearching(false)}
            @focus=${() => State.setIsSearching(true)}
          />

          <browser-column .items=${this.createCategoryItems()}></browser-column>
        </div>
        <div class="column">
          <browser-column
            .items=${this.createSecondColumnItems()}
          ></browser-column>
        </div>
        <div class="column">
          <browser-column
            .items=${this.createThirdColumnItems()}
          ></browser-column>
        </div>
      </div>
    `;
  }

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
      font-size: 0.9rem;
      padding: 0.4rem 0.4rem;
      border-radius: 0.2rem;
      background-color: #d9d8d8;
      color: #373737;
      border: none;
      width: 90%;
      margin-bottom: 0.3rem;
    }
  `;
}
