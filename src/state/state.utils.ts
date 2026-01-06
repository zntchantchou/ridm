export function generateRandomSteps({
  steps,
  beats,
}: {
  steps: number;
  beats: number;
}): boolean[] {
  const totalSteps = steps * beats;
  return Array(totalSteps)
    .fill(null)
    .map(() => Math.random() < 0.5);
}
