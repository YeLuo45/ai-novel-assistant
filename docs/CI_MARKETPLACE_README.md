# CI — Marketplace for Plugins 2.0

**30 engines · 178 tests · 100% pass · ≥98% coverage**

视觉/生态 pillar 第二个方向 — 完整插件市场交易 + 货币化 + 安装 + 统计。

## Engines (V4826-V4855)

### Batch 1/3 — Core (V4826-V4835)
- MarketplaceCore: 插件注册中心 + 多币种收入
- StoreFront: 商店门面 + 3 layouts + 特色
- PluginListing: 详细插件页 + 完整性检查
- Category: 分类 + 父子层级
- PricingTier: 多档定价
- SubscriptionModel: 4 周期订阅 (monthly/quarterly/annual/lifetime)
- PaymentProcessor: 6 支付方式 + 安全限额
- InvoiceGenerator: 发票 + 税率
- LicenseKey: FNV-1a 哈希 + MP-前缀 key + revoke
- ReceiptTracker: 收据 + per-buyer total

### Batch 2/3 — Advanced (V4836-V4845)
- ReviewSystem: 4 状态 (pending/approved/rejected/flagged) + 审核员
- RatingEngine: 1-5 星 + 直方图 + 分布
- RecommendationEngine: 协同过滤 + Jaccard 相似度
- FeaturedSection: 排序 + promote + 过期
- TrendingSection: views+downloads+purchases 加权 + 4 周期
- BundlePackage: 多插件包 + 折扣
- DiscountCode: 4 类型 + 最大使用 + 最低订单
- GiftCard: 余额 + 部分/全额 redeem
- AffiliateTracker: AFF- 前缀 + 佣金 0-50%
- RefundProcessor: 5 原因 + auto-approve + approve/deny

### Batch 3/3 — Integration (V4846-V4855)
- SellerAccount: 4 tiers + verification + payout tracking
- BuyerDashboard: 购买历史 + 多币种 + 观看记录
- Wishlist: 加购 + 价格预警 + 降价提醒
- ComparisonTool: 2-8 插件并排对比 + 矩阵
- SearchFilter: query+category+price range+min rating+tags + 4 排序
- RevenueAnalytics: 卖家+币种 + topSellers + topPlugins + byPeriod
- PluginInstaller: 5 states + complete/uninstall/disable/enable
- AutoUpdater: 3 channels + Semver + updateAll
- CompatibilityMatrix: plugin×platform + 冲突检测
- MarketplaceIntegration: orchestrator + history + purchase pipeline

## 测试命令

```bash
npx vitest run src/ai/marketplace/
```

## 文件位置

- `src/ai/marketplace/MarketplaceCore.ts` — Batch 1 (10 engines)
- `src/ai/marketplace/MarketplaceAdvanced.ts` — Batch 2 (10 engines)
- `src/ai/marketplace/MarketplaceIntegration.ts` — Batch 3 (10 engines)

## 关键 Pitfall

- **register 返回 boolean**: 不能 chain `.register().verify()` → 拆成两行
- **install 返回 object**: 不能 chain `.install().complete()` → 拆成两行
- **record 返回 void**: 不能 chain `.record().record()` → 拆成多行