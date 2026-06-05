/**
 * V838 AgentCommunicationCore — Direction A Iter 6/9 (Round 4)
 * Agent communication core: inter-agent messaging + coordination
 * Sources: chatdev multi-agent + nanobot swarm + thunderbolt
 */

export type MessageType = 'request' | 'response' | 'inform' | 'query' | 'propose' | 'agree' | 'reject';
export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'processed' | 'failed';

export interface Message {
  messageId: string;
  fromAgentId: string;
  toAgentId: string;
  type: MessageType;
  priority: MessagePriority;
  status: MessageStatus;
  content: string;
  context: string;
  timestamp: number;
  responseTo: string | null;
}

export interface Channel {
  channelId: string;
  name: string;
  participants: string[];
  topic: string;
  messageCount: number;
  active: boolean;
}

export interface AgentCommunicationCoreState {
  messages: Map<string, Message>;
  channels: Map<string, Channel>;
  totalMessages: number;
  totalChannels: number;
  processedMessages: number;
  failedMessages: number;
  averageResponseTime: number;
  channelActivity: number;
  communicationEfficiency: number;
  networkConnectivity: number;
}

// Factory
export function createAgentCommunicationCoreState(): AgentCommunicationCoreState {
  return {
    messages: new Map(),
    channels: new Map(),
    totalMessages: 0,
    totalChannels: 0,
    processedMessages: 0,
    failedMessages: 0,
    averageResponseTime: 0,
    channelActivity: 0,
    communicationEfficiency: 0.5,
    networkConnectivity: 0,
  };
}

// Send message
export function sendMessage(
  state: AgentCommunicationCoreState,
  messageId: string,
  fromAgentId: string,
  toAgentId: string,
  type: MessageType,
  content: string,
  context: string = '',
  priority: MessagePriority = 'normal',
  responseTo: string | null = null
): AgentCommunicationCoreState {
  const message: Message = {
    messageId, fromAgentId, toAgentId, type, priority,
    status: 'sent', content, context, timestamp: Date.now(), responseTo,
  };
  const messages = new Map(state.messages).set(messageId, message);
  return recomputeCommunication({ ...state, messages, totalMessages: messages.size });
}

// Process message
export function processMessage(state: AgentCommunicationCoreState, messageId: string, success: boolean): AgentCommunicationCoreState {
  const message = state.messages.get(messageId);
  if (!message) return state;

  const updated: Message = { ...message, status: success ? 'processed' : 'failed' };
  const messages = new Map(state.messages).set(messageId, updated);
  const processedMessages = success ? state.processedMessages + 1 : state.processedMessages;
  const failedMessages = success ? state.failedMessages : state.failedMessages + 1;
  return recomputeCommunication({ ...state, messages, processedMessages, failedMessages });
}

// Create channel
export function createChannel(
  state: AgentCommunicationCoreState,
  channelId: string,
  name: string,
  participants: string[],
  topic: string
): AgentCommunicationCoreState {
  const channel: Channel = { channelId, name, participants, topic, messageCount: 0, active: true };
  const channels = new Map(state.channels).set(channelId, channel);
  return recomputeCommunication({ ...state, channels, totalChannels: channels.size });
}

// Get messages by agent
export function getMessagesByAgent(state: AgentCommunicationCoreState, agentId: string): Message[] {
  return Array.from(state.messages.values()).filter(m => m.fromAgentId === agentId || m.toAgentId === agentId);
}

// Get messages by type
export function getMessagesByType(state: AgentCommunicationCoreState, type: MessageType): Message[] {
  return Array.from(state.messages.values()).filter(m => m.type === type);
}

// Get communication report
export function getCommunicationCoreReport(state: AgentCommunicationCoreState): {
  totalMessages: number;
  totalChannels: number;
  processedMessages: number;
  failedMessages: number;
  communicationEfficiency: number;
  networkConnectivity: number;
  recommendations: string[];
} {
  const recommendations: string[] = [];
  if (state.totalMessages === 0) recommendations.push('No messages — start communication');
  if (state.communicationEfficiency < 0.5) recommendations.push('Low efficiency — improve');
  if (state.networkConnectivity < 0.3) recommendations.push('Low connectivity — expand network');

  return {
    totalMessages: state.totalMessages,
    totalChannels: state.totalChannels,
    processedMessages: state.processedMessages,
    failedMessages: state.failedMessages,
    communicationEfficiency: Math.round(state.communicationEfficiency * 100) / 100,
    networkConnectivity: Math.round(state.networkConnectivity * 100) / 100,
    recommendations,
  };
}

// Recompute metrics
function recomputeCommunication(state: AgentCommunicationCoreState): AgentCommunicationCoreState {
  const messages = Array.from(state.messages.values());
  const communicationEfficiency = state.totalMessages === 0 ? 0.5
    : state.processedMessages / state.totalMessages;

  // Network connectivity: how many unique agent pairs are connected
  const agentSet = new Set<string>();
  messages.forEach(m => {
    agentSet.add(m.fromAgentId);
    agentSet.add(m.toAgentId);
  });
  const agentCount = agentSet.size;
  const maxPairs = agentCount * (agentCount - 1);
  const uniquePairs = new Set<string>();
  messages.forEach(m => uniquePairs.add([m.fromAgentId, m.toAgentId].sort().join('-')));
  const networkConnectivity = maxPairs === 0 ? 0 : uniquePairs.size / maxPairs;

  // Channel activity
  const channelActivity = state.totalChannels === 0 ? 0
    : Math.min(1, state.totalMessages / Math.max(1, state.totalChannels * 5));

  return { ...state, communicationEfficiency, networkConnectivity, channelActivity };
}

// Reset communication state
export function resetAgentCommunicationCoreState(): AgentCommunicationCoreState {
  return createAgentCommunicationCoreState();
}