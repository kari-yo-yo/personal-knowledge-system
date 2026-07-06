'use client'

import { useState } from 'react'
import { Sparkles, Check, X, ChevronDown, BrainCircuit } from 'lucide-react'

interface AIClassifyPanelProps {
  text: string
  onConfirm: (nodeId: string) => void
  onCancel: () => void
}

interface NodeOption {
  nodeId: string
  nodeName: string
}

export function AIClassifyPanel({ text, onConfirm, onCancel }: AIClassifyPanelProps) {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [correctionMode, setCorrectionMode] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string>('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [savingCorrection, setSavingCorrection] = useState(false)

  const handleClassify = async () => {
    setLoading(true)
    setCorrectionMode(false)
    setFeedback(null)
    try {
      const res = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      setResult(data)
      if (data.suggestedNodeId) {
        setSelectedNodeId(data.suggestedNodeId)
      }
    } catch (error) {
      console.error('AI classify failed:', error)
    }
    setLoading(false)
  }

  const allNodes: NodeOption[] = result
    ? [
        { nodeId: result.suggestedNodeId, nodeName: result.suggestedNodeName },
        ...(result.alternatives || []),
      ].filter((n, i, arr) => arr.findIndex((t) => t.nodeId === n.nodeId) === i)
    : []

  const handleCorrectSave = async () => {
    if (!selectedNodeId || !result) return
    setSavingCorrection(true)
    try {
      const res = await fetch('/api/ai/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          originalNodeId: result.suggestedNodeId,
          correctNodeId: selectedNodeId,
        }),
      })
      if (res.ok) {
        setFeedback('已学习您的偏好，下次会更准确！')
        setTimeout(() => setFeedback(null), 3000)
      }
    } catch (error) {
      console.error('Save correction failed:', error)
    }
    setSavingCorrection(false)
    onConfirm(selectedNodeId)
  }

  if (!result) {
    return (
      <button
        onClick={handleClassify}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50 transition-colors hover:opacity-90"
        style={{ background: '#FF8C42' }}
      >
        <Sparkles size={16} />
        {loading ? 'AI 分析中...' : 'AI 智能归档'}
      </button>
    )
  }

  return (
    <div className="rounded-lg p-4 border" style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={16} style={{ color: '#FF8C42' }} />
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          AI 建议归档到：
        </span>
        {result.isFromPreference && (
          <span
            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{ background: '#FFE4D6', color: '#FF8C42' }}
          >
            <BrainCircuit size={12} />
            根据您的偏好
          </span>
        )}
      </div>

      <div className="mb-3">
        <div
          className="px-3 py-2 rounded-lg font-medium"
          style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}
        >
          {result.suggestedNodeName || '推荐节点'}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          置信度: {Math.round(result.confidence * 100)}%
        </div>
      </div>

      {feedback && (
        <div
          className="mb-3 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{ background: '#E8F5E9', color: '#4CAF50' }}
        >
          <Check size={14} />
          {feedback}
        </div>
      )}

      {!correctionMode ? (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onConfirm(result.suggestedNodeId)}
            className="flex items-center gap-1 px-3 py-1.5 text-white rounded-lg text-sm transition-colors hover:opacity-90"
            style={{ background: '#4CAF50' }}
          >
            <Check size={14} /> 归档正确
          </button>
          <button
            onClick={() => setCorrectionMode(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors hover:opacity-90"
            style={{ background: '#FFF0E6', color: '#FF6B8A', border: '1px solid #FFD6D6' }}
          >
            <X size={14} /> 归档错误
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm"
          >
            取消
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-muted)' }}>
              请选择正确的归档节点：
            </label>
            <div className="relative">
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm appearance-none border focus:outline-none focus:ring-2"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  borderColor: 'var(--glass-border)',
                  color: 'var(--text-primary)',
                }}
              >
                {allNodes.map((node) => (
                  <option key={node.nodeId} value={node.nodeId}>
                    {node.nodeName}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--text-muted)' }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleCorrectSave}
              disabled={savingCorrection || !selectedNodeId}
              className="flex items-center gap-1 px-3 py-1.5 text-white rounded-lg text-sm transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: '#FF6B8A' }}
            >
              {savingCorrection ? (
                <>
                  <Sparkles size={14} className="animate-spin" /> 学习中...
                </>
              ) : (
                <>
                  <Check size={14} /> 确认修正并保存
                </>
              )}
            </button>
            <button
              onClick={() => setCorrectionMode(false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm"
            >
              返回
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
