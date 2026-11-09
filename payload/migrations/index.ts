import * as migration_20261109_131317_initial from './20261109_131317_initial';
import * as migration_20261109_132023_publications from './20261109_132023_publications';

export const migrations = [
  {
    up: migration_20261109_131317_initial.up,
    down: migration_20261109_131317_initial.down,
    name: '20261109_131317_initial',
  },
  {
    up: migration_20261109_132023_publications.up,
    down: migration_20261109_132023_publications.down,
    name: '20261109_132023_publications'
  },
];
