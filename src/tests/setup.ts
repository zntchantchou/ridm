import { beforeEach } from "vitest";
import { setupDOM } from "./utils/dom-helpers.ts";

// Create the DOM structure that Controls.ts expects
// This must run before any modules are imported
setupDOM();

beforeEach(() => {
  // Reset the DOM structure before each test
  setupDOM();
});
