// V2136 TransactionLog - Direction A Iter 21/30
// 事务日志 - ACID 语义
// Source: ruflo (transaction pattern)

export type TxStatus = 'pending' | 'committed' | 'aborted' | 'in_progress';

export interface Transaction {
  txId: string;
  status: TxStatus;
  operations: { kind: string; data: unknown }[];
  startedAt: number;
  finishedAt?: number;
}

export interface TransactionLogState {
  transactions: Map<string, Transaction>;
  activeTx: Set<string>;
}

export function createTxLogState(): TransactionLogState {
  return { transactions: new Map(), activeTx: new Set() };
}

/** Begin a new transaction */
export function beginTx(state: TransactionLogState, txId: string): TransactionLogState {
  const tx: Transaction = { txId, status: 'in_progress', operations: [], startedAt: Date.now() };
  const transactions = new Map(state.transactions);
  transactions.set(txId, tx);
  const activeTx = new Set(state.activeTx);
  activeTx.add(txId);
  return { transactions, activeTx };
}

/** Add operation to a transaction */
export function addOp(state: TransactionLogState, txId: string, kind: string, data: unknown): TransactionLogState {
  const tx = state.transactions.get(txId);
  if (!tx || tx.status !== 'in_progress') return state;
  const updated: Transaction = { ...tx, operations: [...tx.operations, { kind, data }] };
  const transactions = new Map(state.transactions);
  transactions.set(txId, updated);
  return { transactions, activeTx: state.activeTx };
}

/** Commit transaction */
export function commitTx(state: TransactionLogState, txId: string): TransactionLogState {
  const tx = state.transactions.get(txId);
  if (!tx || tx.status !== 'in_progress') return state;
  const updated: Transaction = { ...tx, status: 'committed' as const, finishedAt: Date.now() };
  const transactions = new Map(state.transactions);
  transactions.set(txId, updated);
  const activeTx = new Set(state.activeTx);
  activeTx.delete(txId);
  return { transactions, activeTx };
}

/** Abort transaction */
export function abortTx(state: TransactionLogState, txId: string): TransactionLogState {
  const tx = state.transactions.get(txId);
  if (!tx) return state;
  const updated: Transaction = { ...tx, status: 'aborted' as const, finishedAt: Date.now() };
  const transactions = new Map(state.transactions);
  transactions.set(txId, updated);
  const activeTx = new Set(state.activeTx);
  activeTx.delete(txId);
  return { transactions, activeTx };
}

/** Get transaction by id */
export function getTx(state: TransactionLogState, txId: string): Transaction | undefined {
  return state.transactions.get(txId);
}

/** Get all active transactions */
export function activeTransactions(state: TransactionLogState): Transaction[] {
  return Array.from(state.activeTx).map((id) => state.transactions.get(id)!).filter(Boolean);
}

/** Count transactions by status */
export function txCountByStatus(state: TransactionLogState): Record<TxStatus, number> {
  const counts: Record<TxStatus, number> = { pending: 0, committed: 0, aborted: 0, in_progress: 0 };
  for (const tx of state.transactions.values()) counts[tx.status]++;
  return counts;
}

/** ACID master metric */
export function transactionHealth(state: TransactionLogState): {
  total: number;
  committed: number;
  aborted: number;
  atomicity: number;
  health: number;
} {
  const counts = txCountByStatus(state);
  const total = state.transactions.size;
  const committed = counts.committed;
  const aborted = counts.aborted;
  const atomicity = total > 0 ? committed / (committed + aborted) : 1;
  return { total, committed, aborted, atomicity, health: atomicity };
}
