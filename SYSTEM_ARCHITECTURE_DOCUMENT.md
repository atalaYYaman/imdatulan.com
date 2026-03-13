# Otlak – System Architecture Document
## Reverse Engineering & Technical Blueprint for Mobile Migration

**Version:** 1.0  
**Date:** February 22, 2025  
**Purpose:** Blueprint for rebuilding the Next.js web app ("Otlak") as a scalable, SOLID-compliant Mobile Application.

---

## 1. Data Layer & Core Entities

### 1.1 Core Data Models (from `prisma/schema.prisma`)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Core identity, roles, academic info | `id`, `email`, `password`, `role`, `credits`, `approvalStatus`, `studentNumber`, `storeId` |
| **Note** | User-uploaded course materials | `id`, `title`, `fileUrl`, `price`, `status`, `uploaderId`, `pageCount` |
| **UnlockedNote** | Purchase record (user ↔ note) | `userId`, `noteId` (unique composite) |
| **Transaction** | Audit log for Milk (credits) movements | `userId`, `amount`, `balanceAfter`, `type`, `referenceId` |
| **Store** | Partner stores for Süt redemption | `id`, `name`, `logo`, `isActive` |
| **StoreProduct** | Products purchasable with Süt | `storeId`, `title`, `price`, `stock`, `type` |
| **StoreTransaction** | Redemption code purchase record | `userId`, `storeId`, `productId`, `redemptionCode`, `isRedeemed` |
| **Product** / **ProductPurchase** | Legacy/in-app products (separate from Store) | `price`, `priceAtTime` |
| **ChatMessage** | Global chat (FIFO 100 msgs) | `content`, `userId`, `parentId` (replies) |
| **Report**, **Feedback**, **ReleaseNote** | Moderation & changelog | - |
| **University**, **Faculty**, **Department** | Academic hierarchy for registration | - |
| **VerificationToken**, **TwoFactorToken**, **TwoFactorConfirmation** | Auth flows | - |
| **RateLimit** | DB-backed rate limiting | `key`, `count`, `expiresAt` |

### 1.2 Critical Relationships – The "Milk" Economy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MILK (Süt) FLOW DIAGRAM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   USER (credits) ◄────► TRANSACTION (audit)                                 │
│        │                     │                                              │
│        │   NOTE_UNLOCK       │  UPLOAD_REWARD (uploader)                    │
│        ▼                     │  PRODUCT_PURCHASE                            │
│   UnlockedNote ◄── buyer pays price ──► uploader receives price             │
│        │                     │                                              │
│        │   Store Purchase    │  StoreTransaction (redemptionCode)           │
│        ▼                     ▼                                              │
│   StoreTransaction ──► Partner redeems code (redeemProduct)                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **User.credits**: Single source of truth for Süt balance. All changes must go through `Transaction` records.
- **UnlockedNote**: Buyer gets access; no direct credit transfer between users—`unlockNote` handles both buyer deduction and uploader credit in one transaction.
- **Store flow**: `User.credits` → `StoreTransaction` (code generated) → Partner redeems via `redeemProduct`.

### 1.3 Enums & Hardcoded Types

| Location | Type | Values |
|----------|------|--------|
| **Prisma** | `TransactionType` | `UPLOAD_REWARD`, `NOTE_UNLOCK`, `ADMIN_ADJUSTMENT`, `PRODUCT_PURCHASE`, `REFUND` |
| **User** | `role` (string) | `"USER"`, `"ADMIN"`, `"PARTNER"` |
| **User** | `approvalStatus` | `"PENDING"`, `"APPROVED"`, `"REJECTED"`, `"BANNED"` |
| **Note** | `status` | `"PENDING"`, `"APPROVED"`, `"REJECTED"`, `"SUSPENDED"` |
| **Report** | `status` | `"PENDING"`, `"RESOLVED"`, `"REJECTED"` |
| **StoreProduct** | `type` | `"PHYSICAL_ITEM"`, `"COUPON"`, `"SERVICE"` |
| **User** | `programLevel` | `"Ön Lisans"`, `"Lisans"`, `"Yüksek Lisans"`, `"Doktora"` |

---

## 2. Business Logic & Workflows

### 2.1 The "Milk" Economy

**Files:** `app/actions/milk.ts`, `app/actions/noteActions.ts`, `app/actions/storeActions.ts`

#### Currency Calculation & Transfer

| Operation | Function | Logic |
|-----------|----------|-------|
| **Add Credits** | `addCredits()` | `prisma.$transaction`: read user → `credits + amount` → update User → create Transaction (positive amount) |
| **Spend Credits** | `spendCredits()` | `prisma.$transaction`: read user → check `credits >= amount` → `credits - amount` → create Transaction (negative amount) |
| **Note Unlock** | `unlockNote()` | Atomic: (1) deduct buyer, (2) add uploader, (3) create UnlockedNote, (4) two Transaction records |
| **Store Purchase** | `buyStoreProduct()` | Atomic: check stock, deduct credits, create StoreTransaction with `redemptionCode` |

#### Protection Mechanisms

- **`prisma.$transaction`** used for all credit changes (`addCredits`, `spendCredits`, `unlockNote`, `buyStoreProduct`).
- **Balance snapshot** stored in `Transaction.balanceAfter` for audit.
- **Zod validation** on inputs (`TransactionSchema`, `UnlockNoteSchema`, `productSchema`, etc.).
- **Like reward**: Every 10th like on a note grants uploader +1 Süt (`noteActions.toggleLike`). *Note: Uses non-transactional `increment`—potential race if two likes at exact same time.*

#### Credit Award Sources

- **Upload approval**: `adminActions.approveNote` → +3 Süt (fixed).
- **API approve** (`/api/admin/notes/approve`): +`note.price` Süt. *(Inconsistency: two different amounts for same action.)*
- **Note sale**: Buyer pays → uploader receives (via `unlockNote`).
- **Like milestone**: Every 10 likes → +1 Süt to uploader.

---

### 2.2 Secure File Proxy

**Files:** `app/api/download/[noteId]/route.ts`, `app/api/files/[noteId]/route.ts`, `app/api/files/identity/[userId]/route.ts`

#### Flow (Primary: `/api/download/[noteId]`)

1. **Auth**: Session required (middleware + route check).
2. **Rate limit**: 10 requests/min per user (`checkRateLimit(\`download_${userId}\`, 10, 60)`).
3. **Note validation**: Fetch note, check `deletedAt`, `status` (PENDING/REJECTED/SUSPENDED handled).
4. **Access control**:
   - Owner: full access.
   - Admin: full access.
   - Unlocked: full access.
   - Others: preview only (truncated PDF).
5. **SSRF protection**: `fileUrl` must contain `blob.vercel-storage.com` or `pub-`.
6. **Preview logic** (locked): 1–5 pages → 1 page; 6–10 → 2 pages; 11+ → 3 pages. Uses `pdf-lib` to copy pages into new PDF.
7. **Response**: Stream with `Cache-Control: no-store`, `Content-Disposition: inline`, optional `X-Preview-Mode: true`.

#### Other File Routes

- **`/api/files/[noteId]`**: Simpler proxy, uses `isNoteUnlocked()` from `noteActions`. Used by admin NoteApprovalList for preview.
- **`/api/files/identity/[userId]`**: Student ID card proxy. Owner or Admin only. Streams `studentIdCardUrl` from Blob.

#### Blob URLs

- Vercel Blob (`@vercel/blob`). Trusted domains: `blob.vercel-storage.com`, `pub-`.
- Files never exposed directly; all access via proxy.

---

### 2.3 Store & Partner System

**Files:** `app/actions/storeActions.ts`, `lib/validations/store.ts`

#### Redemption Code Generation

- **Format**: `RD-` + 8 hex chars (`crypto.randomBytes(4).toString('hex').toUpperCase()`), e.g. `RD-A1B2C3D4`.
- **Validation**: `redeemSchema` requires 11 chars (matches format).
- Generated atomically inside `buyStoreProduct` transaction.

#### Redemption Flow (`redeemProduct`)

1. Caller must be `PARTNER` with `storeId`.
2. Rate limit: 10 attempts / 5 min per user.
3. Lookup `StoreTransaction` by `redemptionCode`.
4. Checks: `transaction.storeId === user.storeId`, `!transaction.isRedeemed`.
5. Update: `isRedeemed: true`, `redeemedAt`, `redeemedBy`.

#### Partner Access

- `getPartnerDashboard`: Returns store + products + transactions for `user.storeId`.
- `updateProductStock`: Partner can update stock only for products in their store (`product.storeId === user.storeId`).

---

### 2.4 Watermarking Strategy

**Current Implementation: Dual-Layer**

| Layer | Location | Technology | Content |
|-------|----------|------------|---------|
| **Client-side (primary)** | `components/note/NoteViewer.tsx` | HTML5 Canvas (`drawWatermark`) | "OTLAK.COM.TR", user name, student number (2×4 grid, rotated -30°) |
| **Server-side (alternate)** | `app/api/notes/[noteId]/file/route.ts` | pdf-lib | Baked: "OTLAK.COM.TR", user name, student number (3×4 grid) |
| **Legacy (unused)** | `lib/watermark.ts` | pdf-lib | "NOD" watermark |

**Primary flow** (notes page): Uses `/api/download/[noteId]`, which does **not** watermark. Watermark is applied client-side in `NoteViewer` via:

- `SecurePage`: react-pdf `Page` with `canvasRef` → `onRenderSuccess` → `drawWatermark(canvasRef.current)`.
- `SecureImage`: Load image into canvas, draw image, then `drawWatermark`, render only canvas (no raw `<img>`).

**Security**: Transparent overlay blocks right-click; `onContextMenu` preventDefault. Watermark drawn on same canvas as content.

---

## 3. Security Protocols

### 3.1 Authentication

**Files:** `lib/auth.ts`, `app/actions/auth.ts`, `app/api/auth/[...nextauth]/route.ts`

- **Provider**: Credentials only (email + password).
- **Session**: JWT strategy (`strategy: "jwt"`).
- **Verification**:
  - `approvalStatus !== 'APPROVED'` (except ADMIN) → "Hesabınız henüz onaylanmamıştır."
  - `approvalStatus === 'BANNED'` → "Hesabınız yasaklanmıştır."
- **2FA (Admin only)**:
  - On login, `TwoFactorConfirmation` cleared.
  - JWT callback fetches `twoFactorConfirmation`; if present → `isTwoFactorVerified: true`.
  - Middleware redirects unverified admins to `/auth/verify-email`.

### 3.2 Authorization (RBAC)

**Roles:** `USER`, `ADMIN`, `PARTNER`

| Role | Allowed Paths | Restrictions |
|------|---------------|--------------|
| **USER** | Full app (notes, upload, chat, store, etc.) | Approval required |
| **ADMIN** | `/admin/*` + 2FA | Must complete 2FA to access admin |
| **PARTNER** | `/`, `/store`, `/updates`, `/partner/*`, `/auth` | Redirect if accessing other routes |

**Enforcement:**

- `middleware.ts`: Path-based redirects.
- Server Actions: `getServerSession` + role check (e.g. `(session?.user as any)?.role !== 'ADMIN'`).
- API routes: Same pattern.

### 3.3 Data Protection (IDOR Prevention)

| Check | Implementation |
|-------|----------------|
| **Note access** | `note.uploaderId === userId` or `UnlockedNote` or `role === 'ADMIN'` |
| **Identity file** | `caller.id === userId` or `caller.role === 'ADMIN'` |
| **Partner store** | `product.storeId === user.storeId` in `updateProductStock`, `redeemProduct` |
| **Note list** | `fileUrl` never returned in `getNotes`—only proxy URL used |
| **Student ID masking** | `maskStudentNumber()` in chat: `20****056` (first 2 + last 3) |

### 3.4 Rate Limiting

**File:** `lib/rate-limit.ts`

- **Storage**: `RateLimit` table (`key`, `count`, `expiresAt`).
- **Logic**: Sliding window; reset if expired; increment; reject if `count >= limit`.
- **Fail mode**: Fail closed on DB error.

| Operation | Key | Limit | Window |
|-----------|-----|-------|--------|
| Login | `email` | 5 | 60s |
| Password reset | `reset:${email}` | 3 | 600s |
| 2FA request | `2fa-req:${email}` | 3 | 300s |
| Registration | `register_${ip}` | 3 | 3600s |
| Upload | `upload_${email}` | 5 | 3600s |
| Download | `download_${userId}` | 10 | 60s |
| Comment | `comment_${userId}` | 5 | 60s |
| Report | `report_${userId}` | 3 | 600s |
| Chat send | `chat_${userId}` | 1 | 10s |
| Redeem | `redeem-${userId}` | 10 | 300s |

---

## 4. API Surface & Mutation Strategy

### 4.1 REST API Endpoints (Existing)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/api/download/[noteId]` | Secure note file proxy | Session |
| GET | `/api/files/[noteId]` | Note file proxy (admin preview) | Session |
| GET | `/api/files/identity/[userId]` | Student ID card proxy | Owner/Admin |
| GET | `/api/notes/[noteId]/file` | Note file with server watermark | Session |
| POST | `/api/upload` | Create note (file or blobUrl) | Session |
| POST | `/api/upload-blob-direct` | Direct blob upload (≤4MB) | Session |
| POST | `/api/upload-handler` | Client-side blob token exchange | Session |
| POST | `/api/auth/signup` | Minimal signup (email+password) | None |
| POST | `/api/admin/notes/approve` | Approve note, award credits | Admin |
| POST | `/api/admin/notes/reject` | Reject note | Admin |

### 4.2 Server Actions → REST/TRPC Mapping

| Server Action | File | Suggested API | Request DTO | Response DTO |
|---------------|------|---------------|-------------|--------------|
| `registerUser` | `user.ts` | `POST /auth/register` | `RegistrationData` | `{ success, message, userId? }` |
| `resetPassword` | `auth.ts` | `POST /auth/reset-password` | `{ token, email, newPassword }` | `{ success, message }` |
| `sendPasswordResetEmail` | `auth.ts` | `POST /auth/forgot-password` | `{ email }` | `{ success, message }` |
| `verifyTwoFactor` | `auth.ts` | `POST /auth/2fa/verify` | `{ token, email }` | `{ success, message }` |
| `getNotes` | `getNotes.ts` | `GET /notes` | - | `Note[]` (no fileUrl) |
| `getNoteDetail` | `noteActions.ts` | `GET /notes/:id` | - | `NoteDetail` |
| `unlockNote` | `noteActions.ts` | `POST /notes/:id/unlock` | `{ noteId }` | `{ success, message }` |
| `incrementView` | `noteActions.ts` | `POST /notes/:id/view` | - | void |
| `addComment` | `noteActions.ts` | `POST /notes/:id/comments` | `{ text }` | `{ success }` |
| `toggleLike` | `noteActions.ts` | `POST /notes/:id/like` | - | `{ success }` |
| `createReport` | `noteActions.ts` | `POST /notes/:id/report` | `{ reason, details }` | `{ success, message }` |
| `deleteNote` | `noteActions.ts` | `DELETE /notes/:id` | - | `{ success, message }` |
| `addCredits` / `spendCredits` | `milk.ts` | Internal only (admin) | - | - |
| `getTransactionHistory` | `milk.ts` | `GET /wallet/transactions` | - | `Transaction[]` |
| `getStoreProducts` | `storeActions.ts` | `GET /store/products` | `?storeId=` | `{ success, data }` |
| `buyStoreProduct` | `storeActions.ts` | `POST /store/purchase` | `{ productId }` | `{ success, code, message }` |
| `getUserCoupons` | `storeActions.ts` | `GET /store/coupons` | - | `{ success, data }` |
| `redeemProduct` | `storeActions.ts` | `POST /partner/redeem` | `{ code }` | `{ success, message, product? }` |
| `getPartnerDashboard` | `storeActions.ts` | `GET /partner/dashboard` | - | `{ success, data }` |
| `sendMessage` | `chatActions.ts` | `POST /chat/messages` | `{ content, parentId? }` | `{ success, data: ChatMessageDto }` |
| `getChatMessages` | `chatActions.ts` | `GET /chat/messages` | - | `ChatMessageDto[]` |
| `submitFeedback` | `feedbackActions.ts` | `POST /feedback` | FormData | `{ success, message }` |
| `getReleaseNotes` | `changelogActions.ts` | `GET /updates` | - | `{ success, data }` |
| Admin actions | `adminActions.ts` | `POST /admin/*` | Various | Various |

### 4.3 Critical DTOs to Preserve

- **`ChatMessageDto`**: `{ id, content, createdAt, parentId?, user: { id, name } }` — name is masked.
- **`RegistrationData`**: See `user.ts` type.
- **`TransactionResult`**: `{ success, message, newBalance? }`.
- **`UnlockNoteSchema`**: `{ noteId: cuid }`.
- **Store schemas**: `createStoreSchema`, `productSchema`, `assignPartnerSchema`, `redeemSchema`.

---

## 5. Mobile Adaptation Risks

### 5.1 Watermarking

| Web | Mobile Risk | Mitigation |
|-----|-------------|------------|
| HTML5 Canvas in browser | React Native has no DOM; `react-pdf` / canvas APIs differ | Use **Skia** (e.g. `@shopify/react-native-skia`) or **server-side watermarking only** |
| Client-side `drawWatermark` | Different rendering pipeline | Prefer `/api/notes/[noteId]/file` (server watermark) or new server endpoint that returns watermarked PDF for mobile |
| `lib/watermark.ts` | Unused; can be repurposed | Consider server-side pipeline for all mobile downloads |

**Recommendation:** For mobile, serve only watermarked PDFs from the server. Avoid client-side canvas watermarking.

---

### 5.2 File Proxy & Vercel Blob

| Web | Mobile Risk | Mitigation |
|-----|-------------|------------|
| Session cookie in fetch | Mobile may use Bearer token; cookies not automatic | Ensure download API accepts `Authorization: Bearer <token>` |
| Same-origin requests | Cross-origin from mobile app | CORS irrelevant; ensure API accepts mobile client |
| Streaming response | Large PDF on cellular | Consider range requests or chunked download; show progress |
| Blob URL fetch from server | Same server-to-blob fetch | No change; server fetches from Blob and streams |

---

### 5.3 Real-Time Chat (Pusher)

| Web | Mobile Risk | Mitigation |
|-----|-------------|------------|
| `pusher-js` in browser | React Native needs `pusher-websocket-react-native` or similar | Use Pusher SDK for React Native / Expo |
| Channel `global-chat` | Same | No change |
| Events: `new-message`, `message-deleted`, `chat-clear` | Same | Preserve event names and payloads |
| `router.refresh()` on `chat-clear` | Next.js specific | Replace with state reset / refetch on mobile |

---

### 5.4 Next.js–Specific Behavior

| Feature | Mobile Impact |
|---------|---------------|
| **Server Actions** | Not available; must become REST or tRPC |
| **revalidatePath** | N/A; use cache invalidation or refetch |
| **getServerSession** | Replace with token validation (JWT) in API middleware |
| **FormData** in actions | Use multipart REST; same validation logic |
| **Dynamic import** of `NoteViewer` | Use lazy loading / code splitting in RN |
| **react-pdf** | Use `react-native-pdf` or similar for PDF rendering |

---

### 5.5 Upload Flow

| Web | Mobile Risk |
|-----|-------------|
| `upload-handler` token exchange | Works if mobile can call API for token, then upload to Vercel Blob client-side |
| 4MB serverless body limit | Same; large files need client→Blob direct upload |
| `handleUpload` from `@vercel/blob/client` | Web SDK; mobile needs custom flow: (1) GET upload URL/token from API, (2) PUT to Blob |

---

### 5.6 PDF Rendering

| Web | Mobile |
|-----|--------|
| `react-pdf` + pdf.js worker | `react-native-pdf`, `react-native-pdf-renderer`, or WebView with PDF |
| Canvas-based page render | Native PDF view or WebView |
| `SecurePage` / `SecureImage` | Custom native component or WebView for complex cases |

---

## Appendix: File Reference Quick Index

| Category | Files |
|----------|-------|
| **Schema** | `prisma/schema.prisma` |
| **Auth** | `lib/auth.ts`, `app/actions/auth.ts` |
| **Milk** | `app/actions/milk.ts`, `app/actions/noteActions.ts` (unlockNote) |
| **Store** | `app/actions/storeActions.ts`, `lib/validations/store.ts` |
| **File Proxy** | `app/api/download/[noteId]/route.ts`, `app/api/files/*` |
| **Watermark** | `components/note/NoteViewer.tsx`, `app/api/notes/[noteId]/file/route.ts` |
| **Rate Limit** | `lib/rate-limit.ts` |
| **Chat** | `app/actions/chatActions.ts`, `lib/pusher-server.ts`, `lib/pusher.ts` |
| **Middleware** | `middleware.ts` |
| **Schemas** | `lib/schemas.ts`, `lib/validations/store.ts` |
| **Masking** | `lib/masking.ts` |
