export function generateRandomSteps({
  stepsPerBeat,
  beats,
}: {
  stepsPerBeat: number;
  beats: number;
}): boolean[] {
  const totalSteps = stepsPerBeat * beats;
  return Array(totalSteps)
    .fill(null)
    .map(() => Math.random() < 0);
}

export function generateEmptySteps({
  stepsPerBeat,
  beats,
}: {
  stepsPerBeat: number;
  beats: number;
}): boolean[] {
  const totalSteps = stepsPerBeat * beats;
  return Array(totalSteps).fill(false);
}

export function generateBlankSteps({
  stepsPerBeat,
  beats,
}: {
  stepsPerBeat: number;
  beats: number;
}): boolean[] {
  const totalSteps = stepsPerBeat * beats;
  return Array(totalSteps).fill(false);
}
