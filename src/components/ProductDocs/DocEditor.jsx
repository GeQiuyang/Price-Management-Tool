import { useState, useEffect } from 'react'
import MDEditor, { commands } from '@uiw/react-md-editor'

export default function DocEditor({ doc, onUpdate }) {
  const [title, setTitle] = useState(doc?.title || '')
  const [content, setContent] = useState(doc?.content || '')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setTitle(doc?.title || '')
    setContent(doc?.content || '')
  }, [doc])

  const handleTitleBlur = () => {
    if (title.trim() !== doc.title) {
      onUpdate({ title: title.trim() || '未命名文档' })
    }
  }

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    }
  }

  const handleContentChange = (val) => {
    setContent(val || '')
  }

  const handleSave = () => {
    setIsSaving(true)
    onUpdate({ title: title.trim() || '未命名文档', content })
    setTimeout(() => setIsSaving(false), 500)
  }

  if (!doc) return null

  const saveCommand = {
    name: 'save',
    keyCommand: 'save',
    buttonProps: { 'aria-label': '保存文档', title: '保存文档' },
    icon: (
      <div className="flex items-center justify-center p-0.5">
        <svg className={`w-4 h-4 transition-colors ${isSaving ? 'text-green-500' : 'text-slate-600 hover:text-black'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isSaving ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          )}
        </svg>
      </div>
    ),
    execute: (state, api) => {
      handleSave()
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="px-2 py-4 border-b border-black/5 flex-shrink-0">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          className="text-2xl font-bold text-ink bg-transparent focus:outline-none w-full placeholder-slate/30"
          placeholder="无标题文档"
        />
      </div>
      
      <div className="flex-1 overflow-hidden relative" data-color-mode="light">
        <MDEditor
          value={content}
          onChange={handleContentChange}
          height="100%"
          className="!border-0 !rounded-none !bg-transparent"
          previewOptions={{
            className: "apple-prose !bg-transparent"
          }}
          extraCommands={[
            saveCommand,
            commands.divider,
            ...commands.getExtraCommands()
          ]}
          style={{
             boxShadow: 'none',
             height: '100%',
             backgroundColor: 'transparent'
          }}
        />
      </div>
      
      {/* Adding some global overrides for uiw/react-md-editor to blend with Apple design */}
      <style>{`
        .w-md-editor-toolbar {
          background-color: transparent !important;
          border-bottom: 1px solid rgba(0,0,0,0.05) !important;
        }
        .w-md-editor-content {
          background-color: transparent !important;
        }
        .wmde-markdown {
          background-color: transparent !important;
          color: #1d1d1f !important;
        }
        .w-md-editor:not(.w-md-editor-fullscreen) {
          background-color: transparent !important;
        }
        .w-md-editor-fullscreen {
          background-color: #ffffff !important;
          border-radius: 24px !important;
          overflow: hidden !important;
          top: 16px !important;
          left: 16px !important;
          right: 16px !important;
          bottom: 16px !important;
          height: calc(100% - 32px) !important;
          width: calc(100% - 32px) !important;
          box-sizing: border-box !important;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25) !important;
          border: 1px solid rgba(0,0,0,0.08) !important;
        }
        .w-md-editor-fullscreen .w-md-editor-toolbar {
          background-color: #ffffff !important;
          border-bottom: none !important;
        }
      `}</style>
    </div>
  )
}
