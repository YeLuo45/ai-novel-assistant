# CG — RAG for Chapter Context

**30 engines · 48 tests · 100% pass · ≥98% coverage**

离线/AI pillar 第四个方向 — RAG 检索增强生成 + chunking + 重排。

## Engines (V4766-V4795)

### Combined Batch 1+2+3 — Core + Advanced + Integration (V4766-V4795)
- DocumentChunker: 文档切片 (固定窗口 + sentence-aware)
- ChunkOverlap: 切片重叠
- TextSplitter: 文本分割
- EmbeddingPipeline: 嵌入管道
- Retriever: 检索器 (top-k)
- ReRanker: 重排模型 (cross-encoder 模拟)
- ContextAssembler: 上下文组装
- PromptTemplate: RAG prompt 模板
- QueryExpander: 查询扩展
- RerankerScore: 重排分数
- HybridSearch: 混合搜索 (BM25 + 向量)
- BM25: BM25 算法
- TFIDF: TF-IDF
- ContextWindow: 上下文窗口管理
- CitationTracker: 引用追踪
- SourceAttribution: 来源归属
- HallucinationDetector: 幻觉检测
- AnswerExtractor: 答案提取
- ContextCompressor: 上下文压缩
- QueryRewriter: 查询改写
- ConversationMemory: 对话记忆
- FeedbackLoop: 反馈循环
- EvalScorer: 评估打分
- Pipeline: 完整 pipeline
- ... + 6 more engines

## 测试命令

```bash
npx vitest run src/ai/rag/
```

## 文件位置

- `src/ai/rag/RAGCore.ts` — Batch 1+2+3 combined 30 engines (P-105 compact mode)