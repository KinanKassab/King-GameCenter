import { create } from 'zustand'
import type { Screen, Section, DeviceType, Session, PlayMode } from '@/types/database'

interface ScreenStore {
  screens: Screen[]
  sections: Section[]
  deviceTypes: DeviceType[]
  playModes: PlayMode[]
  filterSection: string | null
  filterDeviceType: string | null
  viewMode: 'grid' | 'list'
  setScreens: (screens: Screen[]) => void
  updateScreen: (id: string, patch: Partial<Screen>) => void
  setSections: (sections: Section[]) => void
  setDeviceTypes: (deviceTypes: DeviceType[]) => void
  setPlayModes: (playModes: PlayMode[]) => void
  setFilterSection: (id: string | null) => void
  setFilterDeviceType: (id: string | null) => void
  setViewMode: (mode: 'grid' | 'list') => void
}

export const useScreenStore = create<ScreenStore>(set => ({
  screens: [],
  sections: [],
  deviceTypes: [],
  playModes: [],
  filterSection: null,
  filterDeviceType: null,
  viewMode: 'grid',
  setScreens: screens => set({ screens }),
  updateScreen: (id, patch) =>
    set(state => ({
      screens: state.screens.map(s => (s.id === id ? { ...s, ...patch } : s)),
    })),
  setSections: sections => set({ sections }),
  setDeviceTypes: deviceTypes => set({ deviceTypes }),
  setPlayModes: playModes => set({ playModes }),
  setFilterSection: filterSection => set({ filterSection }),
  setFilterDeviceType: filterDeviceType => set({ filterDeviceType }),
  setViewMode: viewMode => set({ viewMode }),
}))
