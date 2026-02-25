export function setupDOM(): void {
  document.body.innerHTML = `
    <div id="steppers"></div>
    <div id="steppers-controls"></div>
    <div id="tpc-group"></div>
    <div id="volume-group"></div>
  `;
}

export function setupMinimalDOM(): void {
  document.body.innerHTML = '<div id="steppers"></div>';
}

export function cleanupDOM(): void {
  document.body.innerHTML = "";
}
