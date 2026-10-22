import * as migration_20261021_074848_initial_users_media from './20261021_074848_initial_users_media'

export const migrations = [
  {
    up: migration_20261021_074848_initial_users_media.up,
    down: migration_20261021_074848_initial_users_media.down,
    name: '20261021_074848_initial_users_media',
  },
]
