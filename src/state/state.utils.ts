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
    .map(() => Math.random() < 0.2);
}
