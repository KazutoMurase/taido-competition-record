export async function FetchJson(input, init) {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}
