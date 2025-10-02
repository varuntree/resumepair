/**
 * Skills Analyzer
 *
 * Analyzes resume for skills categorization and extraction.
 * Used by job matching to identify gaps.
 *
 * @module libs/ai/analyzers/skillsAnalyzer
 */

/**
 * Skills analysis result
 */
export interface SkillsAnalysis {
  technical: string[];
  soft: string[];
  tools: string[];
  certifications: string[];
  languages: string[];
  totalCount: number;
}

/**
 * Resume JSON interface (subset used for skills analysis)
 */
interface ResumeForAnalysis {
  skills?: Array<{
    category: string;
    keywords: string[];
  }>;
  certifications?: Array<{
    name: string;
  }>;
  languages?: Array<{
    language: string;
  }>;
}

/**
 * Analyze resume for skills
 *
 * Extracts and categorizes skills from resume JSON.
 * Used by job matching to compare against JD requirements.
 *
 * @param resume - Resume JSON object
 * @returns Skills analysis with categorization
 */
export function analyzeResumeSkills(resume: ResumeForAnalysis): SkillsAnalysis {
  const technical: string[] = [];
  const soft: string[] = [];
  const tools: string[] = [];
  const certifications: string[] = [];
  const languages: string[] = [];

  // Extract from skills section
  if (resume.skills && Array.isArray(resume.skills)) {
    resume.skills.forEach(skill => {
      const category = skill.category?.toLowerCase() || '';
      const keywords = skill.keywords || [];

      if (category.includes('technical') || category.includes('programming')) {
        technical.push(...keywords);
      } else if (category.includes('soft') || category.includes('interpersonal')) {
        soft.push(...keywords);
      } else if (category.includes('tool') || category.includes('software')) {
        tools.push(...keywords);
      } else {
        // Default to technical if unclear
        technical.push(...keywords);
      }
    });
  }

  // Extract from certifications
  if (resume.certifications && Array.isArray(resume.certifications)) {
    certifications.push(...resume.certifications.map(c => c.name));
  }

  // Extract from languages
  if (resume.languages && Array.isArray(resume.languages)) {
    languages.push(...resume.languages.map(l => l.language));
  }

  // Deduplicate all arrays
  const deduped = {
    technical: Array.from(new Set(technical)),
    soft: Array.from(new Set(soft)),
    tools: Array.from(new Set(tools)),
    certifications: Array.from(new Set(certifications)),
    languages: Array.from(new Set(languages)),
  };

  return {
    ...deduped,
    totalCount:
      deduped.technical.length +
      deduped.soft.length +
      deduped.tools.length +
      deduped.certifications.length +
      deduped.languages.length,
  };
}
