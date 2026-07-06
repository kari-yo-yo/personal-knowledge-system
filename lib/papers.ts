import { getData, setData, deleteData } from './kv'

// ── KV Keys ──
const PAPER_PREFIX = 'paper:'
const PAPER_INDEX_KEY = 'paper_index'
const PAPER_LAST_FETCH_KEY = 'paper_last_fetch'
const PAPER_KNOWLEDGE_PREFIX = 'knowledge_paper:'
const PAPER_NODE_PREFIX = 'paper_knowledge:'

// ── Types ──
export interface Paper {
  id: string
  title: string
  category: string
  categoryEmoji: string
  tags: string[]
  status: string
  summary: string
  painPoints: string
  method: string
  scenarios: string
  arxiv?: string
  arxivUrl?: string
  codeUrl?: string
  notesUrl?: string
  archImage?: string
  date?: string
  sourceUrl?: string // link to paper site
  fetchedAt: string
}

export interface PaperLink {
  paperId: string
  nodeId: string
  createdAt: string
}

// ── Paper CRUD ──

export async function savePaper(paper: Paper): Promise<void> {
  const data = JSON.stringify(paper)
  await setData(`${PAPER_PREFIX}${paper.id}`, data)
}

export async function savePapersBatch(papers: Paper[]): Promise<void> {
  // Write all papers + index in one batch (no race conditions)
  const ops: Promise<void>[] = []
  const ids = papers.map((p) => p.id)
  for (const p of papers) {
    ops.push(setData(`${PAPER_PREFIX}${p.id}`, JSON.stringify(p)))
  }
  ops.push(setData(PAPER_INDEX_KEY, JSON.stringify(ids)))
  await Promise.all(ops)
}

export async function getPaper(paperId: string): Promise<Paper | null> {
  const data = await getData<string>(`${PAPER_PREFIX}${paperId}`)
  if (!data) return null
  return typeof data === 'string' ? JSON.parse(data) : (data as unknown as Paper)
}

export async function getPaperIds(): Promise<string[]> {
  const data = await getData<string>(PAPER_INDEX_KEY)
  if (!data) return []
  return typeof data === 'string' ? JSON.parse(data) : (data as unknown as string[])
}

export async function getAllPapers(): Promise<Paper[]> {
  const ids = await getPaperIds()
  if (ids.length === 0) return []
  const papers = await Promise.all(ids.map((id) => getPaper(id)))
  return papers.filter((p): p is Paper => p !== null)
}

export async function clearAllPapers(): Promise<void> {
  const ids = await getPaperIds()
  await Promise.all(ids.map((id) => deleteData(`${PAPER_PREFIX}${id}`)))
  await deleteData(PAPER_INDEX_KEY)
}

// ── Fetch from GitHub ──

export async function setLastFetchTime(time: number): Promise<void> {
  await setData(PAPER_LAST_FETCH_KEY, String(time))
}

export async function getLastFetchTime(): Promise<number> {
  const data = await getData<string>(PAPER_LAST_FETCH_KEY)
  return data ? parseInt(data) : 0
}

// ── Knowledge-Paper Links ──

export async function linkPaperToNode(nodeId: string, paperId: string): Promise<void> {
  const now = new Date().toISOString()
  // paper -> nodes
  const pnKey = `${PAPER_NODE_PREFIX}${paperId}`
  const pnData = await getData<string>(pnKey)
  const nodeIds: string[] = pnData ? (typeof pnData === 'string' ? JSON.parse(pnData) : pnData) : []
  if (!nodeIds.includes(nodeId)) {
    nodeIds.push(nodeId)
    await setData(pnKey, JSON.stringify(nodeIds))
  }
  // node -> papers
  const kpKey = `${PAPER_KNOWLEDGE_PREFIX}${nodeId}`
  const kpData = await getData<string>(kpKey)
  const paperIds: string[] = kpData ? (typeof kpData === 'string' ? JSON.parse(kpData) : kpData) : []
  if (!paperIds.includes(paperId)) {
    paperIds.push(paperId)
    await setData(kpKey, JSON.stringify(paperIds))
  }
}

export async function unlinkPaperFromNode(nodeId: string, paperId: string): Promise<void> {
  // Remove from paper -> nodes
  const pnKey = `${PAPER_NODE_PREFIX}${paperId}`
  const pnData = await getData<string>(pnKey)
  if (pnData) {
    const nodeIds: string[] = typeof pnData === 'string' ? JSON.parse(pnData) : pnData
    await setData(pnKey, JSON.stringify(nodeIds.filter((id) => id !== nodeId)))
  }
  // Remove from node -> papers
  const kpKey = `${PAPER_KNOWLEDGE_PREFIX}${nodeId}`
  const kpData = await getData<string>(kpKey)
  if (kpData) {
    const paperIds: string[] = typeof kpData === 'string' ? JSON.parse(kpData) : kpData
    await setData(kpKey, JSON.stringify(paperIds.filter((id) => id !== paperId)))
  }
}

export async function getPapersByNode(nodeId: string): Promise<Paper[]> {
  const kpKey = `${PAPER_KNOWLEDGE_PREFIX}${nodeId}`
  const kpData = await getData<string>(kpKey)
  if (!kpData) return []
  const paperIds: string[] = typeof kpData === 'string' ? JSON.parse(kpData) : kpData
  const papers = await Promise.all(paperIds.map((id) => getPaper(id)))
  return papers.filter((p): p is Paper => p !== null)
}

export async function getNodesByPaper(paperId: string): Promise<string[]> {
  const pnKey = `${PAPER_NODE_PREFIX}${paperId}`
  const pnData = await getData<string>(pnKey)
  if (!pnData) return []
  return typeof pnData === 'string' ? JSON.parse(pnData) : (pnData as unknown as string[])
}

// ── Markdown Parser ──
// Parses the papers-library.md format from the paper website

export function parsePapersMd(md: string): Paper[] {
  const papers: Paper[] = []
  const lines = md.split('\n')
  let i = 0
  let currentCategory = '其他'
  let currentCategoryEmoji = '🔄'

  while (i < lines.length) {
    const line = lines[i].trim()

    // Detect category section (## 🔥 注意力机制)
    const catMatch = line.match(/^##\s+([^\s]+)\s+(.+)/)
    if (catMatch && !line.includes('论文统计') && !line.includes('待读清单') && !line.includes('对比')) {
      currentCategoryEmoji = catMatch[1]
      currentCategory = catMatch[2].trim().replace(/[^\u4e00-\u9fa5a-zA-Z//\s]/g, '').trim()
      i++
      continue
    }

    // Skip empty categories
    if (line.startsWith('> 暂无论文')) {
      i++
      continue
    }

    // Detect paper title (### Title)
    const paperMatch = line.match(/^###\s+(.+)/)
    if (paperMatch) {
      const title = paperMatch[1].trim()
      const paper: Paper = {
        id: titleToId(title),
        title,
        category: currentCategory,
        categoryEmoji: currentCategoryEmoji,
        tags: [],
        status: '待读',
        summary: '',
        painPoints: '',
        method: '',
        scenarios: '',
        fetchedAt: new Date().toISOString(),
        sourceUrl: `https://kari-yo-yo.github.io/lunwen/`,
      }
      i++

      // Parse fields
      while (i < lines.length) {
        const bline = lines[i].trim()
        if (bline.startsWith('## ') || bline.startsWith('### ') || bline.startsWith('---')) break

        const bm = bline.match(/^-\s+\*\*(.+?)\*\*:\s*(.+)/)
        if (bm) {
          const key = bm[1].trim()
          const val = bm[2].trim()
          switch (key) {
            case '分类':
              paper.category = val.replace(/[^\u4e00-\u9fa5a-zA-Z//\s]/g, '').trim()
              break
            case '标签':
              paper.tags = val.split(',').map((t) => t.trim()).filter(Boolean)
              break
            case '状态':
              paper.status = val.trim()
              break
            case '一句话总结':
              paper.summary = val
              break
            case '核心痛点':
              paper.painPoints = val
              break
            case '核心方法':
              paper.method = val
              break
            case '适用场景':
              paper.scenarios = val
              break
            case 'arXiv/DOI': {
              const alink = val.match(/\[(.+?)\]\((.+?)\)/)
              if (alink) {
                paper.arxivUrl = alink[2]
                paper.arxiv = alink[1]
              } else {
                paper.arxiv = val
              }
              break
            }
            case '代码链接': {
              const clink = val.match(/\[(.+?)\]\((.+?)\)/)
              if (clink) paper.codeUrl = clink[2]
              break
            }
            case '笔记链接': {
              const nlink = val.match(/\[(.+?)\]\((.+?)\)/)
              if (nlink) paper.notesUrl = `https://raw.githubusercontent.com/kari-yo-yo/lunwen/main/docs/${nlink[2]}`
              break
            }
            case '架构图': {
              paper.archImage = `https://raw.githubusercontent.com/kari-yo-yo/lunwen/main/docs/${val}`
              break
            }
            case '添加时间':
              paper.date = val
              break
          }
        }
        i++
      }
      papers.push(paper)
      continue
    }
    i++
  }
  return papers
}

function titleToId(title: string): string {
  // Use a hash of the title to create a stable ID
  const clean = title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return clean ? `ext_${clean}` : `ext_${Date.now()}`
}
