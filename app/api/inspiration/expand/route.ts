import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const { text } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const nodes = Array.from(db.nodes.values())
      .filter((n: any) => n.userId === user.id)
      .map((n: any) => ({ id: n.id, name: n.name }))

    const textLower = text.toLowerCase()
    let bestMatch: typeof nodes[0] | null = null
    let bestScore = 0

    for (const node of nodes) {
      const nodeNameLower = node.name.toLowerCase()
      let score = 0

      if (textLower.includes(nodeNameLower)) score += 10

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

    if (!bestMatch || bestScore === 0) {
      const inspirationNode = nodes.find((n) => n.name.includes('灵感'))
      bestMatch = inspirationNode || nodes[0] || null
      bestScore = 1
    }

    // Determine plan type based on keywords
    let planType: 'learning' | 'project' | 'creation' | 'generic' = 'generic'
    if (/学|学习|技能|知识|读书|课程/.test(text)) {
      planType = 'learning'
    } else if (/创业|项目|产品|商业|公司/.test(text)) {
      planType = 'project'
    } else if (/写|创作|书|文章|小说|博客/.test(text)) {
      planType = 'creation'
    }

    const shortText = text.trim().slice(0, 30) + (text.length > 30 ? '...' : '')

    let plan: {
      vision: string
      steps: { phase: string; title: string; description: string; duration: string }[]
      skillsNeeded: string[]
      resources: string[]
      milestones: string[]
      risks: string[]
      tips: string
      suggestedNodeId: string | undefined
      suggestedNodeName: string | undefined
    }

    switch (planType) {
      case 'learning':
        plan = {
          vision: `将「${shortText}」从兴趣转化为系统化的个人能力`,
          steps: [
            {
              phase: '第一阶段',
              title: '认知筑基',
              description: '了解该领域的全貌，确定学习路径和核心概念，建立知识地图',
              duration: '1-2周',
            },
            {
              phase: '第二阶段',
              title: '系统学习',
              description: '深入核心知识，做笔记、画思维导图、完成练习和测验',
              duration: '2-4周',
            },
            {
              phase: '第三阶段',
              title: '实践应用',
              description: '通过小项目、案例分析或模拟场景将知识转化为能力',
              duration: '2-3周',
            },
            {
              phase: '第四阶段',
              title: '复盘优化',
              description: '总结经验教训，形成自己的方法论和可复用的知识库',
              duration: '1周',
            },
          ],
          skillsNeeded: ['自学能力', '时间管理', '笔记整理', '问题解决'],
          resources: ['优质课程/书籍', '学习社群/论坛', '实践平台', '导师指导'],
          milestones: ['完成首个学习模块', '输出第一篇学习笔记', '独立完成实践项目'],
          risks: ['中途放弃', '信息过载导致焦虑', '理论与实践脱节'],
          tips: '学习是一场马拉松，不是短跑。每天进步一点点，小狗相信你一定可以！',
          suggestedNodeId: bestMatch?.id,
          suggestedNodeName: bestMatch?.name,
        }
        break
      case 'project':
        plan = {
          vision: `将「${shortText}」从一个想法落地为可验证的项目成果`,
          steps: [
            {
              phase: '第一阶段',
              title: '需求验证',
              description: '调研市场或用户，验证需求的真实性和紧迫性，避免自嗨',
              duration: '1-2周',
            },
            {
              phase: '第二阶段',
              title: '原型设计',
              description: '设计最小可行产品(MVP)，明确核心功能和用户体验路径',
              duration: '2-3周',
            },
            {
              phase: '第三阶段',
              title: '开发落地',
              description: '实现核心功能，快速迭代，优先解决最关键的问题',
              duration: '3-6周',
            },
            {
              phase: '第四阶段',
              title: '测试优化',
              description: '收集真实用户反馈，用数据驱动持续改进产品',
              duration: '2-4周',
            },
            {
              phase: '第五阶段',
              title: '推广运营',
              description: '寻找种子用户，建立口碑，逐步扩大影响力和用户群',
              duration: '持续进行',
            },
          ],
          skillsNeeded: ['产品设计', '用户调研', '项目管理', '数据分析', '执行力'],
          resources: ['原型设计工具', '种子用户渠道', '行业报告', '创业社群'],
          milestones: ['完成需求验证报告', '发布MVP', '获得首批用户反馈', '实现首个付费用户'],
          risks: ['需求假设不成立', '资源不足', '竞品挤压', '团队磨合问题'],
          tips: '每一个伟大的项目都始于一个微小的开始，勇敢迈出第一步吧！',
          suggestedNodeId: bestMatch?.id,
          suggestedNodeName: bestMatch?.name,
        }
        break
      case 'creation':
        plan = {
          vision: `将「${shortText}」从脑海中的火花转化为完整的创作作品`,
          steps: [
            {
              phase: '第一阶段',
              title: '素材收集',
              description: '广泛阅读、观察和记录，建立丰富的灵感素材库和参考资料',
              duration: '1-2周',
            },
            {
              phase: '第二阶段',
              title: '框架搭建',
              description: '确定主题和结构，列出详细的大纲和章节规划',
              duration: '1周',
            },
            {
              phase: '第三阶段',
              title: '初稿创作',
              description: '不追求完美，先完成再完善，保持创作的 momentum',
              duration: '2-4周',
            },
            {
              phase: '第四阶段',
              title: '修改打磨',
              description: '反复润色，听取读者或编辑的反馈，精益求精',
              duration: '1-2周',
            },
            {
              phase: '第五阶段',
              title: '发布分享',
              description: '选择合适的平台发布，与读者建立连接，收集真实反馈',
              duration: '1周',
            },
          ],
          skillsNeeded: ['写作表达', '结构思维', '读者洞察', '持续创作力', '自我编辑'],
          resources: ['写作工具', '参考书籍', '创作社群', '读者反馈渠道'],
          milestones: ['完成大纲', '初稿突破关键节点', '正式发布作品', '获得首批读者'],
          risks: ['完美主义拖延', '灵感枯竭', '反馈不足', '市场反响冷淡'],
          tips: '创作最美的时刻，就是当你敢于把内心的世界分享给别人的时候。',
          suggestedNodeId: bestMatch?.id,
          suggestedNodeName: bestMatch?.name,
        }
        break
      default:
        plan = {
          vision: `将「${shortText}」从模糊的想法变成清晰可行的行动方案`,
          steps: [
            {
              phase: '第一阶段',
              title: '明确目标',
              description: '梳理核心诉求，将模糊想法转化为具体、可衡量的目标',
              duration: '3-5天',
            },
            {
              phase: '第二阶段',
              title: '信息调研',
              description: '收集相关信息，了解现状、可能性和参考案例',
              duration: '1-2周',
            },
            {
              phase: '第三阶段',
              title: '制定方案',
              description: '基于调研结果，设计可执行的详细路径和行动计划',
              duration: '1周',
            },
            {
              phase: '第四阶段',
              title: '行动验证',
              description: '小步快跑，在实践中验证假设，及时调整方向',
              duration: '2-4周',
            },
            {
              phase: '第五阶段',
              title: '复盘迭代',
              description: '总结经验教训，持续优化方案，形成正向循环',
              duration: '持续进行',
            },
          ],
          skillsNeeded: ['目标管理', '信息检索', '执行力', '复盘能力', '适应变化'],
          resources: ['行业资料', '前辈经验', '工具模板', '同行伙伴'],
          milestones: ['目标清晰化', '完成调研报告', '首次实践验证', '形成可复用的方法'],
          risks: ['目标过于宏大', '执行力不足', '外部环境变化', '预期与现实不符'],
          tips: '再小的行动，也好过完美的计划。现在就开始吧，小狗为你加油！',
          suggestedNodeId: bestMatch?.id,
          suggestedNodeName: bestMatch?.name,
        }
    }

    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
