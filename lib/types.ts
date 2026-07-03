// Inline type definitions (replacing Prisma-generated types)

export interface Node {
  id: string
  name: string
  type: string
  parentId: string | null
  color: string | null
  sortOrder: number
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Content {
  id: string
  nodeId: string
  userId: string
  title: string | null
  body: any
  type: string
  tags: any
  createdAt: string
  updatedAt: string
}

export interface Edge {
  id: string
  sourceId: string
  targetId: string
  label: string | null
  userId: string
  createdAt: string
}

export interface Attachment {
  id: string
  contentId: string
  fileName: string
  fileUrl: string
  fileType: string
  fileSize: number
  createdAt: string
}

export interface TreeNode extends Node {
  children?: TreeNode[]
}

export interface NodeWithRelations extends Node {
  contents: Content[]
  sourceEdges: (Edge & { target?: Node | null })[]
  targetEdges: (Edge & { source?: Node | null })[]
}

export interface ContentWithAttachments extends Content {
  attachments: Attachment[]
}

export interface CreateNodeInput {
  name: string
  parentId?: string
  type?: string
  color?: string
}

export interface CreateContentInput {
  nodeId: string
  title?: string
  body: object
  type?: string
  tags?: string[]
}

export interface CreateEdgeInput {
  sourceId: string
  targetId: string
  label?: string
}

export interface UserPreference {
  id: string
  userId: string
  keyword: string
  preferredNodeId: string
  count: number
  createdAt: string
  updatedAt: string
}
