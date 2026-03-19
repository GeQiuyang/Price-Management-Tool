import { useState, useEffect } from 'react'
import DocSidebar from '../components/ProductDocs/DocSidebar'
import DocEditor from '../components/ProductDocs/DocEditor'
import Modal from '../components/Modal'

const STORAGE_KEY = 'productDocsData'

const defaultData = [
  {
    id: 'folder-1',
    name: '默认目录',
    docs: [
      { id: 'doc-1', title: '新建文档', content: '# 新建文档\n在这里编写您的产品文档...' }
    ]
  }
]

export default function ProductDocs() {
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) {
        console.error('Failed to parse docs data', e)
        return defaultData
      }
    }
    return defaultData
  })

  const [activeFolderId, setActiveFolderId] = useState(folders[0]?.id || null)
  const [activeDocId, setActiveDocId] = useState(folders[0]?.docs[0]?.id || null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders))
  }, [folders])

  const handleAddFolder = (name) => {
    const newFolder = {
      id: `folder-${Date.now()}`,
      name,
      docs: []
    }
    setFolders([...folders, newFolder])
    setActiveFolderId(newFolder.id)
  }

  const handleDeleteFolder = (folderId) => {
    const folder = folders.find(f => f.id === folderId)
    setDeleteTarget({ type: 'folder', folderId, name: folder?.name })
  }

  const handleAddDoc = (folderId, title) => {
    const newDoc = {
      id: `doc-${Date.now()}`,
      title,
      content: `# ${title}\n`
    }
    setFolders(folders.map(f => {
      if (f.id === folderId) {
        return { ...f, docs: [...f.docs, newDoc] }
      }
      return f
    }))
    setActiveFolderId(folderId)
    setActiveDocId(newDoc.id)
  }

  const handleDeleteDoc = (folderId, docId) => {
    const folder = folders.find(f => f.id === folderId)
    const doc = folder?.docs.find(d => d.id === docId)
    setDeleteTarget({ type: 'doc', folderId, docId, name: doc?.title })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'folder') {
      const newFolders = folders.filter(f => f.id !== deleteTarget.folderId)
      setFolders(newFolders)
      if (activeFolderId === deleteTarget.folderId) {
        setActiveFolderId(newFolders[0]?.id || null)
        setActiveDocId(newFolders[0]?.docs[0]?.id || null)
      }
    } else if (deleteTarget.type === 'doc') {
      setFolders(folders.map(f => {
        if (f.id === deleteTarget.folderId) {
          return { ...f, docs: f.docs.filter(d => d.id !== deleteTarget.docId) }
        }
        return f
      }))
      if (activeDocId === deleteTarget.docId) {
        setActiveDocId(null)
      }
    }
    setDeleteTarget(null)
  }

  const handleUpdateDoc = (docId, updates) => {
    setFolders(folders.map(f => {
      const docExists = f.docs.some(d => d.id === docId)
      if (docExists) {
        return {
          ...f,
          docs: f.docs.map(d => d.id === docId ? { ...d, ...updates } : d)
        }
      }
      return f
    }))
  }

  const activeFolder = folders.find(f => f.id === activeFolderId) || folders.find(f => f.docs.some(d => d.id === activeDocId))
  const activeDoc = activeFolder?.docs.find(d => d.id === activeDocId) || null

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full lg:w-48 xl:w-56 shrink-0 h-full flex flex-col">
        <DocSidebar 
          folders={folders}
          activeFolderId={activeFolder?.id || null}
          activeDocId={activeDocId}
          onAddFolder={handleAddFolder}
          onDeleteFolder={handleDeleteFolder}
          onAddDoc={handleAddDoc}
          onDeleteDoc={handleDeleteDoc}
          onSelectDoc={(folderId, docId) => {
            setActiveFolderId(folderId)
            setActiveDocId(docId)
          }}
        />
      </div>
      
      <div className="hidden lg:block w-px bg-black/10 h-full shrink-0" />
      
      {/* Main Editor */}
      <div className="flex-1 min-w-0 h-full relative">
        {activeDoc ? (
          <DocEditor 
            doc={activeDoc} 
            onUpdate={(updates) => handleUpdateDoc(activeDoc.id, updates)} 
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate/40 text-sm">
            请在左侧选择或创建一个文档
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        width={500}
        footer={null}
      >
        <div style={{ padding: '8px 4px 4px' }}>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: '1.7', color: '#111111' }}>
            确定要删除{deleteTarget?.type === 'folder' ? '目录' : '文档'} <strong>{deleteTarget?.name}</strong> 吗？
          </p>
          {deleteTarget?.type === 'folder' && (
            <p style={{ margin: '12px 0 0', fontSize: '13px', lineHeight: '1.7', color: '#ef4444' }}>
              注意：删除目录将会连同其内部的所有文档一块永久删除，该操作不可恢复！
            </p>
          )}
          {deleteTarget?.type === 'doc' && (
            <p style={{ margin: '12px 0 0', fontSize: '13px', lineHeight: '1.7', color: '#64748B' }}>
              删除后该文档将无法恢复。
            </p>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="sf-btn sf-btn-cancel" onClick={() => setDeleteTarget(null)}>
              取消
            </button>
            <button type="button" className="sf-btn sf-btn-confirm" onClick={confirmDelete}>
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
