# WhatsApp Gateway Admin Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an administrative WhatsApp Gateway settings menu in SDM Handal with a background NestJS Puppeteer client using `whatsapp-web.js`, supporting QR code pairing, live status monitoring, session reset, and test messaging.

**Architecture:** NestJS (`website/backend`) hosts `WhatsappGatewayService` using `whatsapp-web.js` with `LocalAuth` and exposes REST endpoints via `WhatsappGatewayController`. SDM (`sdm`) provides an API proxy route and an admin settings page with live polling (3s interval) to display QR codes, connection status, device info, and a test message dispatch form.

**Tech Stack:** Next.js 15 (App Router), NestJS 11 (Fastify), `whatsapp-web.js`, `qrcode`, Tailwind CSS, Lucide React, Sonner toasts.

## Global Constraints
- Target workspaces: `/Users/hardiko/Documents/Developer/NEXT/website/backend` and `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Session scope: Single session (`sdm-official`) stored in `./.wwebjs_auth`
- Polling interval: 3 seconds during `SCAN_QR` / `INITIALIZING` states
- Phone number normalization: Indonesian formats (`08xxx`, `+62xxx`) normalized to `62xxx@c.us`
- Protection: Protected by `JwtAuthGuard` in NestJS and `getUser()` in SDM proxy

---

### Task 1: Install Dependencies & Implement WhatsappGatewayService in NestJS Backend

**Files:**
- Modify: `package.json` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Create: `src/web/whatsapp/whatsapp-gateway.service.ts` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Create: `src/web/whatsapp/whatsapp-gateway.service.spec.ts` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`

**Interfaces:**
- Consumes: `whatsapp-web.js`, `qrcode`
- Produces: `WhatsappGatewayService` with:
  - `getStatus(): { state: string; qrCodeDataUrl: string | null; phone: string | null; pushname: string | null; updatedAt: Date }`
  - `initializeClient(): Promise<void>`
  - `logoutClient(): Promise<void>`
  - `sendTextMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string }>`
  - `formatPhoneNumber(phone: string): string`

- [ ] **Step 1: Install `whatsapp-web.js`, `qrcode`, and `@types/qrcode`**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npm install whatsapp-web.js qrcode && npm install -D @types/qrcode
```

- [ ] **Step 2: Write failing unit test for `WhatsappGatewayService`**
Create `src/web/whatsapp/whatsapp-gateway.service.spec.ts`:
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappGatewayService } from './whatsapp-gateway.service';

describe('WhatsappGatewayService', () => {
  let service: WhatsappGatewayService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsappGatewayService],
    }).compile();

    service = module.get<WhatsappGatewayService>(WhatsappGatewayService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should normalize phone numbers to @c.us format', () => {
    expect(service.formatPhoneNumber('08123456789')).toBe('628123456789@c.us');
    expect(service.formatPhoneNumber('+628123456789')).toBe('628123456789@c.us');
    expect(service.formatPhoneNumber('628123456789')).toBe('628123456789@c.us');
  });

  it('should initialize with DISCONNECTED state', () => {
    const status = service.getStatus();
    expect(status.state).toBe('DISCONNECTED');
    expect(status.qrCodeDataUrl).toBeNull();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npx jest src/web/whatsapp/whatsapp-gateway.service.spec.ts
```
Expected: FAIL (Cannot find module `./whatsapp-gateway.service`)

- [ ] **Step 4: Implement `WhatsappGatewayService`**
Create `src/web/whatsapp/whatsapp-gateway.service.ts`:
```typescript
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Client, LocalAuth } from 'whatsapp-web.js';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

export type GatewayState =
  | 'DISCONNECTED'
  | 'INITIALIZING'
  | 'SCAN_QR'
  | 'AUTHENTICATING'
  | 'READY';

@Injectable()
export class WhatsappGatewayService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappGatewayService.name);
  private client: Client | null = null;
  private state: GatewayState = 'DISCONNECTED';
  private qrCodeDataUrl: string | null = null;
  private phone: string | null = null;
  private pushname: string | null = null;
  private updatedAt: Date = new Date();
  private isInitializing = false;

  private readonly authPath = path.resolve('./.wwebjs_auth');
  private readonly clientId = 'sdm-official';

  getStatus() {
    return {
      state: this.state,
      qrCodeDataUrl: this.qrCodeDataUrl,
      phone: this.phone,
      pushname: this.pushname,
      updatedAt: this.updatedAt,
    };
  }

  formatPhoneNumber(phone: string): string {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    } else if (!clean.startsWith('62')) {
      clean = '62' + clean;
    }
    return `${clean}@c.us`;
  }

  async initializeClient(): Promise<void> {
    if (this.state === 'READY' || this.isInitializing) {
      this.logger.warn('Client already initialized or currently initializing');
      return;
    }

    this.isInitializing = true;
    this.state = 'INITIALIZING';
    this.qrCodeDataUrl = null;
    this.updatedAt = new Date();

    try {
      if (this.client) {
        await this.client.destroy().catch(() => {});
        this.client = null;
      }

      this.client = new Client({
        authStrategy: new LocalAuth({
          dataPath: this.authPath,
          clientId: this.clientId,
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
          ],
        },
      });

      this.client.on('qr', async (qr) => {
        this.logger.log('WhatsApp QR received, converting to Data URL...');
        this.state = 'SCAN_QR';
        this.qrCodeDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 6 });
        this.updatedAt = new Date();
      });

      this.client.on('authenticated', () => {
        this.logger.log('WhatsApp authenticated');
        this.state = 'AUTHENTICATING';
        this.qrCodeDataUrl = null;
        this.updatedAt = new Date();
      });

      this.client.on('ready', async () => {
        this.logger.log('WhatsApp client ready');
        this.state = 'READY';
        this.qrCodeDataUrl = null;
        const info = this.client?.info;
        this.phone = info?.wid?.user || null;
        this.pushname = info?.pushname || null;
        this.updatedAt = new Date();
        this.isInitializing = false;
      });

      this.client.on('auth_failure', (msg) => {
        this.logger.error(`WhatsApp auth failure: ${msg}`);
        this.state = 'DISCONNECTED';
        this.isInitializing = false;
        this.updatedAt = new Date();
      });

      this.client.on('disconnected', (reason) => {
        this.logger.warn(`WhatsApp client disconnected: ${reason}`);
        this.state = 'DISCONNECTED';
        this.phone = null;
        this.pushname = null;
        this.qrCodeDataUrl = null;
        this.isInitializing = false;
        this.updatedAt = new Date();
      });

      await this.client.initialize();
    } catch (error) {
      this.logger.error('Failed to initialize WhatsApp client', error);
      this.state = 'DISCONNECTED';
      this.isInitializing = false;
      this.updatedAt = new Date();
      throw error;
    }
  }

  async logoutClient(): Promise<void> {
    this.logger.log('Logging out WhatsApp client...');
    try {
      if (this.client) {
        await this.client.logout().catch(() => {});
        await this.client.destroy().catch(() => {});
        this.client = null;
      }
    } catch (err) {
      this.logger.error('Error during client logout', err);
    } finally {
      this.state = 'DISCONNECTED';
      this.phone = null;
      this.pushname = null;
      this.qrCodeDataUrl = null;
      this.isInitializing = false;
      this.updatedAt = new Date();

      const sessionFolder = path.join(this.authPath, `session-${this.clientId}`);
      if (fs.existsSync(sessionFolder)) {
        fs.rmSync(sessionFolder, { recursive: true, force: true });
        this.logger.log(`Deleted session directory: ${sessionFolder}`);
      }
    }
  }

  async sendTextMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string }> {
    if (this.state !== 'READY' || !this.client) {
      throw new Error('WhatsApp client is not ready. Please scan QR and connect first.');
    }

    const recipientJid = this.formatPhoneNumber(to);
    const sent = await this.client.sendMessage(recipientJid, message);
    return {
      success: true,
      messageId: sent.id?._serialized,
    };
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.destroy().catch(() => {});
    }
  }
}
```

- [ ] **Step 5: Run unit tests to verify they pass**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npx jest src/web/whatsapp/whatsapp-gateway.service.spec.ts
```
Expected: PASS

- [ ] **Step 6: Commit**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && git add package.json package-lock.json src/web/whatsapp/whatsapp-gateway.service.ts src/web/whatsapp/whatsapp-gateway.service.spec.ts && git commit -m "feat(whatsapp): implement WhatsappGatewayService with whatsapp-web.js"
```

---

### Task 2: Implement Controller and Register in WhatsappModule

**Files:**
- Create: `src/web/whatsapp/whatsapp-gateway.controller.ts` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Create: `src/web/whatsapp/dto/send-test-message.dto.ts` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`
- Modify: `src/web/whatsapp/whatsapp.module.ts` in `/Users/hardiko/Documents/Developer/NEXT/website/backend`

**Interfaces:**
- Consumes: `WhatsappGatewayService`, `JwtAuthGuard`
- Produces: REST endpoints under `/web/whatsapp-gateway`:
  - `GET /status`
  - `POST /initialize`
  - `POST /logout`
  - `POST /send-test`

- [ ] **Step 1: Create DTO `src/web/whatsapp/dto/send-test-message.dto.ts`**
```typescript
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTestMessageDto {
  @ApiProperty({ description: 'Target phone number', example: '08123456789' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9+]{9,16}$/, { message: 'Nomor telepon tidak valid' })
  phone: string;

  @ApiProperty({ description: 'Message content', example: 'Halo, ini pesan uji coba WhatsApp Gateway.' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
```

- [ ] **Step 2: Create `WhatsappGatewayController`**
Create `src/web/whatsapp/whatsapp-gateway.controller.ts`:
```typescript
import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WhatsappGatewayService } from './whatsapp-gateway.service';
import { SendTestMessageDto } from './dto/send-test-message.dto';

@ApiTags('WhatsApp Gateway')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('web/whatsapp-gateway')
export class WhatsappGatewayController {
  constructor(private readonly gatewayService: WhatsappGatewayService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get WhatsApp gateway connection status and QR code' })
  getStatus() {
    return {
      status: 'success',
      data: this.gatewayService.getStatus(),
    };
  }

  @Post('initialize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize WhatsApp client and trigger QR code generation' })
  async initialize() {
    // Non-blocking initialization so HTTP response returns immediately
    this.gatewayService.initializeClient().catch(() => {});
    return {
      status: 'success',
      message: 'Inisialisasi WhatsApp client sedang diproses...',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout active WhatsApp session and clear auth data' })
  async logout() {
    await this.gatewayService.logoutClient();
    return {
      status: 'success',
      message: 'Sesi WhatsApp berhasil diputus.',
    };
  }

  @Post('send-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send test message via WhatsApp gateway' })
  async sendTest(@Body() dto: SendTestMessageDto) {
    const result = await this.gatewayService.sendTextMessage(dto.phone, dto.message);
    return {
      status: 'success',
      message: 'Pesan uji coba berhasil dikirim.',
      data: result,
    };
  }
}
```

- [ ] **Step 3: Update `WhatsappModule`**
Update `src/web/whatsapp/whatsapp.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappGatewayService } from './whatsapp-gateway.service';
import { WhatsappGatewayController } from './whatsapp-gateway.controller';

@Module({
  controllers: [WhatsappGatewayController],
  providers: [WhatsappService, WhatsappGatewayService],
  exports: [WhatsappService, WhatsappGatewayService],
})
export class WhatsappModule {}
```

- [ ] **Step 4: Verify NestJS build**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npm run build
```
Expected: Build passes without TypeScript errors.

- [ ] **Step 5: Commit**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && git add src/web/whatsapp/ && git commit -m "feat(whatsapp): add WhatsappGatewayController and register in module"
```

---

### Task 3: Create SDM API Proxy Route

**Files:**
- Create: `src/app/api/admin/whatsapp-gateway/route.js` in `/Users/hardiko/Documents/Developer/NEXT/sdm`

**Interfaces:**
- Consumes: Cookies `auth_token`, `NEXT_PUBLIC_BACKEND_URL`
- Produces: Proxies GET and POST requests to NestJS `/web/whatsapp-gateway/*`

- [ ] **Step 1: Implement `src/app/api/admin/whatsapp-gateway/route.js`**
```javascript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const res = await fetch(`${BACKEND_URL}/web/whatsapp-gateway/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching WhatsApp gateway status:", error);
    return NextResponse.json(
      { error: "Gagal mengambil status WhatsApp gateway" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // 'initialize' | 'logout' | 'send-test'

    const validActions = ["initialize", "logout", "send-test"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Action '${action}' tidak valid` },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    let body = undefined;
    if (action === "send-test") {
      body = JSON.stringify(await request.json());
    }

    const res = await fetch(`${BACKEND_URL}/web/whatsapp-gateway/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error executing WhatsApp gateway action:", error);
    return NextResponse.json(
      { error: "Gagal memproses aksi WhatsApp gateway" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify syntax of route file**
```bash
node -c /Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/admin/whatsapp-gateway/route.js
```
Expected: PASS (No syntax errors)

- [ ] **Step 3: Commit**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm && git add src/app/api/admin/whatsapp-gateway/route.js && git commit -m "feat(api): add WhatsApp gateway admin proxy route"
```

---

### Task 4: Create WhatsApp Gateway Admin Page & Settings Navigation Card

**Files:**
- Create: `src/app/dashboard/admin/whatsapp-gateway/page.js` in `/Users/hardiko/Documents/Developer/NEXT/sdm`
- Modify: `src/app/dashboard/admin/settings/page.js` in `/Users/hardiko/Documents/Developer/NEXT/sdm`

**Interfaces:**
- Consumes: `/api/admin/whatsapp-gateway`, Lucide React icons, Sonner toast
- Produces: Complete UI with QR scanning, status display, disconnect, and test message form

- [ ] **Step 1: Create `src/app/dashboard/admin/whatsapp-gateway/page.js`**
Build page with:
- State polling every 3 seconds while `SCAN_QR` or `INITIALIZING`.
- Status indicator banner (`READY`, `SCAN_QR`, `INITIALIZING`, `DISCONNECTED`).
- QR code image display with scan instructions when `SCAN_QR`.
- Connected device details (phone number, push name, last updated) when `READY`.
- Action buttons: "Hubungkan WhatsApp", "Putuskan Koneksi" (with confirmation), "Muat Ulang Status".
- Test message card with phone number validation and send action.

- [ ] **Step 2: Add quick access card in `src/app/dashboard/admin/settings/page.js`**
Add card with `MessageSquare` icon linking to `/dashboard/admin/whatsapp-gateway`.

- [ ] **Step 3: Verify syntax of created and modified files**
```bash
node -c /Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/admin/whatsapp-gateway/page.js
node -c /Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/admin/settings/page.js
```

- [ ] **Step 4: Commit**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm && git add src/app/dashboard/admin/whatsapp-gateway/page.js src/app/dashboard/admin/settings/page.js && git commit -m "feat(ui): add WhatsApp gateway admin page and settings link"
```

---

### Task 5: Production Build & End-to-End Verification

**Files:**
- None (verification)

- [ ] **Step 1: Run NestJS production build**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && npm run build
```
Expected: PASS

- [ ] **Step 2: Run SDM production build**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/sdm && npm run build
```
Expected: PASS

- [ ] **Step 3: Verify git status is clean across both repos**
```bash
cd /Users/hardiko/Documents/Developer/NEXT/website/backend && git status
cd /Users/hardiko/Documents/Developer/NEXT/sdm && git status
```
