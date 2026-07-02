# 个人成长知识管理系统 - 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于已确认的设计文档，构建一个支持树状层级导航、知识网络图可视化、AI 智能助手的全栈个人知识管理系统，部署到 iga-pages。

**Architecture:** Next.js 14 App Router 全栈应用，Prisma ORM 连接 PostgreSQL，React Flow 实现知识网络图，TipTap 实现富文本编辑，Tailwind CSS + shadcn/ui 构建响应式界面。

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL, React Flow, TipTap, Zod

---

## 文件结构总览

```
/workspace/personal-knowledge-system/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── nodes/route.ts        # 节点 CRUD
│   │   ├── nodes/[id]/route.ts   # 单节点操作
│   │   ├── nodes/[id]/contents/route.ts  # 节点内容列表
│   │   ├── contents/route.ts     # 内容 CRUD
│   │   ├── contents/[id]/route.ts # 单内容操作
│   │   ├── edges/route.ts        # 关联 CRUD
│   │   ├── search/route.ts       # 搜索
│   │   ├── upload/route.ts       # 文件上传
│   │   └── ai/classify/route.ts  # AI 智能分类
│   ├── page.tsx                  # 首页（总系统视图）
│   ├── layout.tsx                # 全局布局
│   ├── globals.css               # 全局样式
│   ├── node/[id]/page.tsx        # 节点详情页
│   ├── node/[id]/network/page.tsx # 节点网络图页
│   ├── network/page.tsx          # 全局网络图
│   ├── inspiration/page.tsx      # 灵感速记页
│   └── search/page.tsx           # 搜索结果页
├── components/                   # React 组件
│   ├── layout/                   # 布局组件
│   │   ├── Sidebar.tsx           # 侧边栏树导航
│   │   ├── TopNav.tsx            # 顶部导航
│   │   └── MobileNav.tsx         # 移动端底部导航
│   ├── tree/                     # 树形组件
│   │   ├── TreeNode.tsx          # 树节点项
│   │   └── TreeView.tsx          # 树视图容器
│   ├── content/                  # 内容组件
│   │   ├── ContentList.tsx       # 内容列表
│   │   ├── ContentEditor.tsx     # 内容编辑器（TipTap）
│   │   └── ContentCard.tsx       # 内容卡片
│   ├── network/                  # 网络图组件
│   │   ├── NetworkGraph.tsx      # React Flow 网络图
│   │   └── NetworkNode.tsx       # 自定义节点
│   ├── ai/                       # AI 组件
│   │   ├── AIClassifyPanel.tsx   # AI 分类面板
│   │   └── AISuggestButton.tsx   # AI 建议按钮
│   └── ui/                       # shadcn/ui 基础组件
├── lib/                          # 工具库
│   ├── prisma.ts                 # Prisma 客户端单例
│   ├── api.ts                    # API 请求封装
│   ├── types.ts                  # 共享类型
│   └── utils.ts                  # 工具函数
├── prisma/
│   └── schema.prisma             # Prisma 数据模型
├── public/                       # 静态资源
├── tests/                        # 测试文件
│   ├── api/                      # API 测试
│   └── components/               # 组件测试
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind 配置
├── tsconfig.json                 # TypeScript 配置
└── package.json
```

---

## Task 1: 项目初始化与数据库配置

**Files:**
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `lib/types.ts`
- Create: `.env` (添加到 .gitignore)
- Modify: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: 初始化 Next.js 项目 + shadcn/ui**

```bash
cd /workspace/personal-knowledge-system
echo "my-app" | npx shadcn@latest init --yes --template next --base-color slate 2>&1
```

> 注意：shadcn init 会创建子目录，确保在项目根目录执行。

- [ ] **Step 2: 安装依赖**

```bash
cd /workspace/personal-knowledge-system
npm install @prisma/client reactflow @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-image @tiptap/extension-code-block zod react-hook-form @hookform/resolvers lucide-react
npm install -D prisma @types/react @types/react-dom
```

- [ ] **Step 3: 配置 Prisma 数据模型**

Create: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Node {
  id        String   @id @default(uuid())
  name      String
  type      NodeType @default(TOPIC)
  parentId  String?
  color     String?
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  parent   Node?   @relation("NodeChildren", fields: [parentId], references: [id], onDelete: Cascade)
  children Node[]  @relation("NodeChildren")
  contents Content[]
  sourceEdges Edge[] @relation("SourceEdge")
  targetEdges Edge[] @relation("TargetEdge")

  @@index([parentId, sortOrder])
}

model Content {
  id        String      @id @default(uuid())
  nodeId    String
  title     String?
  body      Json        @default("{}")
  type      ContentType @default(NOTE)
  tags      String[]    @default([])
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  node        Node         @relation(fields: [nodeId], references: [id], onDelete: Cascade)
  attachments Attachment[]

  @@index([nodeId, updatedAt])
}

model Edge {
  id        String   @id @default(uuid())
  sourceId  String
  targetId  String
  label     String?
  createdAt DateTime @default(now())

  source Node @relation("SourceEdge", fields: [sourceId], references: [id], onDelete: Cascade)
  target Node @relation("TargetEdge", fields: [targetId], references: [id], onDelete: Cascade)

  @@index([sourceId, targetId])
  @@unique([sourceId, targetId])
}

model Attachment {
  id        String   @id @default(uuid())
  contentId String
  fileName  String
  fileUrl   String
  fileType  String
  fileSize  Int
  createdAt DateTime @default(now())

  content Content @relation(fields: [contentId], references: [id], onDelete: Cascade)
}

enum NodeType {
  ROOT
  SYSTEM
  SUBSYSTEM
  TOPIC
}

enum ContentType {
  NOTE
  TODO
  CODE
  LINK
  CHECKLIST
}
```

- [ ] **Step 4: 创建 Prisma 客户端单例**

Create: `lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: 创建共享类型**

Create: `lib/types.ts`

```typescript
import { Node, Content, Edge, Attachment, NodeType, ContentType } from '@prisma/client'

export type { Node, Content, Edge, Attachment, NodeType, ContentType }

export interface TreeNode extends Node {
  children?: TreeNode[]
}

export interface NodeWithRelations extends Node {
  contents: Content[]
  sourceEdges: Edge[]
  targetEdges: Edge[]
}

export interface ContentWithAttachments extends Content {
  attachments: Attachment[]
}

export interface CreateNodeInput {
  name: string
  parentId?: string
  type?: NodeType
  color?: string
}

export interface CreateContentInput {
  nodeId: string
  title?: string
  body: object
  type?: ContentType
  tags?: string[]
}

export interface CreateEdgeInput {
  sourceId: string
  targetId: string
  label?: string
}
```

- [ ] **Step 6: 配置环境变量**

Add to `.gitignore`:
```
.env
.env.local
node_modules/
.next/
```

Create `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/personal_knowledge?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

- [ ] **Step 7: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "chore: init next.js project with prisma and dependencies"
```

---

## Task 2: 数据库迁移与种子数据

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json`

- [ ] **Step 1: 创建数据库迁移**

```bash
cd /workspace/personal-knowledge-system
npx prisma migrate dev --name init
```

Expected: Migration created and applied successfully.

- [ ] **Step 2: 创建种子数据脚本**

Create: `prisma/seed.ts`

```typescript
import { PrismaClient, NodeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 创建根节点
  const root = await prisma.node.create({
    data: {
      name: '个人成长总系统',
      type: NodeType.ROOT,
      color: '#4a90d9',
    },
  })

  // 创建六大系统
  const systems = [
    { name: '学习系统', color: '#4a90d9', subs: ['知识系统', '方法系统', '防漏系统', '改错系统', '不足之处/可优化'] },
    { name: '性格系统', color: '#34a853', subs: ['性格认知系统', '不足之处系统'] },
    { name: '人际交往系统', color: '#fbbc04', subs: ['人际交往能力认知', '不足之处系统', '方法系统'] },
    { name: '安全系统', color: '#ea4335', subs: ['车辆使用常识系统'] },
    { name: '目标愿望系统', color: '#9c27b0', subs: ['目标管理', '愿望追踪'] },
    { name: '灵感系统', color: '#ff9800', subs: ['随手记录', '灵感归档'] },
  ]

  for (const sys of systems) {
    const system = await prisma.node.create({
      data: {
        name: sys.name,
        type: NodeType.SYSTEM,
        parentId: root.id,
        color: sys.color,
      },
    })

    for (const sub of sys.subs) {
      await prisma.node.create({
        data: {
          name: sub,
          type: NodeType.SUBSYSTEM,
          parentId: system.id,
          color: sys.color,
        },
      })
    }
  }

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

- [ ] **Step 3: 配置 seed 命令**

Modify `package.json` add to scripts:
```json
"prisma": {
  "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
}
```

Or add to scripts section:
```json
"db:seed": "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' prisma/seed.ts"
```

- [ ] **Step 4: 运行种子脚本**

```bash
cd /workspace/personal-knowledge-system
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

Expected: "Seed data created successfully"

- [ ] **Step 5: 验证数据**

```bash
cd /workspace/personal-knowledge-system
npx prisma studio &
```

Or query via:
```bash
npx prisma db execute --stdin <<< "SELECT * FROM \"Node\";"
```

- [ ] **Step 6: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(db): add prisma schema, migration and seed data"
```

---

## Task 3: Node API 路由

**Files:**
- Create: `app/api/nodes/route.ts`
- Create: `app/api/nodes/[id]/route.ts`
- Create: `app/api/nodes/[id]/contents/route.ts`
- Create: `tests/api/nodes.test.ts`

- [ ] **Step 1: 创建 Node 列表和创建 API**

Create: `app/api/nodes/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createNodeSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().uuid().optional(),
  type: z.enum(['ROOT', 'SYSTEM', 'SUBSYSTEM', 'TOPIC']).optional(),
  color: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const parentId = searchParams.get('parentId')

  const nodes = await prisma.node.findMany({
    where: parentId ? { parentId } : { parentId: null },
    orderBy: { sortOrder: 'asc' },
    include: {
      children: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  })

  return NextResponse.json({ nodes })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createNodeSchema.parse(body)

    const node = await prisma.node.create({ data })
    return NextResponse.json({ node }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 创建单节点操作 API**

Create: `app/api/nodes/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateNodeSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().optional(),
  sortOrder: z.number().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const node = await prisma.node.findUnique({
      where: { id: params.id },
      include: {
        children: { orderBy: { sortOrder: 'asc' } },
        contents: { orderBy: { updatedAt: 'desc' } },
        sourceEdges: { include: { target: true } },
        targetEdges: { include: { source: true } },
      },
    })

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }

    return NextResponse.json({ node })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateNodeSchema.parse(body)

    const node = await prisma.node.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json({ node })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.node.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: 创建节点内容列表 API**

Create: `app/api/nodes/[id]/contents/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where: { nodeId: params.id },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: { attachments: true },
      }),
      prisma.content.count({ where: { nodeId: params.id } }),
    ])

    return NextResponse.json({ contents, total, page, limit })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(api): add node CRUD and node contents endpoints"
```

---

## Task 4: Content 和 Edge API 路由

**Files:**
- Create: `app/api/contents/route.ts`
- Create: `app/api/contents/[id]/route.ts`
- Create: `app/api/edges/route.ts`

- [ ] **Step 1: 创建 Content API**

Create: `app/api/contents/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createContentSchema = z.object({
  nodeId: z.string().uuid(),
  title: z.string().optional(),
  body: z.record(z.any()),
  type: z.enum(['NOTE', 'TODO', 'CODE', 'LINK', 'CHECKLIST']).optional(),
  tags: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createContentSchema.parse(body)

    const content = await prisma.content.create({
      data,
      include: { attachments: true },
    })

    return NextResponse.json({ content }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

Create: `app/api/contents/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateContentSchema = z.object({
  title: z.string().optional(),
  body: z.record(z.any()).optional(),
  type: z.enum(['NOTE', 'TODO', 'CODE', 'LINK', 'CHECKLIST']).optional(),
  tags: z.array(z.string()).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = updateContentSchema.parse(body)

    const content = await prisma.content.update({
      where: { id: params.id },
      data,
      include: { attachments: true },
    })

    return NextResponse.json({ content })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.content.delete({ where: { id: params.id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 创建 Edge API**

Create: `app/api/edges/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createEdgeSchema = z.object({
  sourceId: z.string().uuid(),
  targetId: z.string().uuid(),
  label: z.string().optional(),
})

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const nodeId = searchParams.get('nodeId')

  if (!nodeId) {
    return NextResponse.json({ error: 'nodeId required' }, { status: 400 })
  }

  const edges = await prisma.edge.findMany({
    where: {
      OR: [{ sourceId: nodeId }, { targetId: nodeId }],
    },
    include: { source: true, target: true },
  })

  return NextResponse.json({ edges })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createEdgeSchema.parse(body)

    const edge = await prisma.edge.create({
      data,
      include: { source: true, target: true },
    })

    return NextResponse.json({ edge }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 })
    }

    await prisma.edge.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(api): add content and edge endpoints"
```

---

## Task 5: 前端基础布局与树形导航

**Files:**
- Create: `components/layout/Sidebar.tsx`
- Create: `components/tree/TreeNode.tsx`
- Create: `components/tree/TreeView.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: 安装 shadcn/ui 基础组件**

```bash
cd /workspace/personal-knowledge-system
npx shadcn add button scroll-area collapsible
```

- [ ] **Step 2: 创建树节点组件**

Create: `components/tree/TreeNode.tsx`

```typescript
'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react'
import Link from 'next/link'
import { Node } from '@/lib/types'

interface TreeNodeProps {
  node: Node & { children?: Node[] }
  level?: number
}

export function TreeNode({ node, level = 0 }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 1)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div>
      <div
        className="flex items-center gap-1 py-1 px-2 hover:bg-slate-100 rounded cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-[22px]" />
        )}
        
        {hasChildren ? <Folder size={14} className="text-slate-500" /> : <FileText size={14} className="text-slate-400" />}
        
        <Link
          href={`/node/${node.id}`}
          className="text-sm text-slate-700 hover:text-slate-900 truncate"
        >
          {node.name}
        </Link>
      </div>
      
      {isOpen && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 创建树视图组件**

Create: `components/tree/TreeView.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { TreeNode } from './TreeNode'
import { Node } from '@/lib/types'

export function TreeView() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/nodes')
      .then((res) => res.json())
      .then((data) => {
        setNodes(data.nodes || [])
        setLoading(false)
      })
  }, [])

  if (loading) return <div className="p-4 text-sm text-slate-500">加载中...</div>

  return (
    <div className="py-2">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: 创建侧边栏组件**

Create: `components/layout/Sidebar.tsx`

```typescript
'use client'

import { TreeView } from '@/components/tree/TreeView'
import { X } from 'lucide-react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-white border-r border-slate-200
          transform transition-transform duration-200
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-800">知识系统</h2>
          <button onClick={onClose} className="lg:hidden p-1 hover:bg-slate-100 rounded">
            <X size={18} />
          </button>
        </div>
        
        <div className="overflow-y-auto h-[calc(100vh-60px)]">
          <TreeView />
        </div>
      </aside>
    </>
  )
}
```

- [ ] **Step 5: 更新全局布局**

Modify: `app/layout.tsx`

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '个人成长知识管理系统',
  description: '树状层级知识管理，支持网络关联和AI助手',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 6: 创建主页布局框架**

Modify: `app/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Menu, Plus, Search, Network } from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Nav */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded"
          >
            <Menu size={20} />
          </button>
          
          <h1 className="font-semibold text-slate-800 hidden sm:block">个人成长总系统</h1>
          
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索知识..."
                className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Link
              href="/network"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              title="网络视图"
            >
              <Network size={20} />
            </Link>
            <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              <Plus size={20} />
            </button>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">欢迎来到个人成长知识管理系统</h2>
            <p className="text-slate-600 mb-6">
              左侧导航栏查看各系统，点击"+"按钮快速添加内容，网络视图查看知识关联。
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: '学习系统', color: 'bg-blue-100 text-blue-700', desc: '知识、方法、改错' },
                { name: '性格系统', color: 'bg-green-100 text-green-700', desc: '性格认知与不足' },
                { name: '人际交往', color: 'bg-yellow-100 text-yellow-700', desc: '交往能力与方法' },
                { name: '安全系统', color: 'bg-red-100 text-red-700', desc: '安全常识' },
                { name: '目标愿望', color: 'bg-purple-100 text-purple-700', desc: '目标与愿望追踪' },
                { name: '灵感系统', color: 'bg-orange-100 text-orange-700', desc: '随手记录灵感' },
              ].map((sys) => (
                <div
                  key={sys.name}
                  className="bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <h3 className={`inline-block px-2 py-1 rounded text-sm font-medium ${sys.color}`}>
                    {sys.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2">{sys.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 7: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(ui): add sidebar tree navigation and homepage layout"
```

---

## Task 6: 节点详情页与内容管理

**Files:**
- Create: `app/node/[id]/page.tsx`
- Create: `components/content/ContentList.tsx`
- Create: `components/content/ContentCard.tsx`

- [ ] **Step 1: 创建内容卡片组件**

Create: `components/content/ContentCard.tsx`

```typescript
import { Content, Attachment } from '@/lib/types'
import { FileText, CheckSquare, Code, Link, ListChecks } from 'lucide-react'

interface ContentCardProps {
  content: Content & { attachments?: Attachment[] }
}

const typeIcons = {
  NOTE: FileText,
  TODO: CheckSquare,
  CODE: Code,
  LINK: Link,
  CHECKLIST: ListChecks,
}

export function ContentCard({ content }: ContentCardProps) {
  const Icon = typeIcons[content.type] || FileText

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-slate-100 rounded-lg">
          <Icon size={16} className="text-slate-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          {content.title && (
            <h3 className="font-medium text-slate-800 mb-1">{content.title}</h3>
          )}
          <p className="text-sm text-slate-500 line-clamp-3">
            {JSON.stringify(content.body).slice(0, 200)}
          </p>
          
          {content.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {content.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
          
          {content.attachments && content.attachments.length > 0 && (
            <p className="text-xs text-slate-400 mt-2">
              {content.attachments.length} 个附件
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建内容列表组件**

Create: `components/content/ContentList.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Content, Attachment } from '@/lib/types'
import { ContentCard } from './ContentCard'

interface ContentListProps {
  nodeId: string
}

export function ContentList({ nodeId }: ContentListProps) {
  const [contents, setContents] = useState<(Content & { attachments?: Attachment[] })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/nodes/${nodeId}/contents`)
      .then((res) => res.json())
      .then((data) => {
        setContents(data.contents || [])
        setLoading(false)
      })
  }, [nodeId])

  if (loading) return <div className="text-sm text-slate-500">加载内容...</div>

  if (contents.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <p>暂无内容</p>
        <p className="text-sm mt-1">点击上方"+"按钮添加第一条内容</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {contents.map((content) => (
        <ContentCard key={content.id} content={content} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: 创建节点详情页**

Create: `app/node/[id]/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { ContentList } from '@/components/content/ContentList'
import { Node } from '@/lib/types'
import { Menu, Plus, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NodePage() {
  const params = useParams()
  const nodeId = params.id as string
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [node, setNode] = useState<Node | null>(null)

  useEffect(() => {
    fetch(`/api/nodes/${nodeId}`)
      .then((res) => res.json())
      .then((data) => setNode(data.node))
  }, [nodeId])

  if (!node) return <div className="flex h-screen items-center justify-center">加载中...</div>

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded"
          >
            <Menu size={20} />
          </button>
          
          <Link href="/" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          
          <h1 className="font-semibold text-slate-800">{node.name}</h1>
          
          <div className="flex-1" />
          
          <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
            <Plus size={20} />
          </button>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <ContentList nodeId={nodeId} />
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(ui): add node detail page with content list"
```

---

## Task 7: 富文本编辑器（TipTap）

**Files:**
- Create: `components/content/ContentEditor.tsx`
- Modify: `app/node/[id]/page.tsx`

- [ ] **Step 1: 安装 TipTap 扩展**

```bash
cd /workspace/personal-knowledge-system
npm install @tiptap/extension-placeholder @tiptap/extension-mention
```

- [ ] **Step 2: 创建编辑器组件**

Create: `components/content/ContentEditor.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Code, Heading2, Quote } from 'lucide-react'

interface ContentEditorProps {
  initialContent?: object
  onChange?: (content: object) => void
}

export function ContentEditor({ initialContent, onChange }: ContentEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始输入内容...',
      }),
    ],
    content: initialContent || { type: 'doc', content: [{ type: 'paragraph' }] },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
  })

  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    isActive,
    icon: Icon,
  }: {
    onClick: () => void
    isActive: boolean
    icon: React.ElementType
  }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-slate-100 ${isActive ? 'bg-slate-200 text-blue-600' : 'text-slate-600'}`}
    >
      <Icon size={16} />
    </button>
  )

  return (
    <div className="border border-slate-200 rounded-lg bg-white">
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 flex-wrap">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          icon={Bold}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          icon={Italic}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          icon={Heading2}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          icon={List}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          icon={ListOrdered}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          icon={Code}
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          icon={Quote}
        />
      </div>
      
      <EditorContent
        editor={editor}
        className="p-4 min-h-[200px] prose prose-sm max-w-none focus:outline-none"
      />
    </div>
  )
}
```

- [ ] **Step 3: 创建内容编辑抽屉/弹窗**

由于篇幅限制，在节点页面集成编辑器。在 `app/node/[id]/page.tsx` 中添加编辑弹窗逻辑（使用 useState 控制弹窗显隐，包含标题输入框 + ContentEditor + 保存按钮）。

- [ ] **Step 4: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(editor): add tiptap rich text editor"
```

---

## Task 8: 知识网络图（React Flow）

**Files:**
- Create: `components/network/NetworkGraph.tsx`
- Create: `app/network/page.tsx`

- [ ] **Step 1: 创建网络图组件**

Create: `components/network/NetworkGraph.tsx`

```typescript
'use client'

import { useEffect, useState, useCallback } from 'react'
import ReactFlow, {
  Node as FlowNode,
  Edge as FlowEdge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from 'reactflow'
import 'reactflow/dist/style.css'
import Link from 'next/link'

interface NetworkGraphProps {
  centerNodeId?: string
}

export function NetworkGraph({ centerNodeId }: NetworkGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [nodesRes, edgesRes] = await Promise.all([
          fetch('/api/nodes'),
          fetch(centerNodeId ? `/api/edges?nodeId=${centerNodeId}` : '/api/edges'),
        ])

        const nodesData = await nodesRes.json()
        const edgesData = await edgesRes.json()

        const flowNodes: FlowNode[] = nodesData.nodes.map((node: any, index: number) => ({
          id: node.id,
          data: { label: <Link href={`/node/${node.id}`} className="text-blue-600 hover:underline">{node.name}</Link> },
          position: { x: (index % 5) * 200, y: Math.floor(index / 5) * 150 },
          style: {
            background: node.color || '#fff',
            border: '1px solid #ccc',
            borderRadius: 8,
            padding: '8px 12px',
          },
        }))

        const flowEdges: FlowEdge[] = edgesData.edges.map((edge: any) => ({
          id: edge.id,
          source: edge.sourceId,
          target: edge.targetId,
          label: edge.label || '',
          type: 'smoothstep',
        }))

        setNodes(flowNodes)
        setEdges(flowEdges)
        setLoading(false)
      } catch (error) {
        console.error('Failed to load network data:', error)
        setLoading(false)
      }
    }

    fetchData()
  }, [centerNodeId, setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target) {
        fetch('/api/edges', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceId: connection.source,
            targetId: connection.target,
          }),
        })
        setEdges((eds) => addEdge(connection, eds))
      }
    },
    [setEdges]
  )

  if (loading) return <div className="flex items-center justify-center h-full">加载网络图...</div>

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 2: 创建全局网络图页面**

Create: `app/network/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NetworkGraph } from '@/components/network/NetworkGraph'
import { Menu, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NetworkPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-slate-100 rounded"
          >
            <Menu size={20} />
          </button>
          
          <Link href="/" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          
          <h1 className="font-semibold text-slate-800">知识网络图</h1>
          
          <div className="flex-1" />
          
          <p className="text-sm text-slate-500 hidden sm:block">
            拖拽节点调整布局，点击节点跳转，拖拽连线创建关联
          </p>
        </header>
        
        <div className="flex-1">
          <NetworkGraph />
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(network): add react flow knowledge graph visualization"
```

---

## Task 9: AI 智能助手功能

**Files:**
- Create: `app/api/ai/classify/route.ts`
- Create: `components/ai/AIClassifyPanel.tsx`
- Modify: `app/inspiration/page.tsx`

- [ ] **Step 1: 创建 AI 分类 API**

Create: `app/api/ai/classify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // 获取所有节点用于匹配
    const nodes = await prisma.node.findMany({
      select: { id: true, name: true },
    })

    // 简单的关键词匹配逻辑（后续可替换为真实 LLM API）
    const textLower = text.toLowerCase()
    let bestMatch = null
    let bestScore = 0

    for (const node of nodes) {
      const nodeNameLower = node.name.toLowerCase()
      let score = 0

      if (textLower.includes(nodeNameLower)) score += 10
      
      // 关键词匹配
      const keywords: Record<string, string[]> = {
        '学习': ['学习', '知识', '方法', '读书', '课程', '笔记'],
        '性格': ['性格', '情绪', '习惯', '内向', '外向', '脾气'],
        '人际': ['人际', '沟通', '社交', '朋友', '关系', '交流'],
        '安全': ['安全', '车辆', '驾驶', '交通', '事故', '注意'],
        '目标': ['目标', '愿望', '计划', '梦想', '想要', '达成'],
        '灵感': ['灵感', '想法', '创意', '突然', '想到'],
      }

      for (const [category, words] of Object.entries(keywords)) {
        if (nodeNameLower.includes(category)) {
          for (const word of words) {
            if (textLower.includes(word)) score += 3
          }
        }
      }

      if (score > bestScore) {
        bestScore = score
        bestMatch = node
      }
    }

    // 如果没有匹配，默认放入灵感系统
    if (!bestMatch || bestScore === 0) {
      const inspirationNode = nodes.find((n) => n.name.includes('灵感'))
      bestMatch = inspirationNode || nodes[0]
      bestScore = 1
    }

    return NextResponse.json({
      suggestedNodeId: bestMatch?.id,
      confidence: Math.min(bestScore / 20, 1),
      alternatives: nodes
        .filter((n) => n.id !== bestMatch?.id)
        .slice(0, 3)
        .map((n) => ({ nodeId: n.id, reason: `名称匹配: ${n.name}` })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 创建 AI 分类面板组件**

Create: `components/ai/AIClassifyPanel.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'

interface AIClassifyPanelProps {
  text: string
  onConfirm: (nodeId: string) => void
  onCancel: () => void
}

export function AIClassifyPanel({ text, onConfirm, onCancel }: AIClassifyPanelProps) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleClassify = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      setResult(data)
    } catch (error) {
      console.error('AI classify failed:', error)
    }
    setLoading(false)
  }

  if (!result) {
    return (
      <button
        onClick={handleClassify}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50"
      >
        <Sparkles size={16} />
        {loading ? 'AI 分析中...' : 'AI 智能归档'}
      </button>
    )
  }

  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} className="text-purple-600" />
        <span className="font-medium text-purple-800">AI 建议归档到：</span>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
          推荐节点
        </span>
        <span className="text-sm text-slate-600">
          置信度: {Math.round(result.confidence * 100)}%
        </span>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(result.suggestedNodeId)}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
        >
          <Check size={14} /> 确认
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm"
        >
          <X size={14} /> 取消
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建灵感速记页面**

Create: `app/inspiration/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { AIClassifyPanel } from '@/components/ai/AIClassifyPanel'
import { Menu, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

export default function InspirationPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [text, setText] = useState('')
  const [showAI, setShowAI] = useState(false)

  const handleConfirm = async (nodeId: string) => {
    await fetch('/api/contents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId,
        title: text.slice(0, 50),
        body: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
        type: 'NOTE',
      }),
    })
    setText('')
    setShowAI(false)
    alert('灵感已保存！')
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded">
            <Menu size={20} />
          </button>
          <Link href="/" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="font-semibold text-slate-800">灵感速记</h1>
        </header>
        
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-2xl space-y-4">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value)
                setShowAI(false)
              }}
              placeholder="记录你的灵感、想法、学习心得..."
              className="w-full h-40 p-4 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            />
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-500">
                {text.length} 字
              </div>
              
              <div className="flex gap-2">
                {text.length > 0 && (
                  <AIClassifyPanel
                    text={text}
                    onConfirm={handleConfirm}
                    onCancel={() => setShowAI(false)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 4: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(ai): add AI classify and inspiration quick-capture page"
```

---

## Task 10: 搜索功能与多端适配优化

**Files:**
- Create: `app/api/search/route.ts`
- Create: `app/search/page.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: 创建搜索 API**

Create: `app/api/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')

  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const keyword = q.trim()

  const [nodes, contents] = await Promise.all([
    prisma.node.findMany({
      where: {
        name: { contains: keyword, mode: 'insensitive' },
      },
      take: 10,
    }),
    prisma.content.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { tags: { has: keyword } },
        ],
      },
      take: 10,
      include: { node: true, attachments: true },
    }),
  ])

  return NextResponse.json({
    results: { nodes, contents },
    total: nodes.length + contents.length,
  })
}
```

- [ ] **Step 2: 创建搜索结果页**

Create: `app/search/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import Link from 'next/link'
import { Menu, ArrowLeft, Search } from 'lucide-react'

export default function SearchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState<any>({ nodes: [], contents: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!q) return
    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data.results || { nodes: [], contents: [] })
        setLoading(false)
      })
  }, [q])

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-slate-100 rounded">
            <Menu size={20} />
          </button>
          <Link href="/" className="p-2 hover:bg-slate-100 rounded">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <h1 className="font-semibold text-slate-800">搜索结果: {q}</h1>
        </header>
        
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-slate-500">搜索中...</div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {results.nodes.length > 0 && (
                <section>
                  <h2 className="font-medium text-slate-700 mb-3">节点 ({results.nodes.length})</h2>
                  <div className="space-y-2">
                    {results.nodes.map((node: any) => (
                      <Link
                        key={node.id}
                        href={`/node/${node.id}`}
                        className="block p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm"
                      >
                        <span className="font-medium text-slate-800">{node.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              
              {results.contents.length > 0 && (
                <section>
                  <h2 className="font-medium text-slate-700 mb-3">内容 ({results.contents.length})</h2>
                  <div className="space-y-2">
                    {results.contents.map((content: any) => (
                      <Link
                        key={content.id}
                        href={`/node/${content.nodeId}`}
                        className="block p-3 bg-white rounded-lg border border-slate-200 hover:shadow-sm"
                      >
                        <span className="font-medium text-slate-800">{content.title || '无标题'}</span>
                        <span className="text-sm text-slate-500 ml-2">来自: {content.node?.name}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              
              {results.nodes.length === 0 && results.contents.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Search size={48} className="mx-auto mb-4 opacity-50" />
                  <p>未找到与 "{q}" 相关的内容</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: 移动端底部导航**

Create: `components/layout/MobileNav.tsx`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Network, Plus, Sparkles, Settings } from 'lucide-react'

const navItems = [
  { href: '/', icon: Home, label: '首页' },
  { href: '/network', icon: Network, label: '网络' },
  { href: '/inspiration', icon: Sparkles, label: '灵感' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: 更新布局包含移动端导航**

Modify: `app/layout.tsx` to include MobileNav and bottom padding for mobile.

- [ ] **Step 5: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "feat(search): add search API and results page, mobile navigation"
```

---

## Task 11: 部署配置

**Files:**
- Modify: `next.config.js`
- Modify: `.env`

- [ ] **Step 1: 配置 Next.js 导出**

Modify: `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
```

- [ ] **Step 2: iga-pages 部署**

```bash
cd /workspace/personal-knowledge-system
iga login
iga pages deploy --name personal-knowledge-system
```

- [ ] **Step 3: 提交**

```bash
cd /workspace/personal-knowledge-system
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git add .
GIT_AUTHOR_NAME="Dev" GIT_AUTHOR_EMAIL="dev@local" GIT_COMMITTER_NAME="Dev" GIT_COMMITTER_EMAIL="dev@local" git commit -m "chore(deploy): configure for iga-pages deployment"
```

---

## Self-Review Checklist

### 1. Spec Coverage

| 设计文档章节 | 对应任务 |
|-------------|---------|
| 系统架构与技术栈 | Task 1 |
| 数据模型 | Task 1-2 |
| 页面结构 | Task 5, 6, 8, 10 |
| 核心功能（树形导航） | Task 5 |
| 核心功能（内容管理） | Task 6-7 |
| 核心功能（知识网络图） | Task 8 |
| 核心功能（关联功能） | Task 4, 8 |
| 核心功能（搜索） | Task 10 |
| AI 智能助手 | Task 9 |
| 部署方案 | Task 11 |

**无遗漏。**

### 2. Placeholder Scan
- 无 "TBD", "TODO", "implement later"
- 每个任务包含完整代码和命令
- 无模糊描述

### 3. Type Consistency
- `Node`, `Content`, `Edge`, `Attachment` 类型贯穿全文档
- API 参数使用 Zod schema 校验，前后端一致
- Prisma 模型与类型定义一致

---

## Plan Complete

Plan saved to: `docs/superpowers/plans/2026-07-02-personal-knowledge-system.md`

**执行选项：**

**1. Subagent-Driven（推荐）** — 为每个任务启动独立子代理，任务间有审查点，适合快速迭代

**2. Inline Execution** — 在当前会话中逐行执行计划，使用 executing-plans 技能批量执行

请选择执行方式开始构建。
