import { db } from './db'

export interface Recommendation {
  nodeId: string
  nodeName: string
  reason: string
  score: number
}

interface NodeData {
  id: string
  name: string
  type: string
  parentId: string | null
  content?: string
  tags?: string[]
  userId: string
}

export function getRecommendations(
  currentNodeId: string,
  limit: number = 5
): Recommendation[] {
  const allNodes = Array.from(db.nodes.values()) as NodeData[]
  const current = allNodes.find(n => n.id === currentNodeId)
  if (!current) return []

  const userId = 'default-user'
  const candidates = allNodes.filter(n =>
    n.id !== currentNodeId &&
    n.id !== current.parentId &&
    n.userId === userId
  )

  if (candidates.length === 0) return []

  const scored = candidates.map(node => ({
    node,
    score: calculateSimilarity(current, node, allNodes)
  }))

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map(item => ({
    nodeId: item.node.id,
    nodeName: item.node.name,
    reason: getRecommendReason(current, item.node, allNodes),
    score: Math.round(item.score * 100) / 100
  }))
}

function calculateSimilarity(a: NodeData, b: NodeData, allNodes: NodeData[]): number {
  let score = 0

  // Name similarity (Jaccard on characters for Chinese) - weight 0.3
  const nameScore = charJaccard(a.name, b.name)
  score += nameScore * 0.3

  // Hierarchy proximity - weight 0.25
  if (a.parentId === b.parentId && a.parentId !== null) {
    score += 0.25
  } else {
    const grandA = allNodes.find(n => n.id === a.parentId)?.parentId
    const grandB = allNodes.find(n => n.id === b.parentId)?.parentId
    if (grandA && grandA === grandB) {
      score += 0.12
    }
  }

  // Tag overlap - weight 0.25
  const tagsA = a.tags || []
  const tagsB = b.tags || []
  if (tagsA.length > 0 && tagsB.length > 0) {
    const overlap = tagsA.filter(t => tagsB.includes(t)).length
    score += (overlap / Math.max(tagsA.length, tagsB.length)) * 0.25
  }

  // Content keyword match - weight 0.2
  const contentA = a.content || ''
  const contentB = b.content || ''
  if (contentA && contentB) {
    const tokensA = tokenize(contentA)
    const tokensB = tokenize(contentB)
    const setA = new Set(tokensA)
    const common = tokensB.filter(t => setA.has(t))
    score += Math.min(common.length / 10, 1) * 0.2
  }

  return Math.min(score, 1)
}

function charJaccard(a: string, b: string): number {
  const charsA = new Set([...a.replace(/[\s]/g, '')])
  const charsB = new Set([...b.replace(/[\s]/g, '')])
  if (charsA.size === 0 || charsB.size === 0) return 0
  const intersection = [...charsA].filter(c => charsB.has(c)).length
  const union = new Set([...charsA, ...charsB]).size
  return intersection / union
}

function tokenize(text: string): string[] {
  return text
    .replace(/[，。、；：！？""''（）\n\r\t,.;:!?\'"()\[\]{}]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1)
}

function getRecommendReason(current: NodeData, candidate: NodeData, allNodes: NodeData[]): string {
  if (current.parentId === candidate.parentId && current.parentId !== null) {
    return '同属一个分类'
  }
  const grandA = allNodes.find(n => n.id === current.parentId)?.parentId
  const grandB = allNodes.find(n => n.id === candidate.parentId)?.parentId
  if (grandA && grandA === grandB) {
    return '同属上层分类'
  }
  const tagsA = current.tags || []
  const tagsB = candidate.tags || []
  const commonTags = tagsA.filter(t => tagsB.includes(t))
  if (commonTags.length > 0) {
    return `标签「${commonTags[0]}」相关`
  }
  if (current.name.length > 1 && candidate.name.length > 1) {
    if (current.name.includes(candidate.name) || candidate.name.includes(current.name)) {
      return '名称相关'
    }
  }
  const contentA = current.content || ''
  const contentB = candidate.content || ''
  if (contentA && contentB) {
    const tokensA = tokenize(contentA)
    const tokensB = tokenize(contentB)
    const common = tokensA.filter(t => tokensB.includes(t))
    if (common.length > 0) {
      return `内容关键词「${common[0]}」相关`
    }
  }
  return '你可能也感兴趣'
}
