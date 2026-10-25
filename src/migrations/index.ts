import * as migration_20261021_074848_initial_users_media from './20261021_074848_initial_users_media'
import * as migration_20261022_120943_p2_t2_videos_brands_stats_materials from './20261022_120943_p2_t2_videos_brands_stats_materials'
import * as migration_20261022_140011_p2_t3_services_team from './20261022_140011_p2_t3_services_team'
import * as migration_20261022_160652_p2_t4_projects from './20261022_160652_p2_t4_projects'
import * as migration_20261022_221250_p2_t5_globals from './20261022_221250_p2_t5_globals'
import * as migration_20261022_231435_p2_t6_quote_requests from './20261022_231435_p2_t6_quote_requests'
import * as migration_20261023_005934_p2_t6_quote_requests_service_title from './20261023_005934_p2_t6_quote_requests_service_title'
import * as migration_20261024_104400_p3_t4_r2_title_accent_and_stats_bg from './20261024_104400_p3_t4_r2_title_accent_and_stats_bg'
import * as migration_20261024_195628_p3_t12_site_settings_arabic_enabled from './20261024_195628_p3_t12_site_settings_arabic_enabled'
import * as migration_20261025_002404_p4_t2_projects_review_fields from './20261025_002404_p4_t2_projects_review_fields'

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
  {
    up: migration_20261022_221250_p2_t5_globals.up,
    down: migration_20261022_221250_p2_t5_globals.down,
    name: '20261022_221250_p2_t5_globals',
  },
  {
    up: migration_20261022_231435_p2_t6_quote_requests.up,
    down: migration_20261022_231435_p2_t6_quote_requests.down,
    name: '20261022_231435_p2_t6_quote_requests',
  },
  {
    up: migration_20261023_005934_p2_t6_quote_requests_service_title.up,
    down: migration_20261023_005934_p2_t6_quote_requests_service_title.down,
    name: '20261023_005934_p2_t6_quote_requests_service_title',
  },
  {
    up: migration_20261024_104400_p3_t4_r2_title_accent_and_stats_bg.up,
    down: migration_20261024_104400_p3_t4_r2_title_accent_and_stats_bg.down,
    name: '20261024_104400_p3_t4_r2_title_accent_and_stats_bg',
  },
  {
    up: migration_20261024_195628_p3_t12_site_settings_arabic_enabled.up,
    down: migration_20261024_195628_p3_t12_site_settings_arabic_enabled.down,
    name: '20261024_195628_p3_t12_site_settings_arabic_enabled',
  },
  {
    up: migration_20261025_002404_p4_t2_projects_review_fields.up,
    down: migration_20261025_002404_p4_t2_projects_review_fields.down,
    name: '20261025_002404_p4_t2_projects_review_fields',
  },
]
