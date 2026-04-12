import { EventEmitter } from 'events'

type ChatEventPayload = {
  type: 'message' | 'message_deleted'
  roomId: string
  message?: any
  messageId?: string
}

const GLOBAL_CHANNEL = '__global__'

const globalForChatEvents = globalThis as unknown as {
  __chatEvents?: EventEmitter
}

const emitter = globalForChatEvents.__chatEvents ?? new EventEmitter()

if (!globalForChatEvents.__chatEvents) {
  emitter.setMaxListeners(0)
  globalForChatEvents.__chatEvents = emitter
}

export function publishChatEvent(payload: ChatEventPayload) {
  emitter.emit(payload.roomId, payload)
  emitter.emit(GLOBAL_CHANNEL, payload)
}

export function subscribeToRoom(roomId: string, cb: (payload: ChatEventPayload) => void) {
  emitter.on(roomId, cb)
  return () => emitter.off(roomId, cb)
}

export function subscribeToAll(cb: (payload: ChatEventPayload) => void) {
  emitter.on(GLOBAL_CHANNEL, cb)
  return () => emitter.off(GLOBAL_CHANNEL, cb)
}
