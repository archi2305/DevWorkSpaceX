declare module 'frappe-gantt' {
  export type FrappeGanttTask = {
    id: string
    name: string
    start: string
    end: string
    progress?: number
    dependencies?: string | string[]
    custom_class?: string
    project?: string
    type?: string
    sourceId?: string
  }

  export type FrappeGanttViewMode = {
    name: string
    padding?: string
    step?: string
    date_format?: string
    column_width?: number
    lower_text?: string | ((currentDate: Date, previousDate: Date | null, language: string) => string)
    upper_text?: string | ((currentDate: Date, previousDate: Date | null, language: string) => string)
    upper_text_frequency?: number
    thick_line?: (currentDate: Date) => boolean
    snap_at?: string
  }

  export type FrappeGanttOptions = {
    view_mode?: string | FrappeGanttViewMode
    view_modes?: FrappeGanttViewMode[]
    readonly?: boolean
    readonly_dates?: boolean
    readonly_progress?: boolean
    move_dependencies?: boolean
    view_mode_select?: boolean
    popup_on?: 'click' | 'hover'
    container_height?: number | 'auto'
    bar_height?: number
    padding?: number
    scroll_to?: string
    on_date_change?: (task: FrappeGanttTask, start: Date, end: Date) => void
    on_progress_change?: (task: FrappeGanttTask, progress: number) => void
    on_click?: (task: FrappeGanttTask) => void
    popup?: false | ((ctx: any) => string | false | undefined)
  }

  export default class Gantt {
    constructor(element: Element | string, tasks: FrappeGanttTask[], options?: FrappeGanttOptions)
    refresh(tasks: FrappeGanttTask[]): void
    update_options(options: Partial<FrappeGanttOptions>): void
    change_view_mode(mode?: string | FrappeGanttViewMode, maintain_pos?: boolean): void
  }
}
