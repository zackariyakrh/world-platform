export interface AutomationData {
  id: string
  name: string
  description: string | null
  isEnabled: boolean
  trigger: string
  actions: string
  creatorId: string
  createdAt: string
}

export interface AutomationSaveData {
  id?: string
  name: string
  description: string | null
  isEnabled: boolean
  trigger: string
  actions: string
}
