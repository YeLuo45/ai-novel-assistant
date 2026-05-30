import { db, Milestone, ReminderSettings, WritingStats } from '../db'

// Default reminder settings
const DEFAULT_REMINDER_SETTINGS: Omit<ReminderSettings, 'id' | 'projectId'> = {
  enabled: true,
  dailyReminderTime: '20:00',
  reminderDays: [1, 2, 3, 4, 5, 6, 0], // Every day by default
  autoRemindMilestones: true,
  minWordCountForReminder: 500, // Only remind if less than 500 words written today
  createdAt: new Date(),
  updatedAt: new Date()
}

// Check if today is a reminder day
function isReminderDay(reminderDays: number[]): boolean {
  const today = new Date().getDay()
  return reminderDays.includes(today)
}

// Get today's date string
function getTodayDateStr(): string {
  return new Date().toISOString().split('T')[0]
}

// Get current time string
function getCurrentTimeStr(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

// Check if it's time for a reminder
function isReminderTime(reminderTime: string): boolean {
  const current = getCurrentTimeStr()
  const [remHour, remMin] = reminderTime.split(':').map(Number)
  const [curHour, curMin] = current.split(':').map(Number)
  
  if (curHour > remHour) return true
  if (curHour === remHour && curMin >= remMin) return true
  return false
}

// Calculate today's progress
async function getTodayProgress(projectId: number): Promise<{ wordCount: number; goalMet: boolean }> {
  const today = getTodayDateStr()
  const todayStat = await db.writingStats
    .where(['projectId', 'date'])
    .equals([projectId, today])
    .first()
  
  return {
    wordCount: todayStat?.wordCount || 0,
    goalMet: false // This is just today's count, goal checking is done elsewhere
  }
}

// Get upcoming milestones (within next N days)
async function getUpcomingMilestones(projectId: number, withinDays: number = 7): Promise<Milestone[]> {
  const today = new Date()
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + withinDays)
  
  const todayStr = getTodayDateStr()
  const futureStr = futureDate.toISOString().split('T')[0]
  
  const milestones = await db.milestones
    .where('projectId')
    .equals(projectId)
    .filter(m => 
      m.status === 'pending' && 
      m.targetDate >= todayStr && 
      m.targetDate <= futureStr
    )
    .toArray()
  
  return milestones.sort((a, b) => a.targetDate.localeCompare(b.targetDate))
}

// Get overdue milestones
async function getOverdueMilestones(projectId: number): Promise<Milestone[]> {
  const today = getTodayDateStr()
  
  const milestones = await db.milestones
    .where('projectId')
    .equals(projectId)
    .filter(m => m.status === 'pending' && m.targetDate < today)
    .toArray()
  
  return milestones.sort((a, b) => a.targetDate.localeCompare(b.targetDate))
}

// Reminder message type
export interface ReminderMessage {
  projectId: number
  projectTitle: string
  type: 'daily_reminder' | 'milestone_reminder'
  title: string
  body: string
  todayWords: number
  upcomingMilestones: Milestone[]
  overdueMilestones: Milestone[]
}

// ReminderService class
export class ReminderService {
  private checkInterval: number | null = null
  private onReminderCallback: ((message: ReminderMessage) => void) | null = null
  private currentSettings: {
    projectId: number
    enabled: boolean
    dailyReminderTime: string
    reminderDays: number[]
    autoRemindMilestones: boolean
    minWordCountForReminder: number
  } | null = null

  // Set the reminder callback
  setCallback(callback: (message: ReminderMessage) => void): void {
    this.onReminderCallback = callback
  }

  // Start the reminder service with settings
  start(settings: {
    projectId: number
    enabled: boolean
    dailyReminderTime: string
    reminderDays: number[]
    autoRemindMilestones: boolean
    minWordCountForReminder: number
  }): void {
    this.currentSettings = settings
    
    // Check immediately
    this.checkReminders()
    
    // Then check every minute
    this.checkInterval = window.setInterval(() => {
      this.checkReminders()
    }, 60000)
  }

  // Stop the reminder service
  stop(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.onReminderCallback = null
  }

  // Check if reminders should be shown
  async checkReminders(): Promise<void> {
    if (!this.onReminderCallback) return

    const projects = await db.projects.toArray()
    
    for (const project of projects) {
      if (!project.id) continue
      
      const settings = await this.getReminderSettings(project.id)
      if (!settings.enabled) continue
      
      // Check if today is a reminder day
      if (!isReminderDay(settings.reminderDays)) continue
      
      // Check if it's time for reminder
      if (!isReminderTime(settings.dailyReminderTime)) continue
      
      // Check today's progress
      const { wordCount } = await getTodayProgress(project.id)
      
      // Check if reminder should be shown based on progress
      if (wordCount >= settings.minWordCountForReminder) continue
      
      // Build reminder message
      const message = await this.buildReminderMessage(project.id, project.title, wordCount, settings)
      if (message) {
        this.onReminderCallback(message)
      }
    }
  }

  // Build reminder message
  private async buildReminderMessage(
    projectId: number, 
    projectTitle: string, 
    todayWords: number,
    settings: ReminderSettings
  ): Promise<ReminderMessage | null> {
    const parts: string[] = []
    
    // Daily reminder
    const goalInfo = todayWords > 0 
      ? `今日已写 ${todayWords} 字`
      : '今日还没有开始写作'
    
    parts.push(`📝 **${projectTitle}**\n${goalInfo}`)
    
    // Check milestones if enabled
    if (settings.autoRemindMilestones) {
      const upcomingMilestones = await getUpcomingMilestones(projectId, 7)
      const overdueMilestones = await getOverdueMilestones(projectId)
      
      if (overdueMilestones.length > 0) {
        parts.push(`\n⚠️ **逾期里程碑:** ${overdueMilestones.length}个`)
        overdueMilestones.slice(0, 2).forEach(m => {
          parts.push(`  - ${m.title} (${m.targetDate})`)
        })
      }
      
      if (upcomingMilestones.length > 0) {
        parts.push(`\n📅 **即将到期 (7天内):** ${upcomingMilestones.length}个`)
        upcomingMilestones.slice(0, 2).forEach(m => {
          const daysLeft = Math.ceil(
            (new Date(m.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          parts.push(`  - ${m.title} (${daysLeft}天后)`)
        })
      }
    }
    
    return {
      projectId,
      projectTitle,
      type: 'daily_reminder',
      title: '写作提醒',
      body: parts.join('\n'),
      todayWords,
      upcomingMilestones: settings.autoRemindMilestones ? await getUpcomingMilestones(projectId, 7) : [],
      overdueMilestones: settings.autoRemindMilestones ? await getOverdueMilestones(projectId) : []
    }
  }

  // Get or create reminder settings for a project
  async getReminderSettings(projectId: number): Promise<ReminderSettings> {
    let settings = await db.reminderSettings
      .where('projectId')
      .equals(projectId)
      .first()
    
    if (!settings) {
      const id = await db.reminderSettings.add({
        projectId,
        ...DEFAULT_REMINDER_SETTINGS
      })
      settings = { ...DEFAULT_REMINDER_SETTINGS, id: id as number, projectId }
    }
    
    return settings
  }

  // Update reminder settings
  async updateReminderSettings(
    projectId: number, 
    updates: Partial<Omit<ReminderSettings, 'id' | 'projectId' | 'createdAt'>>
  ): Promise<void> {
    const existing = await db.reminderSettings
      .where('projectId')
      .equals(projectId)
      .first()
    
    if (existing && existing.id) {
      await db.reminderSettings.update(existing.id, {
        ...updates,
        updatedAt: new Date()
      })
    } else {
      await db.reminderSettings.add({
        projectId,
        ...DEFAULT_REMINDER_SETTINGS,
        ...updates,
        updatedAt: new Date()
      })
    }
  }

  // Check and update milestone statuses
  async checkMilestoneStatuses(projectId: number): Promise<void> {
    const today = getTodayDateStr()
    const milestones = await db.milestones
      .where('projectId')
      .equals(projectId)
      .filter(m => m.status === 'pending')
      .toArray()
    
    for (const milestone of milestones) {
      if (!milestone.id) continue
      
      if (milestone.targetDate < today) {
        // Mark as missed
        await db.milestones.update(milestone.id, { status: 'missed' })
      }
    }
  }

  // Record that we've shown a reminder today (to avoid spamming)
  private reminderShownKey(projectId: number): string {
    return `reminder_shown_${projectId}_${getTodayDateStr()}`
  }

  async hasShownReminderToday(projectId: number): Promise<boolean> {
    const key = this.reminderShownKey(projectId)
    return localStorage.getItem(key) === 'true'
  }

  async markReminderShown(projectId: number): Promise<void> {
    const key = this.reminderShownKey(projectId)
    localStorage.setItem(key, 'true')
  }
}

// Singleton instance
export const reminderService = new ReminderService()
