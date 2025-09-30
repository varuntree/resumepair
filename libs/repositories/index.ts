/**
 * Repository Functions
 * Pure functions for database access with dependency injection
 */

// Profile operations
export {
  getProfile,
  updateProfile,
  type Profile,
  type ProfileUpdate
} from './profiles'

// Preferences operations
export {
  getPreferences,
  updatePreferences,
  type UserPreferences,
  type PreferencesUpdate
} from './preferences'