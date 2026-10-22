import * as migration_20261021_074848_initial_users_media from './20261021_074848_initial_users_media'
import * as migration_20261022_120943_p2_t2_videos_brands_stats_materials from './20261022_120943_p2_t2_videos_brands_stats_materials'

export const migrations = [
  {
    up: migration_20261021_074848_initial_users_media.up,
    down: migration_20261021_074848_initial_users_media.down,
    name: '20261021_074848_initial_users_media',
  },
  {
    up: migration_20261022_120943_p2_t2_videos_brands_stats_materials.up,
    down: migration_20261022_120943_p2_t2_videos_brands_stats_materials.down,
    name: '20261022_120943_p2_t2_videos_brands_stats_materials',
  },
]
