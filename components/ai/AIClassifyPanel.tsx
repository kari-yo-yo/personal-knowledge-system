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
      
      <div className="mb-3">
        <div className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg font-medium">
          {result.suggestedNodeName || '推荐节点'}
        </div>
        <div className="text-xs text-slate-500 mt-1">
          置信度: {Math.round(result.confidence * 100)}%
        </div>
      </div>

      {result.alternatives && result.alternatives.length > 0 && (
        <div className="mb-3">
          <span className="text-xs text-slate-500">其他选项：</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {result.alternatives.map((alt: any) => (
              <button
                key={alt.nodeId}
                onClick={() => onConfirm(alt.nodeId)}
                className="px-2 py-1 bg-white border border-purple-200 text-purple-700 rounded text-xs hover:bg-purple-50"
              >
                {alt.nodeName}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(result.suggestedNodeId)}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
        >
          <Check size={14} /> 确认保存到「{result.suggestedNodeName}」
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
