import { TEAMS } from './mockData';
import { seedAdminProject } from './seedAdminProject';

/**
 * Fails fast with a clear message when the backend isn't running, instead of every test
 * timing out on its first API call; then gives the e2e admin its project, once.
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
      `Backend not ready at ${backendUrl} (${String(error)}). Start the API repo (aureon-crm-api: ` +
        '`make up` with APP_PORT=8081) and set BACKEND_URL=http://localhost:8081; see ' +
        'docs/testing.md#the-crm-backend.',
      { cause: error },
    );
  }

  const started = performance.now();
  const seeded = await seedAdminProject(backendUrl);
  const took = Math.round(performance.now() - started);
  console.log(
    `The e2e admin's ${TEAMS.default.name}: ${seeded ? 'seeded' : 'already there'} (${took} ms)`,
  );
}
