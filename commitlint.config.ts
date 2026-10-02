import type { UserConfig } from '@commitlint/types';

// Conventional Commits, as in the backend repo. Dependabot's messages already use the
// `build(deps): …` / `ci: …` prefixes configured in .github/dependabot.yml.
const Configuration: UserConfig = {
  extends: ['@commitlint/config-conventional'],
};

export default Configuration;
