import { api } from './api'

export interface CustomFieldDefinition {
  id: string
  name: string
  field_type: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Checkbox' | 'URL'
  target_type: 'Project' | 'Task'
  options: string[] | null
  created_at: string
  updated_at: string
}

export interface CustomFieldValue {
  id: string
  field_definition_id: string
  entity_id: string
  value: { val: any } | null
  created_at: string
  updated_at: string
}

export const customFieldService = {
  /**
   * Create a new custom field definition.
   */
  async createDefinition(data: {
    name: string
    field_type: 'Text' | 'Number' | 'Date' | 'Dropdown' | 'Checkbox' | 'URL'
    target_type: 'Project' | 'Task'
    options?: string[]
  }): Promise<CustomFieldDefinition> {
    const response = await api.post<CustomFieldDefinition>('/custom-fields/definitions', data)
    return response.data
  },

  /**
   * Get all custom field definitions.
   */
  async getDefinitions(targetType?: 'Project' | 'Task'): Promise<CustomFieldDefinition[]> {
    const response = await api.get<CustomFieldDefinition[]>('/custom-fields/definitions', {
      params: targetType ? { target_type: targetType } : {}
    })
    return response.data
  },

  /**
   * Delete a custom field definition.
   */
  async deleteDefinition(id: string): Promise<void> {
    await api.delete(`/custom-fields/definitions/${id}`)
  },

  /**
   * Save or update a custom field value for an entity (Project/Task).
   */
  async saveFieldValue(data: {
    field_definition_id: string
    entity_id: string
    value: { val: any }
  }): Promise<CustomFieldValue> {
    const response = await api.post<CustomFieldValue>('/custom-fields/values', data)
    return response.data
  },

  /**
   * Get all custom field values assigned to a Project or Task.
   */
  async getFieldValues(entityId: string): Promise<CustomFieldValue[]> {
    const response = await api.get<CustomFieldValue[]>(`/custom-fields/values/${entityId}`)
    return response.data
  }
}
