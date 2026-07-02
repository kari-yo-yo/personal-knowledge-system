import { Node, Content, Edge, Attachment } from '@prisma/client'

export type { Node, Content, Edge, Attachment }

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
