import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

const memoryTips: Record<string, string> = {
  '复利': '时间越长，雪球越疯；耐心是金，复利称王。',
  '熵增': '不打扫就乱，不做功就散；对抗熵增，持续能量。',
  '区块链': '人人记账，无法篡改；去掉村长，照样可信。',
  '机会成本': '选A弃B，代价 hidden；最优替代，才是成本。',
  '沉没成本': '泼出去的水，收不回；向前看，别流泪。',
  '马太效应': '强者越强，弱者越慌；一开始的小优势，最后变成大鸿沟。',
  '认知失调': '想法行为不一致，大脑难受要调和；要么改想法，要么改做法。',
  '墨菲定律': '怕什么来什么，小概率也会发生；提前预案，心中不慌。',
  '帕累托法则': '二八法则记心间，少数决定大部分；抓住关键，事半功倍。',
}

const analogyTemplates: Record<string, string> = {
  '复利': '它就像一个雪球从山坡上滚下来，越滚越大。',
  '熵增': '它就像一间房间，如果不打扫，自然而然就会积灰、变乱。',
  '区块链': '它就像村里每个人都有一本同样的账本，大家互相监督。',
  '机会成本': '它就像你周末只有一天假，选择做A就意味着放弃B。',
  '沉没成本': '它就像你买了一张很难看的电影票，看了发现很烂，但票价退不回来。',
  '马太效应': '它就像两个学生，一个基础好获得更多关注，差距越拉越大。',
  '认知失调': '它就像你明知吸烟有害，却又忍不住抽了一支，心里很不舒服。',
  '墨菲定律': '它就像你出门没带伞时偏偏下雨，涂黄油的那面永远朝下。',
  '帕累托法则': '它就像你衣柜里80%的时间只穿20%的衣服。',
}

function generateMemoryTip(concept: string): string {
  const tip = memoryTips[concept.trim()]
  if (tip) return tip
  for (const [key, value] of Object.entries(memoryTips)) {
    if (concept.includes(key) || key.includes(concept)) return value
  }
  return `记住${concept}：先想定义，再找类比，最后举例，通俗易懂是王道。`
}

function generateImprovedVersion(concept: string, explanation: string, feedback: string[]): string {
  let improved = explanation
  const lower = explanation.toLowerCase()
  const conceptLower = concept.toLowerCase()

  // 如果太短，扩展
  if (explanation.length < 20) {
    improved = `${concept}可以理解为一种核心的规律或机制。` + improved
  }

  // 如果没有类比，添加
  const analogyWords = ['就像', '好比', '类似', '比如', '相当于', '可以看作', '仿佛']
  const hasAnalogy = analogyWords.some((w) => lower.includes(w))
  if (!hasAnalogy) {
    const template = analogyTemplates[concept.trim()]
    if (template) {
      improved = improved + template
    } else {
      improved = improved + `我们可以把${concept}想象成生活中常见的一种现象——它就像某种大家都能感同身受的事物一样。`
    }
  }

  // 如果没有例子，添加
  const exampleWords = ['例如', '比如', '举个例子', '比如说']
  const hasExample = exampleWords.some((w) => lower.includes(w))
  if (!hasExample) {
    improved = improved + `举个例子，当你在实际生活中遇到类似情况时，${concept}就会帮助你做出更好的判断。`
  }

  // 如果包含概念循环定义
  if (explanation.includes(concept) && explanation.length < concept.length + 20) {
    improved = `${concept}描述的是一种特定的模式或关系。简单来说，它不是${concept}本身，而是背后那个更本质的东西。`
  }

  // 清理过长的
  if (improved.length > 200) {
    improved = improved.slice(0, 200) + '...'
  }

  return improved
}

function generateComparison(
  concept: string,
  explanation: string,
  feedback: string[]
): Array<{ original: string; suggestion: string; reason: string }> {
  const comparisons: Array<{ original: string; suggestion: string; reason: string }> = []
  const lower = explanation.toLowerCase()

  for (const fb of feedback) {
    if (fb.includes('太短')) {
      comparisons.push({
        original: explanation.slice(0, 30) + (explanation.length > 30 ? '...' : ''),
        suggestion: '增加类比和具体例子，让解释更丰满。',
        reason: '费曼学习法要求用完整的通俗语言解释清楚一个概念。',
      })
    } else if (fb.includes('太长')) {
      comparisons.push({
        original: explanation.slice(0, 40) + '...',
        suggestion: '精简语言，去掉冗余修饰，保留核心类比和例子。',
        reason: '简洁是费曼技巧的灵魂，用最少的词讲清楚才算真懂。',
      })
    } else if (fb.includes('类比')) {
      comparisons.push({
        original: '解释中缺少形象化的比喻',
        suggestion: `加入类比，比如把${concept}和日常生活联系起来。`,
        reason: '类比是费曼技巧的精髓，能帮助听众快速建立直觉理解。',
      })
    } else if (fb.includes('术语')) {
      comparisons.push({
        original: '使用了较多专业术语',
        suggestion: '用奶奶能听懂的大白话替换专业词汇。',
        reason: '真正的理解是能把专业概念翻译成日常语言。',
      })
    } else if (fb.includes('概念解释概念') || fb.includes('循环定义')) {
      comparisons.push({
        original: `用"${concept}"解释"${concept}"`,
        suggestion: '换一个角度，从本质、作用或类比入手，不直接重复概念名称。',
        reason: '循环定义没有增加任何信息量，说明还没真正理解。',
      })
    } else if (fb.includes('例子')) {
      comparisons.push({
        original: '解释中缺少具体例子',
        suggestion: '补充一个生活化的场景或案例。',
        reason: '抽象概念加上具体例子，才能让理解落地生根。',
      })
    }
  }

  // 如果没有生成任何对比项，给一个通用建议
  if (comparisons.length === 0) {
    const hasAnalogy = ['就像', '好比', '类似', '比如', '相当于', '可以看作', '仿佛'].some((w) => lower.includes(w))
    if (!hasAnalogy) {
      comparisons.push({
        original: '解释较为抽象',
        suggestion: '尝试加入一个形象的类比。',
        reason: '类比能帮助自己和他人建立直觉联系。',
      })
    } else {
      comparisons.push({
        original: explanation.slice(0, 30) + (explanation.length > 30 ? '...' : ''),
        suggestion: '可以在结尾加一句总结，点明这个概念的核心价值。',
        reason: '好的结尾能帮助听众记住重点。',
      })
    }
  }

  return comparisons.slice(0, 3)
}

function evaluateFeynman(concept: string, explanation: string) {
  const lower = explanation.toLowerCase()
  const conceptLower = concept.toLowerCase()

  let score = 0
  const feedback: string[] = []

  // 长度检查（费曼原则：简洁）
  if (explanation.length < 20) {
    feedback.push('太短了，再多说一点吧~')
    score -= 2
  } else if (explanation.length > 200) {
    feedback.push('有点长了哦，费曼学习法要求用尽量简洁的语言！')
    score -= 1
  } else {
    score += 2
    feedback.push('长度适中，很好！')
  }

  // 检查是否使用了类比/比喻（通俗化的标志）
  const analogyWords = ['就像', '好比', '类似', '比如', '相当于', '可以看作', '仿佛']
  const hasAnalogy = analogyWords.some((w) => lower.includes(w))
  if (hasAnalogy) {
    score += 3
    feedback.push('用了类比/比喻，非常符合费曼学习法！')
  }

  // 检查是否有专业术语堆砌
  const jargonWords = ['范式', '方法论', '架构', '机制', '模型', '理论', '体系', '框架', '原理']
  const jargonCount = jargonWords.filter((w) => lower.includes(w)).length
  if (jargonCount >= 3) {
    score -= 2
    feedback.push('专业术语有点多哦，试着用更日常的语言解释~')
  } else if (jargonCount <= 1) {
    score += 2
    feedback.push('语言很通俗易懂，赞！')
  }

  // 检查是否有"就是"、"简单来说"等简化表达
  const simpleWords = ['简单来说', '其实就是', '说白了', '换句话说']
  if (simpleWords.some((w) => lower.includes(w))) {
    score += 1
    feedback.push('有尝试简化表达的意识，继续保持！')
  }

  // 检查是否回避了概念本身（循环定义）
  if (explanation.includes(concept) && explanation.length < concept.length + 20) {
    score -= 3
    feedback.push('好像在用概念解释概念呢，试着换个角度~')
  }

  // 检查是否有示例
  const exampleWords = ['例如', '比如', '举个例子', '比如说']
  if (exampleWords.some((w) => lower.includes(w))) {
    score += 2
    feedback.push('举了例子，更容易理解！')
  }

  // 最终评分
  const finalScore = Math.max(0, Math.min(10, 5 + score))

  let level = ''
  if (finalScore >= 9) level = '大师级'
  else if (finalScore >= 7) level = '优秀'
  else if (finalScore >= 5) level = '良好'
  else level = '还需努力'

  const improvedVersion = generateImprovedVersion(concept, explanation, feedback)
  const comparison = generateComparison(concept, explanation, feedback)
  const memoryTip = generateMemoryTip(concept)

  return {
    score: finalScore,
    level,
    feedback,
    improvedVersion,
    comparison,
    memoryTip,
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { concept, explanation } = body

    if (!concept?.trim() || !explanation?.trim()) {
      return NextResponse.json({ error: '概念和解释都需要填写' }, { status: 400 })
    }

    const result = evaluateFeynman(concept, explanation)

    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
