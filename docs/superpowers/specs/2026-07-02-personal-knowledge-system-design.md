# 个人成长知识管理系统 - 设计文档

**日期**: 2026-07-02  
**版本**: v1.0  
**状态**: 已确认

---

## 1. 项目概述

### 1.1 目标
构建一个树状层级结构的个人知识管理系统，支持多端访问（手机/平板/电脑），各子系统之间既能独立运作又能通过关联引用形成知识网络。

### 1.2 核心系统结构

```
个人成长总系统
├── 学习系统
│   ├── 知识系统
│   ├── 方法系统
│   ├── 防漏系统
│   ├── 改错系统
│   └── 不足之处/可优化系统
├── 性格系统
│   ├── 性格认知系统
│   └── 不足之处系统
├── 人际交往系统
│   ├── 人际交往能力认知
│   ├── 不足之处系统
│   └── 方法系统
├── 安全系统
│   └── 车辆使用常识系统（可扩展）
├── 目标愿望系统
│   ├── 目标管理
│   └── 愿望追踪
└── 灵感系统
    ├── 随手记录
    └── 灵感归档
```

### 1.3 关键特性
- 树状层级导航 + 知识网络图可视化
- 富媒体内容支持（文字、图片、链接、代码、文件）
- 节点间关联引用（双向链接）
- AI 智能助手（自动分类、关联建议、内容增强）
- 多端响应式适配
- 自建后端 + 数据持久化

---

## 2. 系统架构

### 2.1 技术架构图

```
用户端（浏览器/手机/平板）
    │
    ▼
┌─────────────────────────────────────────┐
│  Next.js App Router (React + Tailwind)  │
│  - 页面路由与组件渲染                    │
│  - 响应式布局（手机/平板/电脑自适应）    │
│  - 知识网络图可视化 (React Flow)         │
│  - 富文本编辑器 (TipTap)                │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Next.js API Routes (Serverless)        │
│  - /api/nodes      节点增删改查         │
│  - /api/edges      关联关系管理         │
│  - /api/content    内容管理             │
│  - /api/upload     文件上传             │
│  - /api/search     全文搜索             │
│  - /api/ai/*       AI 智能助手接口      │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Prisma ORM                             │
│  - 类型安全的数据库操作                  │
│  - 自动迁移管理                          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  PostgreSQL (Neon/Supabase 免费层)      │
│  - 节点树结构存储                        │
│  - 内容数据存储                          │
│  - 关联关系存储                          │
│  - 文件元数据存储                        │
└─────────────────────────────────────────┘
```

### 2.2 技术选型

| 技术 | 用途 | 选型理由 |
|------|------|---------|
| Next.js 14+ (App Router) | 全栈框架 | iga-pages 原生支持，API Routes 搞定后端，SSR/SSG 可选 |
| React 18+ | UI 库 | 组件化开发，生态丰富 |
| Tailwind CSS | 样式框架 | 响应式开发极快，手机/平板/电脑一套代码 |
| React Flow | 网络图可视化 | 节点拖拽、连线、缩放，知识图谱专用库 |
| TipTap | 富文本编辑器 | 支持图片/链接/代码块，可扩展 Markdown，输出 JSON |
| Prisma | ORM | 类型安全，自动迁移，开发体验优秀 |
| PostgreSQL | 数据库 | Neon/Supabase 免费层够用，支持 JSON 字段 |
| Zod | 数据校验 | TypeScript 友好，API 参数校验 |
| shadcn/ui | 组件库 | 基于 Tailwind，可复用基础组件 |

---

## 3. 数据模型

### 3.1 实体关系图

```
Node (节点树)
  │ self-relation (parentId)
  │ 1:N
  ▼
Content (内容)
  │ 1:N
  ▼
Attachment (附件)

Node N:M Node (via Edge)
```

### 3.2 数据库表结构

#### Node 表（节点/系统树）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (UUID) | PK | 主键 |
| name | String | NOT NULL | 节点名称 |
| type | Enum | NOT NULL | ROOT / SYSTEM / SUBSYSTEM / TOPIC |
| parentId | String? | FK | 父节点ID，自关联形成树 |
| color | String? | | 节点主题色（可视化用） |
| sortOrder | Int | DEFAULT 0 | 同级排序 |
| createdAt | DateTime | DEFAULT now() | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

#### Content 表（内容）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (UUID) | PK | 主键 |
| nodeId | String | FK, NOT NULL | 所属节点 |
| title | String? | | 内容标题 |
| body | JSON | NOT NULL | TipTap JSON 格式富文本 |
| type | Enum | DEFAULT NOTE | NOTE / TODO / CODE / LINK / CHECKLIST |
| tags | String[] | DEFAULT [] | 标签数组 |
| createdAt | DateTime | DEFAULT now() | 创建时间 |
| updatedAt | DateTime | AUTO UPDATE | 更新时间 |

#### Edge 表（关联关系）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (UUID) | PK | 主键 |
| sourceId | String | FK, NOT NULL | 源节点 |
| targetId | String | FK, NOT NULL | 目标节点 |
| label | String? | | 关联标签，如"影响"、"补充" |
| createdAt | DateTime | DEFAULT now() | 创建时间 |

#### Attachment 表（附件）
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | String (UUID) | PK | 主键 |
| contentId | String | FK, NOT NULL | 所属内容 |
| fileName | String | NOT NULL | 文件名 |
| fileUrl | String | NOT NULL | 存储URL |
| fileType | String | NOT NULL | MIME类型 |
| fileSize | Int | NOT NULL | 文件大小(字节) |
| createdAt | DateTime | DEFAULT now() | 创建时间 |

### 3.3 索引设计

- `Node(parentId, sortOrder)` - 树查询优化
- `Content(nodeId, updatedAt DESC)` - 节点内容列表
- `Edge(sourceId, targetId)` - 关联查询
- `Content(tags)` GIN 索引 - 标签搜索

---

## 4. 页面结构

### 4.1 全局布局

```
┌─────────────────────────────────────────────┐
│ 顶部导航栏                                   │
│ [Logo] [搜索框] [树视图<>网络视图] [+添加]   │
├─────────┬───────────────────────────────────┤
│         │                                   │
│ 左侧     │         主内容区                   │
│ 边栏     │                                   │
│ (可折叠) │  • 树视图：内容列表 + 子节点概览   │
│         │  • 网络视图：React Flow 知识图谱   │
│ 树形     │                                   │
│ 导航     │         右侧详情抽屉               │
│ 菜单     │         (内容编辑/查看)            │
│         │                                   │
└─────────┴───────────────────────────────────┘
```

### 4.2 页面清单

| 页面/路由 | 说明 | 视图模式 |
|----------|------|---------|
| `/` | 首页，默认显示总系统下的内容 | 树视图 |
| `/network` | 全局知识网络图 | 网络视图 |
| `/node/[id]` | 特定节点下的内容和子节点 | 树视图 |
| `/node/[id]/network` | 以某节点为中心的局部网络图 | 网络视图 |
| `/search?q=keyword` | 搜索结果页 | 列表视图 |
| `/inspiration` | 灵感速记页面（AI辅助） | 快速输入视图 |

### 4.3 多端布局策略

| 设备 | 断点 | 布局 |
|------|------|------|
| 手机 | < 768px | 底部Tab导航，侧边栏默认隐藏，内容全屏查看 |
| 平板 | 768px - 1024px | 左侧可收起边栏，主内容区，支持分屏 |
| 电脑 | > 1024px | 左侧固定边栏 + 主内容区 + 右侧详情抽屉 |

---

## 5. 核心功能模块

### 5.1 树形导航
- 左侧可折叠树菜单，递归渲染节点层级
- 支持点击展开/收起子节点
- 拖拽排序（同级节点间）
- 右键菜单：新建子节点/编辑/删除

### 5.2 内容管理
- 在当前节点下创建/编辑/删除内容
- 富文本编辑：标题 + 正文（TipTap）
- 内容类型切换：笔记/待办/代码/链接/清单
- 标签输入（逗号分隔，自动补全已有标签）
- 附件上传（图片/文件）

### 5.3 知识网络图
- 全局视图：所有节点和关联关系
- 局部视图：以当前节点为中心的子网络
- 节点可拖拽布局
- 连线显示关联标签
- 点击节点跳转，点击连线查看关联详情
- 缩放/平移/适应屏幕

### 5.4 关联功能
- 内容中输入 `@` 触发节点选择器，引用其他节点
- 网络图中拖拽创建节点间连线
- 关联关系双向显示（A关联B，B也显示关联A）

### 5.5 快速添加
- 全局悬浮按钮（FAB）
- 快速选择目标节点（或新建灵感）
- 最小化输入：标题 + 正文，保存后可在目标节点下继续编辑

### 5.6 搜索
- 顶部搜索框，支持节点名称和内容全文搜索
- 搜索结果按节点分组显示
- 支持标签筛选

---

## 6. AI 智能助手功能

### 6.1 功能概述
系统集成 AI 能力，帮助用户更高效地整理和连接知识。

### 6.2 具体功能

#### 6.2.1 智能分类（灵感归档）
- 用户在灵感速记页面输入任意文字
- AI 分析内容语义，推荐最适合的节点分类
- 用户确认后直接归档到对应节点

#### 6.2.2 自动关联建议
- 当用户创建/编辑内容时，AI 分析内容主题
- 推荐可能相关的现有节点
- 用户一键添加关联，无需手动搜索

#### 6.2.3 内容增强
- 根据当前节点下的内容，AI 建议可补充的知识点
- 识别内容中的"不足之处"，建议完善方向
- 对学习方法类内容，AI 可建议相关方法或补充资源

#### 6.2.4 知识摘要
- 对长内容自动生成摘要
- 对某个节点下的所有内容生成综合概览

### 6.3 技术实现
- 调用外部 LLM API（OpenAI/Claude/国产大模型）
- 通过 `/api/ai/classify` 等接口封装
- 前端在适当位置显示 AI 建议面板
- 用户始终有最终决定权（AI 建议仅供参考，需确认才生效）

---

## 7. API 设计

### 7.1 节点管理

```typescript
// GET /api/nodes?parentId=xxx
// 获取节点树（支持按 parentId 筛选）
response: { nodes: Node[] }

// POST /api/nodes
// 创建节点
body: { name: string, parentId?: string, type: NodeType, color?: string }
response: { node: Node }

// PUT /api/nodes/[id]
// 更新节点
body: { name?: string, color?: string, sortOrder?: number }
response: { node: Node }

// DELETE /api/nodes/[id]
// 删除节点（级联删除子节点和内容）
response: { success: boolean }
```

### 7.2 内容管理

```typescript
// GET /api/nodes/[id]/contents?page=1&limit=20
// 获取节点下的内容列表
response: { contents: Content[], total: number }

// POST /api/contents
// 创建内容
body: { nodeId: string, title?: string, body: JSON, type: ContentType, tags?: string[] }
response: { content: Content }

// PUT /api/contents/[id]
// 更新内容
body: { title?: string, body?: JSON, type?: ContentType, tags?: string[] }
response: { content: Content }

// DELETE /api/contents/[id]
// 删除内容
response: { success: boolean }
```

### 7.3 关联管理

```typescript
// GET /api/edges?nodeId=xxx
// 获取某节点的所有关联
response: { edges: Edge[] }

// POST /api/edges
// 创建关联
body: { sourceId: string, targetId: string, label?: string }
response: { edge: Edge }

// DELETE /api/edges/[id]
// 删除关联
response: { success: boolean }
```

### 7.4 搜索

```typescript
// GET /api/search?q=keyword&nodeId=xxx
// 全局或局部搜索
response: { results: (Node | Content)[], total: number }
```

### 7.5 AI 助手

```typescript
// POST /api/ai/classify
// 智能分类
body: { text: string }
response: { suggestedNodeId?: string, confidence: number, alternatives: {nodeId: string, reason: string}[] }

// POST /api/ai/suggest-edges
// 关联建议
body: { contentId: string }
response: { suggestions: {nodeId: string, reason: string}[] }

// POST /api/ai/enhance
// 内容增强建议
body: { nodeId: string }
response: { suggestions: string[] }
```

### 7.6 文件上传

```typescript
// POST /api/upload
// 上传文件
body: FormData (file)
response: { attachment: Attachment }
```

---

## 8. 核心交互流程

### 8.1 添加内容并建立关联

```
用户进入"方法系统"节点
    │
    ▼
点击"新建内容"
    │
    ▼
打开右侧编辑抽屉
    │
    ▼
输入标题 + 富文本内容（可插入图片/链接/代码块）
    │
    ▼
输入 "@性格" → 弹出节点选择器
    │
    ▼
选择"性格认知系统" → 建立内容到该节点的引用关联
    │
    ▼
保存 → POST /api/contents
    │
    ▼
后端：创建 Content 记录 + 创建 Edge 关联记录
    │
    ▼
前端：刷新内容列表 + 知识网络图自动更新连线
```

### 8.2 AI 灵感速记

```
用户点击全局"+"按钮 → 选择"灵感速记"
    │
    ▼
打开灵感输入界面（极简，类似聊天输入框）
    │
    ▼
用户输入文字（如"今天学到番茄工作法很有用"）
    │
    ▼
点击"AI 归档" → POST /api/ai/classify
    │
    ▼
AI 返回：建议归档到"学习方法系统 > 方法系统"
    │
    ▼
用户确认 → 自动创建内容到目标节点
    │
    ▼
AI 继续建议："检测到可能关联番茄工作法相关资料，是否关联？"
    │
    ▼
用户选择关联 → 自动创建 Edge
```

---

## 9. 错误处理

| 场景 | 策略 |
|------|------|
| 网络异常 | 前端乐观更新 + 失败重试，关键操作本地缓存待恢复后同步 |
| API 参数错误 | Zod 校验，返回 400 + 精确字段级错误信息 |
| 数据库错误 | 返回 500，前端显示友好错误提示，记录日志 |
| 文件上传失败 | 显示上传进度，失败可重试，大文件限制提示 |
| AI 服务异常 | AI 建议区域显示"服务暂不可用"，不影响主功能 |

---

## 10. 部署方案

### 10.1 部署平台
- **iga-pages**: 部署 Next.js 应用（前端 + API Routes）

### 10.2 数据库
- **Neon PostgreSQL** 免费层（或 Supabase）
- 连接字符串配置在环境变量中

### 10.3 文件存储
- iga-pages 纯静态资源部署时，文件上传可考虑：
  - 方案A：Base64 存储在数据库（小文件）
  - 方案B：第三方对象存储（如 Cloudflare R2 免费层）
  - 初期建议方案A，简单够用

### 10.4 环境变量
```
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=https://your-app.iga-pages.dev
AI_API_KEY=xxx  // AI 服务密钥
```

---

## 11. 扩展性考虑

### 11.1 未来可扩展功能
- 用户认证（多用户支持）
- 数据导入/导出（Markdown/Notion/Obisidian）
- 学习进度追踪（与目标愿望系统联动）
- 定时提醒（复习提醒、目标检查）
- 数据统计仪表盘

### 11.2 性能优化方向
- 节点树大数据量时虚拟滚动
- 网络图节点过多时聚合显示
- 图片懒加载 + CDN
- API 响应缓存（React Query/SWR）

---

## 12. 设计确认记录

| 阶段 | 状态 | 日期 |
|------|------|------|
| 系统层级结构 | 已确认 | 2026-07-02 |
| 整体架构与技术栈 | 已确认 | 2026-07-02 |
| 数据模型设计 | 已确认 | 2026-07-02 |
| 页面结构与核心功能 | 已确认 | 2026-07-02 |
| AI 智能助手功能 | 已确认 | 2026-07-02 |
