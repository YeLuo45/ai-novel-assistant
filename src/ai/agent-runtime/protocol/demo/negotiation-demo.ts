/**
 * protocol/demo/negotiation-demo.ts (V2381)
 */

import {
  ManagedAgentRuntime,
  PLOT_ADVISOR_TEMPLATE,
  STYLE_COACH_TEMPLATE,
  DIALOGUE_MASTER_TEMPLATE,
  CRITIC_MASTER_TEMPLATE,
  CONTINUITY_GUARD_TEMPLATE,
  createBuiltinTeamIds,
  builtinTemplateByIndex,
} from '../../index'
import { AgentMessageBus as BusCtor } from '../AgentMessageBus'
import { NegotiationRoom, VoteCollector, buildConsensus, resolveConflict, type VoteRecord, type NegotiationProposal } from '../NegotiationAndDelegation'

/** 启动完整 5 agent 协商 demo */
export function startNegotiationDemo(): {
  runtime: ManagedAgentRuntime
  bus: InstanceType<typeof BusCtor>
  room: NegotiationRoom
  votes: VoteCollector
  team: string[]
} {
  const runtime = new ManagedAgentRuntime()
  const room = new NegotiationRoom()
  const votes = new VoteCollector()

  // spawn 5 agent
  const teamIds = createBuiltinTeamIds()
  for (let i = 0; i < teamIds.length; i++) {
    runtime.spawn({ template: builtinTemplateByIndex(i), agentId: teamIds[i] })
  }
  return { runtime, bus: new BusCtor(), room, votes, team: teamIds }
}

/** 模拟一轮协商：plot 提议 → 全员投票 → 多数通过 */
export function simulateProposal(
  rt: ManagedAgentRuntime,
  bus: InstanceType<typeof BusCtor>,
  room: NegotiationRoom,
  votes: VoteCollector,
  proposal: string,
  voters: string[],
): {
  proposalId: string
  votes: number
  consensus: ReturnType<typeof buildConsensus>
  conflict: ReturnType<typeof resolveConflict<number>> | null
} {
  // 1. plot 提议
  const plotId = voters[0]
  const p = room.open(plotId, proposal, { style: 'tight' }, { participants: voters })
  // 2. 全员投票
  voters.forEach((v, i) => {
    const record: VoteRecord = {
      voter: v,
      choice: i % 2 === 0 ? 'yes' : 'no',
      weight: 1,
      votedAt: Date.now(),
    }
    votes.record(p.proposalId, record)
  })
  // 3. 计算共识
  const v = votes.votesFor(p.proposalId)
  const consensus = buildConsensus(v, 'majority')
  // 4. 如果没共识，做 conflict resolution
  let conflict: ReturnType<typeof resolveConflict<number>> | null = null
  if (!consensus.reached) {
    conflict = resolveConflict<number>(
      v.map((vote: VoteRecord, i: number) => ({ source: vote.voter, value: i })),
      'first-wins',
    )
  }
  return { proposalId: p.proposalId, votes: v.length, consensus, conflict }
}

/** 完整 demo 入口 */
export function runNegotiationDemo(): {
  teamSize: number
  proposalAccepted: boolean
  votes: number
  consensusReached: boolean
  winner?: string
} {
  const { runtime, bus, room, votes, team } = startNegotiationDemo()
  const result = simulateProposal(
    runtime,
    bus,
    room,
    votes,
    'Use shorter chapters for better pacing',
    team,
  )
  return {
    teamSize: team.length,
    proposalAccepted: result.consensus.reached,
    votes: result.votes,
    consensusReached: result.consensus.reached,
    winner: result.consensus.choice,
  }
}
