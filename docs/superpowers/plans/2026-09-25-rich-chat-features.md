# Rich Chat Features Implementation Plan: Documents, Videos, Replies, Gallery, Search & Pinned Messages

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform wingfucat into a comprehensive rich-media couple chat application with generic document & video sharing, themed inline video playback, swipe/click message replies, full-screen media lightbox & shared media gallery, in-chat keyword search, and collapsible pinned messages—all deeply integrated with the dynamic theme system (Minimalist OLED, Terminal TUI, Daylight, and custom frosting).

**Architecture:**
- **Backend (PocketBase):** Extend `messages` collection with new `media_type` options (`video`, `file`), expand `attachment` MIME types and 50MB ceiling, add `reply_to` (relation) and `is_pinned` / `pinned_at` fields.
- **Frontend (React 19 + Tailwind):** Modular component architecture adhering to strict theme tokens:
  - `DocumentCard.tsx`: Downloadable file attachment card with file-type iconography and byte formatting.
  - `VideoPlayer.tsx`: Lightweight, theme-aware inline video player with custom play/pause and progress scrubbing.
  - `ReplyBar.tsx` & Quoted Bubble Headers: Active reply composer preview and bubble reference linking.
  - `MediaLightbox.tsx` & `SharedGalleryModal.tsx`: Zoomable full-screen media inspection and categorized media browsing.
  - `SearchOverlay.tsx`: Fast header search bar with keyword highlighting and auto-scroll to matched message.
  - `PinnedBanner.tsx`: Collapsible pinned message marquee under `<Header />` with pin/unpin controls.
- **Theme Integrity:** Every new UI component directly binds CSS variables (`--theme-bg-surface`, `--theme-accent`, `--theme-text-primary`, `--theme-border-subtle`, `--theme-bubble-backdrop`) and includes specialized styling for Terminal TUI (`#00ff41`, raw borders, ASCII brackets) and Daylight.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, PocketBase JS SDK, Vitest, Testing Library, Google Material Symbols Rounded exclusively.

---

## Global Constraints

1. **Strict Theme Integration:**
   - All components must react dynamically to `useTheme()` context.
   - For `terminal-tui`: pure black `#000000`, phosphor green `#00ff41`, font `JetBrains Mono`, ASCII brackets (`[ FILE ]`, `[ REPLY ]`, `[ PIN ]`), zero rounded corners.
   - For `daylight`: paper off-white `#f8f9fa`, slate text `#0f172a`, blue selection.
   - Support `bubbleTransparent` and `--theme-bubble-backdrop: blur(8px)`.
2. **Iconography Invariant:**
   - Google Fonts **Material Symbols Rounded EXCLUSIVELY** via `<Icon name="..." />` from `src/components/Icon.tsx`. Zero Lucide, FontAwesome, or other icon libraries.
3. **Mobile Viewport & Inner Scroll Invariant:**
   - NEVER call `element.scrollIntoView()` on subcontainer elements. Scroll containers directly (`container.scrollTop = container.scrollHeight`).
   - Keep document window scroll locked at `(0, 0)` via passive scroll listener.
4. **Server-Authoritative Time Invariant:**
   - All cutoff and sequence timestamps must anchor to server timestamps (`latestMsg.created` or server Date header), never client `new Date()`.
5. **Local Filesystem Boundary:**
   - Strictly contained within `/home/retro/retroistickx/projects/wingfucat`.

---

## Task 1: Backend PocketBase Schema Migration

**Files:**
- Modify: `backend/setup_schema.js:140-220`
- Modify: `backend/tests/schema_rules.test.js`

**Interfaces:**
- Produces:
  - Updated `messages` collection schema:
    - `media_type`: options `['text', 'image', 'audio', 'video', 'file']`
    - `attachment`: max size `52428800` (50MB), mimeTypes: `['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/webm', 'audio/mp4', 'audio/ogg', 'audio/aac', 'video/mp4', 'video/webm', 'video/quicktime', 'application/pdf', 'application/zip', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']`
    - `file_name`: text field (max 255)
    - `file_size`: number field (min 0)
    - `reply_to`: relation to `messages` (single select, cascadeDelete: false)
    - `is_pinned`: bool field
    - `pinned_at`: date field

- [ ] **Step 1: Write tests for the updated schema fields and rules**
Update `backend/tests/schema_rules.test.js` to assert that `messages` collection contains `video` and `file` in `media_type`, `reply_to` relation, `is_pinned`, and `file_name`.

- [ ] **Step 2: Run schema test to verify failure**
Run: `node backend/tests/schema_rules.test.js`
Expected: FAIL due to missing schema fields.

- [ ] **Step 3: Update `backend/setup_schema.js`**
Add the new fields to `messagesFields` in `backend/setup_schema.js` and update `updateRule` to allow editing `is_pinned` and `pinned_at` by authenticated users without modifying immutable message content.

- [ ] **Step 4: Execute schema migration against local / test PocketBase**
Run: `node -e "import('./backend/setup_schema.js').then(m => m.setupSchema())"`
Run: `node backend/tests/schema_rules.test.js`
Expected: PASS.

- [ ] **Step 5: Commit schema migration**
```bash
git add backend/
git commit -m "feat(backend): expand messages schema for video, file attachments, replies, and pinned state"
```

---

## Task 2: Generic File & Video Attachment Handling in Composer

**Files:**
- Create: `frontend/src/utils/fileHelpers.ts`
- Create: `frontend/src/utils/fileHelpers.test.ts`
- Modify: `frontend/src/components/MessageComposer.tsx`
- Modify: `frontend/src/components/MessageComposer.test.tsx`

**Interfaces:**
- Produces:
  - `formatBytes(bytes: number): string` (e.g. `1.2 MB`, `450 KB`)
  - `getFileCategory(file: File): 'image' | 'video' | 'file'`
  - `getFileIconName(fileName: string): string` (e.g. `picture_as_pdf`, `video_file`, `description`, `folder_zip`)
  - Updated `MessageComposer` supporting multi-attachment selection (Images, Videos up to 50MB, Documents up to 50MB) with upload progress and preview cards.

- [ ] **Step 1: Write tests for `fileHelpers.ts`**
Test `formatBytes`, `getFileCategory`, and `getFileIconName` for various MIME types and extensions.

- [ ] **Step 2: Implement `frontend/src/utils/fileHelpers.ts`**
Export utility functions with unit test coverage. Run `npm --prefix frontend test -- src/utils/fileHelpers.test.ts`.

- [ ] **Step 3: Add failing tests in `MessageComposer.test.tsx`**
Test selecting a video file (`test.mp4`) and a document file (`doc.pdf`), verifying attachment preview shows filename, icon, and size, and `formData` contains `media_type: 'video'` and `media_type: 'file'`.

- [ ] **Step 4: Implement attachment menu & handling in `MessageComposer.tsx`**
  - Add an attachment action menu or file input with expanded `accept="image/*,video/*,application/pdf,text/*,.zip,.doc,.docx"`.
  - Display attachment preview bar above textarea with file icon, name, formatted size, and remove button.
  - In `handleSend`, set `media_type`, `file_name`, and `file_size` appropriately.

- [ ] **Step 5: Verify tests and build**
Run: `npm --prefix frontend test -- src/components/MessageComposer.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add frontend/src/utils/fileHelpers.ts frontend/src/utils/fileHelpers.test.ts frontend/src/components/MessageComposer.tsx frontend/src/components/MessageComposer.test.tsx
git commit -m "feat(composer): support video and document uploads with file category previews"
```

---

## Task 3: Themed Document Card & Inline Video Player

**Files:**
- Create: `frontend/src/components/DocumentCard.tsx`
- Create: `frontend/src/components/DocumentCard.test.tsx`
- Create: `frontend/src/components/VideoPlayer.tsx`
- Create: `frontend/src/components/VideoPlayer.test.tsx`
- Modify: `frontend/src/components/MessageBubble.tsx`
- Modify: `frontend/src/components/MessageBubble.test.tsx`

**Interfaces:**
- Produces:
  - `<DocumentCard fileName={string} fileSize={number} fileUrl={string} isSelf={boolean} />`
  - `<VideoPlayer src={string} isSelf={boolean} poster?: string />`
  - `MessageBubble` rendering `DocumentCard` when `media_type === 'file'` and `VideoPlayer` when `media_type === 'video'`.

- [ ] **Step 1: Write tests for `DocumentCard.test.tsx`**
Test rendering file name, file size, download link, and theme styling (OLED vs TUI).

- [ ] **Step 2: Implement `DocumentCard.tsx`**
Sleek card with Material Symbol icon, file name, download icon button, and TUI `[ FILE: name ]` styling.

- [ ] **Step 3: Write tests for `VideoPlayer.test.tsx`**
Test rendering `<video>` element, custom play/pause button, progress bar, duration display, and fullscreen toggle.

- [ ] **Step 4: Implement `VideoPlayer.tsx`**
Custom themed video player with inline playback, progress scrubber, mute toggle, and full-screen button.

- [ ] **Step 5: Integrate into `MessageBubble.tsx`**
Wire `message.media_type === 'video'` to `<VideoPlayer>` and `message.media_type === 'file'` to `<DocumentCard>`. Update `MessageBubble.test.tsx`.

- [ ] **Step 6: Verify and commit**
Run: `npm --prefix frontend test -- src/components/DocumentCard.test.tsx src/components/VideoPlayer.test.tsx src/components/MessageBubble.test.tsx`
Expected: PASS.
```bash
git add frontend/src/components/DocumentCard* frontend/src/components/VideoPlayer* frontend/src/components/MessageBubble*
git commit -m "feat(chat): add themed document card and custom inline video player"
```

---

## Task 4: Message Reply & Quoting System

**Files:**
- Create: `frontend/src/components/ReplyPreviewBar.tsx`
- Create: `frontend/src/components/ReplyPreviewBar.test.tsx`
- Modify: `frontend/src/components/MessageComposer.tsx`
- Modify: `frontend/src/components/MessageBubble.tsx`
- Modify: `frontend/src/components/MessageThread.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces:
  - `replyingTo: Message | null` state managed in `App.tsx` / `MessageThread`.
  - Swipe right on mobile or click "reply" icon on desktop hover sets `replyingTo`.
  - `<ReplyPreviewBar message={replyingTo} onCancel={() => setReplyingTo(null)} />` displayed directly above `<textarea>`.
  - Quoted message header in `MessageBubble` displaying sender name and truncated text/attachment indicator, with `onClick` to scroll thread to referenced message ID.

- [ ] **Step 1: Write tests for `ReplyPreviewBar.test.tsx`**
Test rendering quoted sender, message snippet, and cancel button callback.

- [ ] **Step 2: Implement `ReplyPreviewBar.tsx`**
Compact themed banner above composer with accent border, icon `reply`, truncated preview, and close button.

- [ ] **Step 3: Add reply trigger to `MessageBubble.tsx`**
Add desktop hover action button `<button aria-label="Reply to message">` and touch swipe gesture (touchStart/touchMove with 40px right threshold) to invoke `onReply(message)`.

- [ ] **Step 4: Wire reply in `MessageComposer.tsx` & `App.tsx`**
Send `reply_to: replyingTo.id` in `formData`. Clear reply state upon sending.

- [ ] **Step 5: Add click-to-scroll to referenced message in `MessageThread.tsx`**
When clicking a quoted bubble header, find element with `id={`message-${replyToId}`}` inside `containerRef` and smoothly scroll container to its offset position, flashing a temporary highlight ring.

- [ ] **Step 6: Verify and commit**
Run: `npm --prefix frontend test -- src/components/ReplyPreviewBar.test.tsx src/components/MessageBubble.test.tsx`
Expected: PASS.
```bash
git add frontend/src/components/ReplyPreviewBar* frontend/src/components/Message* frontend/src/App.tsx
git commit -m "feat(chat): implement swipe-to-reply and quoted message navigation"
```

---

## Task 5: Full-Screen Media Lightbox & Shared Media Gallery

**Files:**
- Create: `frontend/src/components/MediaLightbox.tsx`
- Create: `frontend/src/components/MediaLightbox.test.tsx`
- Create: `frontend/src/components/SharedGalleryModal.tsx`
- Create: `frontend/src/components/SharedGalleryModal.test.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces:
  - `<MediaLightbox isOpen={boolean} onClose={() => void} mediaUrl={string} mediaType={'image'|'video'} caption?: string />`: Fullscreen modal with zoom, pan, download button, and keyboard escape.
  - `<SharedGalleryModal isOpen={boolean} onClose={() => void} messages={Message[]} onSelectMedia={(msg) => void} />`: Categorized 3-tab modal (`Photos`, `Videos`, `Files`) displaying all shared media in chronological grid.
  - Header button `<Icon name="photo_library" />` to open Shared Media Gallery.

- [ ] **Step 1: Write tests for `MediaLightbox.test.tsx`**
Test image/video display, download link, zoom button, and close callback.

- [ ] **Step 2: Implement `MediaLightbox.tsx`**
High-performance backdrop-blurred modal supporting image zoom/drag and video playback with download action.

- [ ] **Step 3: Write tests for `SharedGalleryModal.test.tsx`**
Test rendering media thumbnails categorized into Photos, Videos, and Files tabs.

- [ ] **Step 4: Implement `SharedGalleryModal.tsx`**
Grid browser filtering `messages.filter(m => m.attachment)` into Photos, Videos, and Files tabs with dates and quick-preview triggers.

- [ ] **Step 5: Wire into `Header.tsx` and `App.tsx`**
Add "Shared Media" gallery icon to header actions; clicking any photo or video opens `MediaLightbox`.

- [ ] **Step 6: Verify and commit**
Run: `npm --prefix frontend test -- src/components/MediaLightbox.test.tsx src/components/SharedGalleryModal.test.tsx`
Expected: PASS.
```bash
git add frontend/src/components/MediaLightbox* frontend/src/components/SharedGalleryModal* frontend/src/components/Header* frontend/src/App.tsx
git commit -m "feat(media): add full-screen media lightbox and shared gallery modal"
```

---

## Task 6: In-Chat Keyword Search

**Files:**
- Create: `frontend/src/components/SearchOverlay.tsx`
- Create: `frontend/src/components/SearchOverlay.test.tsx`
- Modify: `frontend/src/components/Header.tsx`
- Modify: `frontend/src/components/MessageThread.tsx`
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Produces:
  - Search toggle in Header `<Icon name="search" />`.
  - Search bar input with debounced query and match count (`3 of 12 matches`).
  - Next/Previous navigation buttons (`keyboard_arrow_up`, `keyboard_arrow_down`).
  - Active search term highlighting inside message bubble text.
  - Auto-scrolling the message thread container to the selected match.

- [ ] **Step 1: Write tests for `SearchOverlay.test.tsx`**
Test typing search query, match count display, navigating next/prev matches, and clear/close buttons.

- [ ] **Step 2: Implement `SearchOverlay.tsx`**
Compact slide-down bar under header with input, match indicator (`1/4`), up/down arrows, and close button.

- [ ] **Step 3: Add search term highlighting to `MessageBubble.tsx`**
Add `searchQuery?: string` prop to `MessageBubble`; highlight matched substrings with `<mark className="bg-amber-400/40 text-inherit rounded-xs px-0.5">` (or `#00ff41` inverted in TUI).

- [ ] **Step 4: Wire search navigation in `MessageThread.tsx`**
When active match index changes, scroll `containerRef` to the target message element and flash a subtle pulse animation.

- [ ] **Step 5: Verify and commit**
Run: `npm --prefix frontend test -- src/components/SearchOverlay.test.tsx`
Expected: PASS.
```bash
git add frontend/src/components/SearchOverlay* frontend/src/components/Header* frontend/src/components/Message* frontend/src/App.tsx
git commit -m "feat(search): in-chat keyword search with match navigation and text highlighting"
```

---

## Task 7: Pinned Messages Banner & Management

**Files:**
- Create: `frontend/src/components/PinnedBanner.tsx`
- Create: `frontend/src/components/PinnedBanner.test.tsx`
- Modify: `frontend/src/components/MessageBubble.tsx`
- Modify: `frontend/src/components/App.tsx`

**Interfaces:**
- Produces:
  - Message bubble action menu option: "Pin message" / "Unpin message" (`<Icon name="keep" />`).
  - Updates PocketBase `messages` record `is_pinned: true, pinned_at: serverTime`.
  - Realtime subscription updates `pinnedMessages` list.
  - `<PinnedBanner pinnedMessages={pinnedMessages} onSelect={(msg) => scrollToMsg(msg.id)} onUnpin={(msg) => unpin(msg.id)} />` rendered directly below `<Header />`.

- [ ] **Step 1: Write tests for `PinnedBanner.test.tsx`**
Test rendering latest pinned message, badge count, expand/collapse list, and unpin action.

- [ ] **Step 2: Implement `PinnedBanner.tsx`**
Sleek collapsible banner pinned under header showing pin icon, latest pinned snippet, and click-to-jump.

- [ ] **Step 3: Add pin/unpin action to `MessageBubble.tsx`**
Allow users to toggle pin status from bubble hover menu or long-press.

- [ ] **Step 4: Wire PocketBase updates in `App.tsx`**
Handle `handleTogglePin(messageId, currentPinnedState)` calling `pb.collection('messages').update(id, { is_pinned: !isPinned, pinned_at: ... })`.

- [ ] **Step 5: Verify and commit**
Run: `npm --prefix frontend test -- src/components/PinnedBanner.test.tsx`
Expected: PASS.
```bash
git add frontend/src/components/PinnedBanner* frontend/src/components/MessageBubble* frontend/src/App.tsx
git commit -m "feat(pins): add pinned messages banner and pin/unpin management"
```

---

## Task 8: Full Test Suite, Build Verification & Live Deployment

**Files:**
- Full repository test and build suite.

- [ ] **Step 1: Run comprehensive automated test suite**
Run: `npm --prefix frontend test -- --run`
Expected: All test suites PASS (0 failures).

- [ ] **Step 2: Run production TypeScript and Vite build**
Run: `npm --prefix frontend run build`
Expected: Exit code 0, clean output in `dist/`.

- [ ] **Step 3: Deploy to VPS `nei`**
Sync built assets to `/opt/couple-chat/pb_public/` and run `setup_schema.js` on VPS.

- [ ] **Step 4: Present Interactive User GUI Verification Protocol**
Request the user to perform the manual GUI testing checklist on their mobile and desktop devices.

---

## User Manual GUI Testing Protocol (To Request at Finish)

```markdown
### 📱 User GUI Verification Checklist
Please verify the following features on mobile and desktop:

1. **Document & Video Attachments**:
   - [ ] Tap the attachment icon in the composer.
   - [ ] Send a PDF or text file. Verify it renders as a DocumentCard with file size and downloads properly.
   - [ ] Send an MP4 video. Verify it plays smoothly inline with the custom video controls.

2. **Swipe & Click Replies**:
   - [ ] On mobile, swipe right on any message bubble. Verify the reply preview bar pops up above the keyboard.
   - [ ] Send the reply. Verify the quoted snippet appears above the bubble and clicking it smoothly scrolls back to the original message.

3. **Media Lightbox & Shared Gallery**:
   - [ ] Tap on any photo or video in the chat. Verify the full-screen lightbox opens with zoom and download.
   - [ ] Tap the photo library icon in the header. Verify all past photos, videos, and files appear in their respective tabs.

4. **In-Chat Search**:
   - [ ] Tap the search icon in the header. Type a word from an earlier conversation.
   - [ ] Use the up/down arrows to jump between matching messages. Verify the matched word is highlighted.

5. **Pinned Messages**:
   - [ ] Pin a message. Verify the pinned banner appears below the header.
   - [ ] Tap the banner to jump to the pinned message. Unpin and verify the banner dismisses.

6. **Theme Cohesion**:
   - [ ] Switch to **Terminal TUI**: Verify all cards (video, doc, replies, pins, gallery) switch to ASCII brackets and green phosphor borders.
   - [ ] Switch to **Daylight**: Verify clean paper styling and crisp slate typography.
```
