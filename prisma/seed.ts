import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const root = await prisma.node.create({
    data: {
      name: '个人成长总系统',
      type: 'ROOT',
      color: '#4a90d9',
    },
  })

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
        type: 'SYSTEM',
        parentId: root.id,
        color: sys.color,
      },
    })

    for (const sub of sys.subs) {
      await prisma.node.create({
        data: {
          name: sub,
          type: 'SUBSYSTEM',
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
