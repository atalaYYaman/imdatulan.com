# Chat Sistemi

Dosyalar: `app/actions/chatActions.ts`, `lib/pusher.ts`, `lib/pusher-server.ts`, `components/Chat/*`, `app/chat/page.tsx`, `lib/chatEnabled.ts`.

## Durum

`CHAT_ENABLED = false` → middleware `/chat`’i ana sayfaya yönlendirir. Altyapı kodda duruyor.

## Model

`ChatMessage`: `content`, `userId`, `parentId` (yanıt), `createdAt`.

Action katmanı FIFO / limit (yaklaşık son 100 mesaj) ve maskelenmiş kullanıcı adı döner (`ChatMessageDto`).

## Realtime

- Kanal: `global-chat`
- Event’ler: `new-message`, `message-deleted`, `chat-clear`
- Sunucu: `pusher` SDK · İstemci: `pusher-js`

## Actions

| Fonksiyon | Amaç |
|-----------|------|
| `sendMessage` | Gönder (rate limit ~1 / 10s) |
| `getChatMessages` | Liste |
| `deleteMessage` / `bulkDeleteMessages` | Moderasyon |

İsim maskeleme / anonimleştirme: `lib/masking.ts`, `lib/anonymization.ts`.

## İlgili Sayfalar

- [[Sistem Mimari]]
- [[API ve Server Actions]]
- [[Index]]
