/**
 * Fails fast with a clear message when the backend isn't running, instead of every test
 * timing out on its first API call.
 */
export default async function globalSetup() {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8080';

  try {
    const response = await fetch(`${backendUrl}/actuator/health/readiness`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `Backend not ready at ${backendUrl} (${String(error)}). Start it with \`make backend-up\`.`,
      { cause: error },
    );
  }
}
