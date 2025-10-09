'use client'

import { create } from 'zustand'
import { defaultResumeData } from '../schema'
import type { ResumeData } from '../schema'
import { deepClone } from '../utils/deepClone'

export type ArtboardStore = {
  resume: ResumeData
  setResume: (resume: ResumeData) => void
}

export const useArtboardStore = create<ArtboardStore>()((set) => ({
  resume: deepClone(defaultResumeData),
  setResume: (resume) => set({ resume }),
}))

export const setArtboardResume = (resume: ResumeData) => {
  useArtboardStore.setState({ resume: deepClone(resume) })
}

export const resetArtboardResume = () => {
  useArtboardStore.setState({ resume: deepClone(defaultResumeData) })
}
