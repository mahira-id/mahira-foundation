import * as migration_20261109_131317_initial from './20261109_131317_initial';
import * as migration_20261109_132023_publications from './20261109_132023_publications';
import * as migration_20261109_164253_media from './20261109_164253_media';
import * as migration_20261110_175914_m3_02_roles_access from './20261110_175914_m3_02_roles_access';
import * as migration_20261115_054138_m3_07_publication_slugs from './20261115_054138_m3_07_publication_slugs';
import * as migration_20261115_181459_m3_08_publication_files from './20261115_181459_m3_08_publication_files';
import * as migration_20261117_055203_m3_09_about from './20261117_055203_m3_09_about';

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
    name: '20261110_175914_m3_02_roles_access',
  },
  {
    up: migration_20261115_054138_m3_07_publication_slugs.up,
    down: migration_20261115_054138_m3_07_publication_slugs.down,
    name: '20261115_054138_m3_07_publication_slugs',
  },
  {
    up: migration_20261115_181459_m3_08_publication_files.up,
    down: migration_20261115_181459_m3_08_publication_files.down,
    name: '20261115_181459_m3_08_publication_files',
  },
  {
    up: migration_20261117_055203_m3_09_about.up,
    down: migration_20261117_055203_m3_09_about.down,
    name: '20261117_055203_m3_09_about'
  },
];
