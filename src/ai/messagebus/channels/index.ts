/**
 * Channel exports
 * V42: Event-driven architecture channels
 */

export { Channel, InMemoryChannel, createChannel } from './Channel'
export type { ChannelOptions } from './Channel'

export { ChannelRegistry, channelRegistry } from './ChannelRegistry'

export { WriteChannel, writeChannel } from './WriteChannel'
export { ChapterChannel, chapterChannel } from './ChapterChannel'
export { DialogueChannel, dialogueChannel } from './DialogueChannel'
export { ReviewChannel, reviewChannel } from './ReviewChannel'
export { AgentChannel, agentChannel } from './AgentChannel'