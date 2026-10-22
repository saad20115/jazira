import * as migration_20261021_074848_initial_users_media from './20261021_074848_initial_users_media'
import * as migration_20261022_120943_p2_t2_videos_brands_stats_materials from './20261022_120943_p2_t2_videos_brands_stats_materials'
import * as migration_20261022_140011_p2_t3_services_team from './20261022_140011_p2_t3_services_team'
import * as migration_20261022_160652_p2_t4_projects from './20261022_160652_p2_t4_projects'

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
  {
    up: migration_20261022_140011_p2_t3_services_team.up,
    down: migration_20261022_140011_p2_t3_services_team.down,
    name: '20261022_140011_p2_t3_services_team',
  },
  {
    up: migration_20261022_160652_p2_t4_projects.up,
    down: migration_20261022_160652_p2_t4_projects.down,
    name: '20261022_160652_p2_t4_projects',
  },
]
