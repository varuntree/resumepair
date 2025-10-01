/**
 * Template Icons Component
 *
 * Reusable icon components for resume templates.
 * Uses Lucide React icons exclusively per CLAUDE.md.
 *
 * @module libs/templates/shared/TemplateIcons
 */

import React from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Link as LinkIcon,
  Globe,
  Linkedin,
  Github,
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Code,
  Languages,
  type LucideIcon,
} from 'lucide-react'

interface IconProps {
  className?: string
  size?: number
}

/**
 * Base icon wrapper with consistent styling
 */
const IconWrapper: React.FC<{ icon: LucideIcon; className?: string; size?: number }> = ({
  icon: Icon,
  className = '',
  size,
}) => {
  return (
    <Icon
      className={`doc-icon ${className}`}
      size={size}
      style={
        size
          ? undefined
          : {
              width: 'var(--doc-icon-size, 16px)',
              height: 'var(--doc-icon-size, 16px)',
            }
      }
    />
  )
}

/**
 * Email icon
 */
export const EmailIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Mail} {...props} />
)

/**
 * Phone icon
 */
export const PhoneIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Phone} {...props} />
)

/**
 * Location icon
 */
export const LocationIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={MapPin} {...props} />
)

/**
 * Website/link icon
 */
export const WebsiteIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Globe} {...props} />
)

/**
 * Generic link icon
 */
export const LinkIconComponent: React.FC<IconProps> = (props) => (
  <IconWrapper icon={LinkIcon} {...props} />
)

/**
 * LinkedIn icon
 */
export const LinkedInIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Linkedin} {...props} />
)

/**
 * GitHub icon
 */
export const GitHubIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Github} {...props} />
)

/**
 * Calendar/date icon
 */
export const CalendarIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Calendar} {...props} />
)

/**
 * Work/briefcase icon
 */
export const WorkIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Briefcase} {...props} />
)

/**
 * Education icon
 */
export const EducationIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={GraduationCap} {...props} />
)

/**
 * Award icon
 */
export const AwardIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Award} {...props} />
)

/**
 * Certification icon
 */
export const CertificationIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={FileText} {...props} />
)

/**
 * Project/code icon
 */
export const ProjectIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Code} {...props} />
)

/**
 * Language icon
 */
export const LanguageIcon: React.FC<IconProps> = (props) => (
  <IconWrapper icon={Languages} {...props} />
)

/**
 * Get icon component by link type
 */
export function getIconForLinkType(type?: string): React.FC<IconProps> {
  const normalizedType = type?.toLowerCase()

  switch (normalizedType) {
    case 'linkedin':
      return LinkedInIcon
    case 'github':
      return GitHubIcon
    case 'website':
    case 'portfolio':
      return WebsiteIcon
    default:
      return LinkIconComponent
  }
}
