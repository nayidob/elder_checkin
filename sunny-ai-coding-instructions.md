# Sunny Check-In: AI Coding Agent Build Instructions

## Project Overview

You are building **Sunny**, a mobile-first video chat webapp for elderly wellness check-ins. Think **FaceTime meets AI companion** — a full-screen video call experience with a friendly AI avatar.

### Core Experience
- Mobile-first responsive design (works on phones primarily)
- Full-screen video call interface (like FaceTime/WhatsApp video call)
- AI avatar with lip-sync (Anam) + voice conversation (ElevenLabs)
- Family dashboard to monitor wellness and receive alerts

### Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **Auth:** Clerk
- **Database:** Supabase
- **AI Avatar:** Anam SDK
- **Voice AI:** ElevenLabs Conversational AI
- **Payments:** Stripe
- **Alerts:** n8n webhooks
- **Deploy:** Vercel

---

## Recommended Starter Template

Start with a clean Next.js template optimized for mobile:

```bash
npx create-next-app@latest sunny-checkin --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

Then install dependencies:

```bash
npm install @clerk/nextjs @supabase/supabase-js @anam-ai/js-sdk stripe @stripe/stripe-js
```

---

## Phase 1: Project Foundation

### 1.1 Environment Setup

**Create `.env.local` with these variables:**

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# Anam
ANAM_API_KEY=
ANAM_AVATAR_ID=

# ElevenLabs
ELEVENLABS_AGENT_ID=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=

# n8n
NEXT_PUBLIC_N8N_WEBHOOK_URL=
```

### 1.2 Project Structure

**Generate this folder structure:**

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx              # Root layout with Clerk + mobile viewport
│   ├── page.tsx                # Landing page
│   ├── dashboard/
│   │   └── page.tsx            # Family dashboard
│   ├── register/
│   │   └── page.tsx            # Register elder form
│   ├── call/
│   │   └── page.tsx            # VIDEO CALL PAGE (main experience)
│   ├── alerts/
│   │   └── page.tsx            # Alert history
│   ├── pricing/
│   │   └── page.tsx            # Subscription plans
│   └── api/
│       ├── anam-session/
│       │   └── route.ts        # Create Anam session token
│       ├── analyze/
│       │   └── route.ts        # Analyze conversation for alerts
│       ├── stripe/
│       │   └── route.ts        # Create checkout session
│       └── webhooks/
│           └── stripe/
│               └── route.ts    # Handle Stripe webhooks
├── components/
│   ├── MobileNav.tsx           # Bottom navigation for mobile
│   ├── VideoCall.tsx           # MAIN: Full-screen FaceTime-style call UI
│   ├── CallControls.tsx        # End call, mute buttons (floating)
│   ├── LiveTranscript.tsx      # Overlay showing conversation
│   ├── WellnessScore.tsx       # Score badge component
│   └── ElderCard.tsx           # Elder profile card
├── lib/
│   ├── supabase.ts             # Supabase client + types
│   ├── elevenlabs.ts           # ElevenLabs connection helper
│   └── stripe.ts               # Stripe client
└── middleware.ts               # Clerk auth middleware
```

### 1.3 Mobile-First Configuration

**Update `globals.css` for mobile video call experience:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Prevent overscroll/bounce on iOS */
html, body {
  overscroll-behavior: none;
  -webkit-overflow-scrolling: touch;
}

/* Full-height mobile viewport */
.h-screen-mobile {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height for mobile browsers */
}

/* Video call specific */
.video-container {
  position: fixed;
  inset: 0;
  background: #000;
}

/* Safe area for notched phones */
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}

.safe-area-top {
  padding-top: env(safe-area-inset-top, 20px);
}
```

**Update `layout.tsx` with mobile viewport:**

```typescript
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sunny | Daily Check-In Companion',
  description: 'AI companion for elderly wellness check-ins',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sunny',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-gray-50 antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
```

---

## Phase 2: Database Schema

**Run this SQL in Supabase SQL Editor:**

```sql
-- Elders (the elderly person being checked on)
CREATE TABLE elders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  interests TEXT,
  medical_notes TEXT,
  family_name TEXT NOT NULL,
  family_email TEXT NOT NULL,
  emergency_phone TEXT,
  avatar_emoji TEXT DEFAULT '👵',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check-in call logs
CREATE TABLE checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID REFERENCES elders(id) ON DELETE CASCADE,
  wellness_score INTEGER CHECK (wellness_score >= 1 AND wellness_score <= 10),
  summary TEXT,
  transcript JSONB DEFAULT '[]',
  alerts JSONB DEFAULT '[]',
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert notifications
CREATE TABLE alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  elder_id UUID REFERENCES elders(id) ON DELETE CASCADE,
  checkin_id UUID REFERENCES checkins(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('health', 'confusion', 'mood', 'emergency')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stripe subscriptions
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium')),
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_elders_user_id ON elders(user_id);
CREATE INDEX idx_checkins_elder_id ON checkins(elder_id);
CREATE INDEX idx_checkins_created_at ON checkins(created_at DESC);
CREATE INDEX idx_alerts_elder_id ON alerts(elder_id);
CREATE INDEX idx_alerts_acknowledged ON alerts(acknowledged) WHERE acknowledged = FALSE;

-- Enable Row Level Security
ALTER TABLE elders ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies (permissive for hackathon - tighten for production)
CREATE POLICY "Allow all operations" ON elders FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON checkins FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON alerts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON subscriptions FOR ALL USING (true);
```

---

## Phase 3: Core Video Call Experience

**This is the MAIN feature. The call page should feel like FaceTime.**

### 3.1 Design Requirements for Video Call Page (`/call`)

```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │                                 │ │
│ │                                 │ │
│ │      FULL SCREEN AVATAR         │ │
│ │         (Anam Video)            │ │
│ │                                 │ │
│ │    Lip-syncs to ElevenLabs      │ │
│ │                                 │ │
│ │                                 │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 💬 Live transcript overlay      │ │
│ │ (last 2-3 messages, subtle)     │ │
│ └─────────────────────────────────┘ │
│                                     │
│         ┌───────────────┐           │
│         │  🔴 End Call  │           │
│         └───────────────┘           │
│              (floating)             │
└─────────────────────────────────────┘
```

### 3.2 VideoCall Component Specification

**File: `components/VideoCall.tsx`**

**Requirements:**
1. Full-screen video element for Anam avatar
2. Connects to ElevenLabs Conversational AI via WebSocket
3. Captures user microphone and sends audio to ElevenLabs
4. Receives audio from ElevenLabs and forwards to Anam for lip-sync
5. Displays live transcript as subtle overlay
6. Floating end call button with safe-area padding
7. Status indicators (connecting, listening, speaking)
8. Handles interruptions (barge-in)

**Key Implementation Notes:**

```typescript
// Anam setup - CRITICAL: disable input audio since ElevenLabs handles mic
const anamClient = createClient(sessionToken, {
  disableInputAudio: true,  // ElevenLabs handles microphone
})

// Stream avatar to video element
await anamClient.streamToVideoElement(videoRef.current)

// Create audio input stream for lip-sync
const audioInputStream = anamClient.createAgentAudioInputStream({
  encoding: 'pcm_s16le',
  sampleRate: 16000,
  channels: 1,
})

// When ElevenLabs sends audio, forward to Anam
onAudio: (base64Audio) => {
  audioInputStream.sendAudioChunk(base64Audio)
}

// When agent finishes speaking
onAgentResponse: () => {
  audioInputStream.endSequence()
}

// When user interrupts
onInterrupt: () => {
  audioInputStream.endSequence()
}
```

### 3.3 ElevenLabs Connection Helper

**File: `lib/elevenlabs.ts`**

**Must implement:**
1. `MicrophoneCapture` class - captures mic at 16kHz PCM
2. `arrayBufferToBase64` utility function
3. `connectElevenLabs` function with callbacks:
   - `onReady`: Connection established
   - `onAudio`: Receive audio chunk (base64)
   - `onUserTranscript`: User speech transcribed
   - `onAgentResponse`: Agent finished speaking
   - `onInterrupt`: User interrupted agent
   - `onError`: Handle errors
   - `onDisconnect`: Cleanup

**WebSocket connection:**
```typescript
const ws = new WebSocket(
  `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${agentId}`
)
```

**Handle ping/pong for keepalive:**
```typescript
if (msg.type === 'ping') {
  ws.send(JSON.stringify({ type: 'pong', event_id: msg.ping_event.event_id }))
}
```

### 3.4 Call States to Handle

```typescript
type CallState = 
  | 'idle'        // Not started
  | 'connecting'  // Setting up Anam + ElevenLabs
  | 'ready'       // Connected, waiting for conversation
  | 'listening'   // User is speaking
  | 'speaking'    // Avatar is speaking
  | 'ended'       // Call finished, show results
```

### 3.5 Pre-Call Screen Design (Mobile)

Before call starts, show:
```
┌─────────────────────────────────────┐
│                                     │
│              👵                     │
│        (Elder's emoji)              │
│                                     │
│     Ready to check in on            │
│     Grandma Maggie?                 │
│                                     │
│    Sunny will have a friendly       │
│    video chat and let you know      │
│    how she's doing.                 │
│                                     │
│      ┌─────────────────────┐        │
│      │  📞 Start Call      │        │
│      │  (big green button) │        │
│      └─────────────────────┘        │
│                                     │
└─────────────────────────────────────┘
```

### 3.6 Post-Call Results Screen (Mobile)

After call ends, show:
```
┌─────────────────────────────────────┐
│                                     │
│        ✅ Check-in Complete         │
│                                     │
│             8/10                    │
│        (big wellness score)         │
│                                     │
│   ┌───────────────────────────┐     │
│   │ ⚠️ Mentioned back pain    │     │
│   │ (alert if any)            │     │
│   └───────────────────────────┘     │
│                                     │
│   Duration: 3 minutes               │
│                                     │
│   ┌─────────────┐ ┌─────────────┐   │
│   │  Dashboard  │ │  Call Again │   │
│   └─────────────┘ └─────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

## Phase 4: API Routes

### 4.1 Anam Session API

**File: `app/api/anam-session/route.ts`**

```typescript
// POST /api/anam-session
// Returns: { anamSessionToken, elevenLabsAgentId }

// Must:
// 1. Verify user is authenticated (Clerk)
// 2. Call Anam API to create session token
// 3. CRITICAL: Set enableAudioPassthrough: true
// 4. Return session token + ElevenLabs agent ID
```

### 4.2 Conversation Analysis API

**File: `app/api/analyze/route.ts`**

```typescript
// POST /api/analyze
// Body: { transcript: Array<{role, content}>, elderId }
// Returns: { wellnessScore, alerts, summary }

// Analyze conversation for:
// - HEALTH: pain, falls, dizziness, medication issues
// - CONFUSION: disorientation, memory problems
// - MOOD: loneliness, sadness, hopelessness
// - EMERGENCY: urgent situations

// Simple keyword detection for hackathon:
const patterns = {
  health: /fell|fall|hurt|pain|ache|dizzy|medication|medicine|doctor/i,
  confusion: /confused|forget|forgot|lost|don't remember|what day/i,
  mood: /lonely|alone|sad|miss|nobody|depressed/i,
  emergency: /help|emergency|can't breathe|chest pain|911/i,
}
```

### 4.3 Stripe Checkout API

**File: `app/api/stripe/route.ts`**

```typescript
// POST /api/stripe
// Returns: { url } - Stripe Checkout URL

// Create subscription checkout session
// Include userId in metadata for webhook
```

### 4.4 Stripe Webhook

**File: `app/api/webhooks/stripe/route.ts`**

```typescript
// POST /api/webhooks/stripe
// Handle: checkout.session.completed, customer.subscription.deleted

// On checkout complete: Update subscriptions table
// On subscription deleted: Downgrade to free
```

---

## Phase 5: Mobile Navigation

### 5.1 Bottom Navigation Bar

**File: `components/MobileNav.tsx`**

Design for mobile (fixed bottom, safe-area aware):

```
┌─────────────────────────────────────┐
│  🏠        📞        🔔        ⚙️   │
│ Home     Call     Alerts   Settings │
└─────────────────────────────────────┘
```

Only show on dashboard pages, NOT during video call.

### 5.2 Page Layouts

**Dashboard pages** (with nav):
- `/dashboard` - Elder card, stats, recent check-ins
- `/alerts` - Alert history list
- `/pricing` - Subscription plans

**Full-screen pages** (NO nav):
- `/call` - Video call experience
- `/register` - Elder registration form

---

## Phase 6: Mobile-Optimized Pages

### 6.1 Dashboard Page (`/dashboard`)

**Mobile-first design:**
```
┌─────────────────────────────────────┐
│ ☀️ Sunny                    [avatar]│
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ 👵 Grandma Maggie              │ │
│ │ Last check-in: 2 hours ago     │ │
│ │ Wellness: 8/10 💚              │ │
│ │                    [Call Now]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │   12    │ │   8/10  │ │    2    │ │
│ │Check-ins│ │ Avg.    │ │ Alerts  │ │
│ └─────────┘ └─────────┘ └─────────┘ │
│                                     │
│ Recent Activity                     │
│ ├─ Today 2:30 PM - Score: 8/10     │
│ ├─ Yesterday - Score: 7/10 ⚠️      │
│ └─ Dec 9 - Score: 9/10             │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  🏠    📞    🔔    ⚙️          │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 6.2 Register Elder Page (`/register`)

**Simple mobile form:**
- Large touch targets (min 44px)
- Single column layout
- Emoji picker for avatar
- Auto-focus first field
- Sticky submit button at bottom

### 6.3 Alerts Page (`/alerts`)

**Card-based alert list:**
- Color-coded by severity
- Swipe to acknowledge (optional)
- Pull to refresh (optional)
- Empty state when no alerts

---

## Phase 7: Polish & Optimization

### 7.1 Loading States

Show smooth loading states:
- Skeleton screens for dashboard
- Pulsing animation while connecting call
- Progress indicator for form submission

### 7.2 Error Handling

Handle gracefully:
- Microphone permission denied
- Network disconnection during call
- API failures
- Invalid session tokens

### 7.3 PWA Configuration (Optional)

**Create `public/manifest.json`:**
```json
{
  "name": "Sunny Check-In",
  "short_name": "Sunny",
  "description": "AI companion for elderly wellness",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#FFF7ED",
  "theme_color": "#F59E0B",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## Component Generation Prompts for Cursor

Use these prompts in Cursor to generate each component:

### Prompt 1: Supabase Client
```
Create a Supabase client helper in lib/supabase.ts with:
- Supabase client initialization using environment variables
- TypeScript interfaces for: Elder, CheckIn, Alert, Subscription
- Export both client and types
```

### Prompt 2: ElevenLabs Helper
```
Create lib/elevenlabs.ts with:
- MicrophoneCapture class that captures audio at 16kHz PCM16
- arrayBufferToBase64 utility function
- connectElevenLabs async function that:
  - Connects to ElevenLabs Conversational AI WebSocket
  - Handles message types: audio, agent_response, user_transcript, interruption, ping
  - Sends microphone audio as user_audio_chunk
  - Returns { ws, mic } for cleanup
- ElevenLabsCallbacks interface with: onReady, onAudio, onUserTranscript, onAgentResponse, onInterrupt, onError, onDisconnect
```

### Prompt 3: Video Call Component
```
Create components/VideoCall.tsx - a full-screen FaceTime-style video call component:
- Props: elder (name, nickname), onCallEnd callback
- Uses Anam SDK for avatar with disableInputAudio: true
- Uses ElevenLabs helper for conversation
- Full-screen video element (object-cover)
- Status indicator showing: connecting, listening, speaking
- Live transcript overlay (last 3 messages, semi-transparent)
- Floating red "End Call" button with safe-area padding
- Tracks conversation transcript for analysis
- On end: calls API to analyze conversation and save to database
- Mobile-optimized with 100dvh height
```

### Prompt 4: Call Page
```
Create app/call/page.tsx - the main video call experience:
- Three states: ready (pre-call), active (calling), ended (results)
- Pre-call: Show elder info, big green "Start Call" button
- Active: Render VideoCall component full-screen
- Ended: Show wellness score, alerts if any, navigation buttons
- Load elder data from Supabase on mount
- Redirect to /register if no elder
- Save check-in results to database
- Trigger n8n webhook if alerts detected
- No header or navigation during call (immersive)
```

### Prompt 5: Dashboard Page
```
Create app/dashboard/page.tsx - mobile-first family dashboard:
- Show elder card with avatar, name, last check-in
- Stats row: total check-ins, average score, active alerts
- Recent check-ins list with scores
- Alert banner if unacknowledged alerts exist
- Big "Start Check-In" button
- Include MobileNav at bottom
- Load data from Supabase
- Handle empty state (no elder registered)
```

### Prompt 6: Mobile Navigation
```
Create components/MobileNav.tsx - fixed bottom navigation:
- Four items: Dashboard (home), Call (phone), Alerts (bell), Settings (gear)
- Highlight active route
- Fixed position with safe-area-inset-bottom padding
- 60px height, white background with subtle shadow
- Use Next.js Link for navigation
- Icons from emoji or simple SVG
```

### Prompt 7: Register Page
```
Create app/register/page.tsx - elder registration form:
- Mobile-optimized single column form
- Emoji avatar picker (5 options)
- Fields: name, nickname, interests (textarea), medical notes, family name, family email
- Large touch targets, rounded inputs
- Sticky submit button at bottom
- Save to Supabase on submit
- Redirect to dashboard on success
- Show loading state during submission
```

### Prompt 8: API Routes
```
Create these API routes:

1. app/api/anam-session/route.ts:
- POST handler
- Verify Clerk auth
- Call Anam API to create session with enableAudioPassthrough: true
- Return { anamSessionToken, elevenLabsAgentId }

2. app/api/analyze/route.ts:
- POST handler
- Accept { transcript, elderId }
- Analyze for health/confusion/mood/emergency keywords
- Calculate wellness score (1-10)
- Return { wellnessScore, alerts, summary }

3. app/api/stripe/route.ts:
- POST handler
- Create Stripe checkout session for subscription
- Return { url }
```

---

## Final Checklist for AI Agent

Before considering the build complete, verify:

- [ ] Video call works full-screen on mobile
- [ ] Avatar lip-syncs to ElevenLabs audio
- [ ] Microphone captures and sends to ElevenLabs
- [ ] Transcript displays in real-time
- [ ] Call can be ended cleanly
- [ ] Wellness score calculated after call
- [ ] Alerts saved to database
- [ ] n8n webhook triggered on alerts
- [ ] Dashboard shows check-in history
- [ ] Elder registration works
- [ ] Mobile navigation works
- [ ] All pages are responsive
- [ ] Clerk auth protects routes
- [ ] Stripe checkout works

---

## Key Technical Notes

### Anam + ElevenLabs Integration
```
ElevenLabs (voice) ──audio──▶ Anam (avatar lip-sync)
       ▲                              │
       │                              │
       └──── microphone ◀─────────────┘
             (user speaks)
```

### Audio Format (CRITICAL)
- Sample rate: **16000 Hz**
- Encoding: **PCM 16-bit signed little-endian**
- Channels: **Mono (1)**

Mismatch = broken lip-sync!

### Mobile Viewport
Always use `100dvh` instead of `100vh` for true full-screen on mobile browsers (accounts for browser chrome).

---

## Success Criteria

The app is complete when:
1. Family member can register an elderly relative
2. Video call shows animated avatar that speaks and lip-syncs
3. Natural conversation flows back and forth
4. Concerning keywords trigger alerts
5. Family sees wellness scores and alert history
6. Experience feels like a warm, friendly video call

**Remember: This should feel like calling a caring friend, not using an app.**
