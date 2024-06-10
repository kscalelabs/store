// Type guard to check if a result is a fulfilled result
export function isFulfilled<T>(
  result: PromiseSettledResult<T>,
): result is PromiseFulfilledResult<T> {
  return result.status === "fulfilled" && result.value != null;
}
