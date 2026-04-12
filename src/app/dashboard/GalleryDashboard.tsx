'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn, formatFileSize } from '@/lib/utils'
import { Download, Folder, Image as ImageIcon, Search, Share2, Upload, Video, Filter, ArrowUpDown } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

type MediaItem = {
  id: string
  name: string
  type: 'image' | 'video'
  sizeBytes: number
  createdAt: string
  folder: string
  contentUrl: string
}

type FolderItem = {
  id: string
  name: string
}

export default function GalleryDashboard() {
  const [query, setQuery] = useState('')
  const [activeFolder, setActiveFolder] = useState<string>('All')
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false)
  const [shareItem, setShareItem] = useState<MediaItem | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const [foldersState, setFoldersState] = useState<FolderItem[]>([])

  const [itemsState, setItemsState] = useState<MediaItem[]>([])

  const refreshFromServer = async () => {
    setIsSyncing(true)
    setSyncError('')

    try {
      const res = await fetch('/api/files', { cache: 'no-store' })
      const data = await res.json()

      if (!res.ok) {
        setSyncError(data?.error || 'Failed to load files')
        return
      }

      const items: MediaItem[] = (data?.files ?? []).map((f: any) => {
        const fileType = String(f?.fileType ?? '')
        const type: MediaItem['type'] = fileType.startsWith('video/') ? 'video' : 'image'
        const folder = f?.folder?.name ?? 'Gallery'

        return {
          id: String(f.id),
          name: String(f.originalName ?? f.filename ?? 'upload'),
          type,
          sizeBytes: Number(f.fileSize ?? 0),
          createdAt: String(f.createdAt ?? '').slice(0, 10),
          folder,
          contentUrl: `/api/files/${encodeURIComponent(String(f.id))}/content`,
        }
      })

      const folderNames = Array.from(new Set(items.map((i) => i.folder))).sort()
      setFoldersState(folderNames.map((name) => ({ id: `f-${name}`, name })))
      setItemsState(items)
    } catch (e) {
      setSyncError('Network error. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  useEffect(() => {
    void refreshFromServer()
  }, [])

  const folders = useMemo(() => {
    return ['All', ...foldersState.map((f) => f.name).sort()]
  }, [foldersState])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let filtered = itemsState.filter((item) => {
      if (activeFolder !== 'All' && item.folder !== activeFolder) return false
      if (!q) return true
      return item.name.toLowerCase().includes(q) || item.folder.toLowerCase().includes(q)
    })

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((item) => item.type === typeFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'size':
          return b.sizeBytes - a.sizeBytes
        case 'date':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [query, activeFolder, typeFilter, sortBy, itemsState])

  const onCreateFolder = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (foldersState.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) return
    setFoldersState((prev) => [{ id: `f-${Date.now()}`, name: trimmed }, ...prev])
    setActiveFolder(trimmed)
  }

  const onUploadFiles = async (files: File[], folderName: string) => {
    setIsSyncing(true)
    setSyncError('')

    try {
      const fd = new FormData()
      fd.set('folderName', folderName)
      for (const f of files) fd.append('files', f)

      const res = await fetch('/api/files', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()

      if (!res.ok) {
        setSyncError(data?.error || 'Upload failed')
        return
      }

      await refreshFromServer()
    } catch (e) {
      setSyncError('Network error. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your uploads…"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" onClick={() => setIsUploadOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
          <Button type="button" variant="outline" onClick={() => setIsNewFolderOpen(true)}>
            <Folder className="mr-2 h-4 w-4" />
            New folder
          </Button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {folders.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setActiveFolder(f)}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition-colors',
              activeFolder === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background hover:bg-muted'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Filter & Sort Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Type:</span>
          <Button
            variant={typeFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          <Button
            variant={typeFilter === 'image' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('image')}
          >
            <ImageIcon className="mr-1 h-3 w-3" />
            Images
          </Button>
          <Button
            variant={typeFilter === 'video' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter('video')}
          >
            <Video className="mr-1 h-3 w-3" />
            Videos
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Button
            variant={sortBy === 'date' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('date')}
          >
            Date
          </Button>
          <Button
            variant={sortBy === 'name' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('name')}
          >
            Name
          </Button>
          <Button
            variant={sortBy === 'size' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('size')}
          >
            Size
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="relative aspect-video bg-muted">
              {item.type === 'image' ? (
                <img
                  src={item.contentUrl}
                  alt={item.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  className="absolute inset-0 h-full w-full object-cover"
                  src={item.contentUrl}
                  muted
                  playsInline
                  preload="metadata"
                />
              )}
              <div className="absolute left-3 top-3 rounded-full bg-background/80 px-2 py-1 text-xs">
                {item.folder}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{item.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {item.createdAt} · {formatFileSize(item.sizeBytes)}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Download"
                    onClick={() => {
                      window.open(item.contentUrl, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Share"
                    onClick={() => setShareItem(item)}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-lg border bg-card p-8 text-center">
          <div className="text-sm text-muted-foreground">
            {isSyncing ? 'Loading your uploads…' : 'No uploads match your search.'}
          </div>
        </div>
      )}

      {syncError && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {syncError}
        </div>
      )}

      <UploadModal
        open={isUploadOpen}
        disabled={isSyncing}
        folders={foldersState.map((f) => f.name)}
        defaultFolder={activeFolder === 'All' ? foldersState[0]?.name ?? 'Gallery' : activeFolder}
        onClose={() => setIsUploadOpen(false)}
        onUpload={(files, folderName) => {
          void onUploadFiles(files, folderName)
          setIsUploadOpen(false)
        }}
      />

      <NewFolderModal
        open={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onCreate={(name) => {
          onCreateFolder(name)
          setIsNewFolderOpen(false)
        }}
      />

      <ShareModal item={shareItem} onClose={() => setShareItem(null)} />
    </div>
  )
}

function ModalShell({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean
  title: string
  children: React.ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-card p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="text-base font-semibold">{title}</div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <span className="text-lg leading-none">×</span>
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

function NewFolderModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (name: string) => void
}) {
  const [name, setName] = useState('')

  return (
    <ModalShell
      open={open}
      title="Create folder"
      onClose={() => {
        setName('')
        onClose()
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Folder name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Club Events" />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onCreate(name)
              setName('')
            }}
          >
            Create
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function UploadModal({
  open,
  disabled,
  folders,
  defaultFolder,
  onClose,
  onUpload,
}: {
  open: boolean
  disabled: boolean
  folders: string[]
  defaultFolder: string
  onClose: () => void
  onUpload: (files: File[], folderName: string) => void
}) {
  const [selectedFolder, setSelectedFolder] = useState(defaultFolder)
  const [picked, setPicked] = useState<File[]>([])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    multiple: true,
    accept: {
      'image/*': [],
      'video/*': [],
    },
    disabled,
    onDrop: (accepted) => {
      setPicked((prev) => [...prev, ...accepted])
    },
  })

  return (
    <ModalShell
      open={open}
      title="Upload files"
      onClose={() => {
        setPicked([])
        setSelectedFolder(defaultFolder)
        onClose()
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Folder</div>
          <select
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
          >
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            'rounded-xl border border-dashed p-6 text-center transition-colors',
            isDragActive ? 'bg-muted' : 'bg-background'
          )}
        >
          <input {...getInputProps()} />
          <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
            <div className="rounded-full border bg-muted p-3">
              <Upload className="h-5 w-5" />
            </div>
            <div className="text-sm font-medium">Drag & drop images/videos here</div>
            <div className="text-xs text-muted-foreground">or click to choose files</div>
          </div>
        </div>

        {picked.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Selected ({picked.length})</div>
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setPicked([])}
              >
                Clear
              </button>
            </div>
            <div className="max-h-40 overflow-auto rounded-md border">
              {picked.map((f) => (
                <div key={`${f.name}-${f.size}`} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0 truncate">{f.name}</div>
                  <div className="shrink-0 text-xs text-muted-foreground">{formatFileSize(f.size)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={disabled || picked.length === 0}
            onClick={() => {
              onUpload(picked, selectedFolder)
              setPicked([])
            }}
          >
            Upload
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function ShareModal({ item, onClose }: { item: MediaItem | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  const url = item ? `https://club-portal.local/share/${item.id}` : ''

  return (
    <ModalShell
      open={!!item}
      title="Share"
      onClose={() => {
        setCopied(false)
        onClose()
      }}
    >
      {item && (
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium">File</div>
            <div className="mt-1 text-sm text-muted-foreground">{item.name}</div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Link</div>
            <div className="flex gap-2">
              <Input value={url} readOnly />
              <Button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(url)
                  setCopied(true)
                  window.setTimeout(() => setCopied(false), 1500)
                }}
              >
                Copy
              </Button>
            </div>
            {copied && <div className="text-xs text-muted-foreground">Copied to clipboard</div>}
          </div>

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
