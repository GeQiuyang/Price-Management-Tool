import { useState } from 'react'

export default function DocSidebar({
  folders,
  activeFolderId,
  activeDocId,
  onAddFolder,
  onDeleteFolder,
  onAddDoc,
  onDeleteDoc,
  onSelectDoc
}) {
  const [isAddingFolder, setIsAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [addingDocToFolderId, setAddingDocToFolderId] = useState(null)
  const [newDocTitle, setNewDocTitle] = useState('')

  const handleAddFolderSubmit = (e) => {
    e.preventDefault()
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim())
      setNewFolderName('')
      setIsAddingFolder(false)
    }
  }

  const handleAddDocSubmit = (e, folderId) => {
    e.preventDefault()
    if (newDocTitle.trim()) {
      onAddDoc(folderId, newDocTitle.trim())
      setNewDocTitle('')
      setAddingDocToFolderId(null)
    }
  }

  return (
    <div className="h-full flex flex-col w-full overflow-y-auto">
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-sm font-semibold tracking-wide text-ink uppercase">目录导航</h2>
        <button 
          onClick={() => setIsAddingFolder(true)}
          className="text-slate hover:text-ink transition-colors p-1"
          title="新建组"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {isAddingFolder && (
        <form onSubmit={handleAddFolderSubmit} className="mb-4 px-2">
          <input
            type="text"
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => setIsAddingFolder(false)}
            placeholder="输入组名..."
            className="w-full text-sm px-3 py-1.5 rounded-lg border border-slate/20 focus:border-ink/50 focus:ring-1 focus:ring-ink/50 outline-none transition"
          />
        </form>
      )}

      <div className="space-y-4 flex-1">
        {folders.map(folder => (
          <div key={folder.id} className="space-y-1">
            <div className="flex justify-between items-center px-2 py-1.5 group cursor-default">
              <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-slate/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {folder.name}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); setAddingDocToFolderId(folder.id) }}
                  className="p-1 text-slate/60 hover:text-blue-500 transition-colors"
                  title="添加文档"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id) }}
                  className="p-1 text-slate/60 hover:text-red-500 transition-colors"
                  title="删除组"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {addingDocToFolderId === folder.id && (
              <form onSubmit={(e) => handleAddDocSubmit(e, folder.id)} className="pl-6 pr-2 py-1">
                <input
                  type="text"
                  autoFocus
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onBlur={() => setAddingDocToFolderId(null)}
                  placeholder="输入文档名..."
                  className="w-full text-xs px-2 py-1 rounded border border-slate/20 focus:border-ink/50 focus:ring-1 focus:ring-ink/50 outline-none transition"
                />
              </form>
            )}

            <div className="space-y-0.5">
              {folder.docs.map(doc => {
                const isActive = activeDocId === doc.id
                return (
                  <div
                    key={doc.id}
                    onClick={() => onSelectDoc(folder.id, doc.id)}
                    className={`flex justify-between items-center pl-7 pr-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors group ${
                      isActive ? 'bg-black text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    <span className="truncate flex-1">{doc.title}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteDoc(folder.id, doc.id) }}
                      className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${isActive ? 'text-white/60 hover:text-white' : 'text-slate/40 hover:text-red-500'}`}
                      title="删除文档"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
              {folder.docs.length === 0 && !addingDocToFolderId && (
                <div className="pl-7 pr-2 py-1 text-xs text-slate/40 italic">
                  空
                </div>
              )}
            </div>
          </div>
        ))}
        {folders.length === 0 && (
          <div className="text-center py-6 text-xs text-slate/50">
            暂无目录，请先新建组
          </div>
        )}
      </div>
    </div>
  )
}
