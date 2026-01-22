import { beforeEach } from 'vitest';

// Create the DOM structure that Controls.ts expects
// This must run before any modules are imported
document.body.innerHTML = `
  <div id="steppers"></div>
  <div id="steppers-controls"></div>
  <div id="tpc-group"></div>
  <div id="volume-group"></div>
  <img id="play-img" />
`;

beforeEach(() => {
  // Reset the DOM structure before each test
  document.body.innerHTML = `
    <div id="steppers"></div>
    <div id="steppers-controls"></div>
    <div id="tpc-group"></div>
    <div id="volume-group"></div>
    <img id="play-img" />
  `;
});
