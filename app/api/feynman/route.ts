import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

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

  return { score: finalScore, level, feedback }
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
