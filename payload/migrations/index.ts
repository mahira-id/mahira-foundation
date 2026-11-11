import * as migration_20261109_131317_initial from './20261109_131317_initial';
import * as migration_20261109_132023_publications from './20261109_132023_publications';
import * as migration_20261109_164253_media from './20261109_164253_media';
import * as migration_20261110_175914_m3_02_roles_access from './20261110_175914_m3_02_roles_access';

export const migrations = [
  {
    up: migration_20261109_131317_initial.up,
    down: migration_20261109_131317_initial.down,
    name: '20261109_131317_initial',
  },
  {
    up: migration_20261109_132023_publications.up,
    down: migration_20261109_132023_publications.down,
    name: '20261109_132023_publications',
  },
  {
    up: migration_20261109_164253_media.up,
    down: migration_20261109_164253_media.down,
    name: '20261109_164253_media',
  },
  {
    up: migration_20261110_175914_m3_02_roles_access.up,
    down: migration_20261110_175914_m3_02_roles_access.down,
    name: '20261110_175914_m3_02_roles_access'
  },
];
