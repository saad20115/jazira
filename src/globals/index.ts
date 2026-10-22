import { AboutPage } from './AboutPage'
import { ContactPage } from './ContactPage'
import { HomePage } from './HomePage'
import { Navigation } from './Navigation'
import { PrivacyPage } from './PrivacyPage'
import { ProjectsPage } from './ProjectsPage'
import { ServicesPage } from './ServicesPage'
import { SiteSettings } from './SiteSettings'

export {
  createValidateGlobalDataBeforeValidateHook,
  enforcePublishedReadOnGlobalBeforeOperation,
  PAGES_ADMIN_GROUP,
  type PublishableGlobalVersions,
  publishableGlobalVersions,
  SETTINGS_ADMIN_GROUP,
  withPublishableGlobal,
} from './_shared/publishableGlobal'
export { AboutPage } from './AboutPage'
export { ContactPage } from './ContactPage'
export { HomePage, INTERACTIVE_SYSTEM_SHOT_VALUES, type InteractiveSystemShot } from './HomePage'
export { Navigation } from './Navigation'
export { PrivacyPage } from './PrivacyPage'
export { ProjectsPage } from './ProjectsPage'
export { ServicesPage } from './ServicesPage'
export { SiteSettings, SOCIAL_PLATFORM_VALUES, type SocialPlatform } from './SiteSettings'

export const ALL_GLOBALS = [
  SiteSettings,
  Navigation,
  HomePage,
  ServicesPage,
  AboutPage,
  ProjectsPage,
  ContactPage,
  PrivacyPage,
] as const
