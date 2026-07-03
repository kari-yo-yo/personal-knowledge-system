import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, unauthorizedResponse } from '@/lib/auth-middleware'

const knownConcepts: Record<string, { explanation: string; keyPoints: string[] }> = {
  '复利': {
    explanation: '复利可以理解为「利滚利」——你赚的钱会继续帮你赚钱。它就像一个雪球从山坡上滚下来，越滚越大，时间越长，增长越惊人。举个例子，如果你投资1万元，年化收益10%，30年后不是变成4万，而是变成17万多！',
    keyPoints: ['说明利息也计入本金继续产生收益', '用雪球滚山坡的类比', '给出具体数字示例体现时间威力', '强调时间越长效果越显著'],
  },
  '熵增': {
    explanation: '熵增可以理解为「万事万物天然趋向混乱」。它就像一间房间，如果不打扫，自然而然就会积灰、变乱。要想让房间变整洁，必须主动投入能量去整理。同样，企业要维持秩序、生命体要维持健康，都需要持续做功对抗这种自然的混乱趋势。',
    keyPoints: ['解释熵增是自然趋向混乱的规律', '用房间变乱的日常类比', '指出对抗熵增需要主动投入能量', '联系到生命或组织的实际意义'],
  },
  '区块链': {
    explanation: '区块链可以理解为「大家一起记的公开账本」。它就像村里每个人都有一本同样的账本，每发生一笔交易，大家同时更新自己的账本，且用密码锁起来无法篡改。这样一来，不需要村长（中心机构）来担保，大家也能互相信任。',
    keyPoints: ['强调去中心化的分布式记账', '用村里共同记账的类比', '说明不可篡改的特性', '解释为什么能实现信任'],
  },
  '机会成本': {
    explanation: '机会成本可以理解为「你选择的代价是你放弃的那个选项」。它就像你周末只有一天假，选择了打游戏，那么机会成本就是你本可以用来看书、运动或陪伴家人的时间。每个选择背后，都有一个被放弃的最佳替代方案。',
    keyPoints: ['明确定义为放弃的最佳替代选项', '用周末时间的具体类比', '强调每个选择都有代价', '帮助读者形成决策思维'],
  },
  '沉没成本': {
    explanation: '沉没成本可以理解为「已经花出去且不可收回的钱或时间」。它就像你买了一张很难看的电影票，看了半小时发现很烂，但票价已经退不回来了。理性决策应该只看未来还要付出多少、能得到多少，而不是纠结已经损失的部分。',
    keyPoints: ['定义已发生且不可回收的成本', '用电影票的具体类比', '指出理性决策应面向未来', '警示不要因沉没成本而继续错误'],
  },
  '复利效应': {
    explanation: '复利效应可以理解为「利滚利」——你赚的钱会继续帮你赚钱。它就像一个雪球从山坡上滚下来，越滚越大，时间越长，增长越惊人。举个例子，如果你投资1万元，年化收益10%，30年后不是变成4万，而是变成17万多！',
    keyPoints: ['说明利息也计入本金继续产生收益', '用雪球滚山坡的类比', '给出具体数字示例体现时间威力', '强调时间越长效果越显著'],
  },
  '马太效应': {
    explanation: '马太效应可以理解为「强者愈强，弱者愈弱」的累积优势现象。它就像两个学生，一个基础好的学生因为得到更多关注和资源，学得更好；而基础弱的学生逐渐被忽视，差距越来越大。最初的小优势会随时间放大成巨大的鸿沟。',
    keyPoints: ['解释强者愈强的累积逻辑', '用学生学习的具体类比', '指出初始小优势会被放大', '联系社会、经济或教育现实'],
  },
  '认知失调': {
    explanation: '认知失调可以理解为「心里两个想法打架」的心理不适感。它就像你明知吸烟有害健康，却又忍不住抽了一支，这时候大脑会很不舒服。为了减少这种难受，人要么改变行为（戒烟），要么改变认知（说服自己「偶尔一支没事」）。',
    keyPoints: ['定义信念与行为冲突产生的不适', '用吸烟的具体类比', '解释人如何本能地减少失调', '联系日常生活中的心理调节'],
  },
  '墨菲定律': {
    explanation: '墨菲定律可以理解为「如果事情有变坏的可能，不管多小，它总会发生」。它就像你出门没带伞时偏偏下雨，烤面包时永远是涂了黄油的那一面朝下。它不是迷信，而是提醒我们：要对风险做最坏打算，提前准备预案。',
    keyPoints: ['简洁表述定律核心', '用日常糗事类比增强记忆', '解释其背后的概率思维', '强调风险预防的实用意义'],
  },
  '帕累托法则': {
    explanation: '帕累托法则（80/20法则）可以理解为「少数关键因素决定大部分结果」。它就像你衣柜里80%的时间只穿20%的衣服，或者公司80%的销售额来自20%的客户。它提醒我们：要把精力聚焦在真正重要的少数事情上。',
    keyPoints: ['清晰表述80/20的比例关系', '用衣柜或销售的日常类比', '强调聚焦关键少数的重要性', '给出实际应用的行动建议'],
  },
}

function generateStandardAnswer(concept: string) {
  const known = knownConcepts[concept.trim()]
  if (known) {
    return {
      concept,
      explanation: known.explanation,
      keyPoints: known.keyPoints,
    }
  }

  // 未知概念：尝试模糊匹配
  for (const [key, value] of Object.entries(knownConcepts)) {
    if (concept.includes(key) || key.includes(concept)) {
      return {
        concept,
        explanation: value.explanation,
        keyPoints: value.keyPoints,
      }
    }
  }

  // 通用模板
  const templates = [
    `${concept}可以理解为某种核心的机制或规律。它就像生活中一个大家熟悉的现象，能够帮助我们理解复杂事物背后的本质。要真正掌握${concept}，关键是找到具体的例子，把它和日常经验联系起来。`,
    `${concept}是一种重要的概念，简单来说就是它描述了一种特定的模式或关系。它就像一种工具，学会了就能帮你更好地看待相关问题。想要讲清楚${concept}，最好的办法是举一个身边人能感同身受的例子。`,
  ]
  const explanation = templates[Math.floor(Math.random() * templates.length)]

  return {
    concept,
    explanation,
    keyPoints: [
      `用一句话准确描述${concept}的核心含义`,
      '找一个日常生活里熟悉的类比',
      '举一个具体、可感知的例子',
      '说明这个概念在实际中有什么用',
      '避免用更复杂的术语来解释',
    ],
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { concept } = body

    if (!concept?.trim()) {
      return NextResponse.json({ error: '概念不能为空' }, { status: 400 })
    }

    const result = generateStandardAnswer(concept.trim())

    return NextResponse.json({ result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
