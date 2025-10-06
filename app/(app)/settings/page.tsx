import { redirect } from 'next/navigation'

// Settings hub redirects to profile settings
export default function SettingsPage() {
  redirect('/settings/profile')
}