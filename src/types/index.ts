export interface User {
  id: string
  username: string
  email: string
  studentId: string
  role: 'MEMBER' | 'ADMIN' | 'CHAIRMAN' | 'CHAIRLADY' | 'TREASURER' | 'SECRETARY'
  createdAt: Date
}

export interface Folder {
  id: string
  name: string
  parentId?: string
  userId: string
  createdAt: Date
  children?: Folder[]
  files?: File[]
}

export interface File {
  id: string
  filename: string
  originalName: string
  fileType: string
  fileSize: number
  filePath: string
  folderId?: string
  userId: string
  createdAt: Date
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface QRLoginData {
  studentId: string
  qrCodeData: string
}

export interface CreateFolderData {
  name: string
  parentId?: string
}

export interface UploadFileData {
  file: File
  folderId?: string
}
