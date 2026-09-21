# Auto Bypass Cron Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menjalankan bypass penilaian kinerja harian (100% approved) secara otomatis via backend cron job untuk seluruh cuti & izin yang disetujui (selain Dinas Dalam Kota) tanpa perlu membuka antarmuka web.

**Architecture:** Membuat `AutoBypassCutiIzinCronService` yang dijadwalkan setiap pukul 00:15 WIB di backend NestJS. Service memanggil `DeteksiCutiRepository.findDetectedLeaves` pada window H-3 sampai H+1, memfilter item berstatus `perlu_bypass`, dan mengeksekusi `executeBypassTransaction`. Terintegrasi dengan `CronMonitorService`.

**Tech Stack:** NestJS, `@nestjs/schedule`, TypeORM DataSource, Jest.

## Global Constraints
- Cron schedule: `0 15 0 * * *` (00:15 WIB), timezone `Asia/Jakarta`.
- Scan window: `startDate = H-3`, `endDate = H+1`.
- Filter: hanya item dengan `status_bypass === 'perlu_bypass'`.
- Bypass score: 100% approved via `DeteksiCutiRepository.executeBypassTransaction`.
- Monitoring: terdaftar di `CronMonitorService`.

---

### Task 1: AutoBypassCutiIzinCronService & Unit Tests

**Files:**
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/auto-bypass-cron.service.ts`
- Create: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/auto-bypass-cron.service.spec.ts`
- Modify: `/Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/sdm.module.ts`

**Interfaces:**
- Consumes: `DeteksiCutiRepository.findDetectedLeaves`, `DeteksiCutiRepository.executeBypassTransaction`, `CronMonitorService.trackExecution`.
- Produces: `processAutoBypass(): Promise<{ processedCount: number; message: string }>`, `handleCron(): Promise<string>`.

- [ ] **Step 1: Write failing unit test in `auto-bypass-cron.service.spec.ts`**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { AutoBypassCutiIzinCronService } from './auto-bypass-cron.service';
import { DeteksiCutiRepository } from './repositories/deteksi-cuti.repository';
import { CronMonitorService } from '../monitor/cron-monitor.service';

describe('AutoBypassCutiIzinCronService', () => {
  let service: AutoBypassCutiIzinCronService;
  let repository: Partial<DeteksiCutiRepository>;
  let cronMonitor: Partial<CronMonitorService>;

  beforeEach(async () => {
    repository = {
      findDetectedLeaves: jest.fn(),
      executeBypassTransaction: jest.fn(),
    };
    cronMonitor = {
      registerMetadata: jest.fn(),
      trackExecution: jest.fn((name, fn) => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoBypassCutiIzinCronService,
        { provide: DeteksiCutiRepository, useValue: repository },
        { provide: CronMonitorService, useValue: cronMonitor },
      ],
    }).compile();

    service = module.get<AutoBypassCutiIzinCronService>(AutoBypassCutiIzinCronService);
  });

  it('should be defined and register metadata', () => {
    expect(service).toBeDefined();
    expect(cronMonitor.registerMetadata).toHaveBeenCalledWith(
      'AutoBypassCutiIzinCronService',
      'Auto Bypass Penilaian Harian Cuti & Izin SDM',
      '0 15 0 * * *',
    );
  });

  it('should bypass pending cuti and izin items', async () => {
    (repository.findDetectedLeaves as jest.Mock).mockResolvedValue({
      summary: { total_cuti_shift: 2, approved_100: 0, perlu_bypass: 2 },
      items: [
        {
          pegawai_id: 1,
          nik: '123',
          tanggal: '2026-09-22',
          shift: 'P',
          urgensi: 'Tahunan',
          jenis_dispensasi: 'cuti',
          no_pengajuan: 'CUT001',
          status_bypass: 'perlu_bypass',
        },
        {
          pegawai_id: 2,
          nik: '124',
          tanggal: '2026-09-22',
          shift: 'S',
          urgensi: 'Perjalanan Dinas',
          jenis_dispensasi: 'izin_dinas',
          no_pengajuan: 'IZN001',
          status_bypass: 'perlu_bypass',
        },
      ],
    });

    (repository.executeBypassTransaction as jest.Mock).mockResolvedValue({
      success: true,
      message: 'Bypass penilaian berhasil untuk 2 jadwal cuti / izin',
      processedCount: 2,
    });

    const result = await service.processAutoBypass();
    expect(result.processedCount).toBe(2);
    expect(repository.executeBypassTransaction).toHaveBeenCalled();
  });

  it('should return zero when no items need bypass', async () => {
    (repository.findDetectedLeaves as jest.Mock).mockResolvedValue({
      summary: { total_cuti_shift: 1, approved_100: 1, perlu_bypass: 0 },
      items: [
        {
          pegawai_id: 1,
          nik: '123',
          tanggal: '2026-09-22',
          status_bypass: 'approved_100',
        },
      ],
    });

    const result = await service.processAutoBypass();
    expect(result.processedCount).toBe(0);
    expect(repository.executeBypassTransaction).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test src/sdm/auto-bypass-cron.service.spec.ts
```
Expected: Fails because service does not exist yet.

- [ ] **Step 3: Implement `auto-bypass-cron.service.ts`**

```typescript
import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import moment from 'moment';
import { DeteksiCutiRepository } from './repositories/deteksi-cuti.repository';
import { CronMonitorService } from '../monitor/cron-monitor.service';
import { BypassCutiItemInput } from './dto/deteksi-cuti-types';

@Injectable()
export class AutoBypassCutiIzinCronService {
  private readonly logger = new Logger(AutoBypassCutiIzinCronService.name);

  constructor(
    private readonly deteksiCutiRepository: DeteksiCutiRepository,
    @Optional()
    @Inject(CronMonitorService)
    private readonly cronMonitor?: CronMonitorService,
  ) {
    this.cronMonitor?.registerMetadata(
      'AutoBypassCutiIzinCronService',
      'Auto Bypass Penilaian Harian Cuti & Izin SDM',
      '0 15 0 * * *',
    );
  }

  @Cron('0 15 0 * * *', {
    name: 'AutoBypassCutiIzinCronService',
    timeZone: 'Asia/Jakarta',
  })
  async handleCron(): Promise<string> {
    const task = async () => {
      this.logger.log('Starting Auto Bypass Cron Job for Cuti & Izin...');
      const result = await this.processAutoBypass();
      const summary = `Auto Bypass Cron Job completed. ${result.processedCount} records bypassed.`;
      this.logger.log(summary);
      return summary;
    };

    if (this.cronMonitor) {
      return this.cronMonitor.trackExecution('AutoBypassCutiIzinCronService', task);
    }
    return task();
  }

  async processAutoBypass(): Promise<{ processedCount: number; message: string }> {
    const startDate = moment().subtract(3, 'days').format('YYYY-MM-DD');
    const endDate = moment().add(1, 'days').format('YYYY-MM-DD');

    this.logger.log(`Scanning unbypassed cuti & izin from ${startDate} to ${endDate}`);

    const detected = await this.deteksiCutiRepository.findDetectedLeaves({
      startDate,
      endDate,
      statusFilter: 'perlu_bypass',
    });

    const itemsToBypass: BypassCutiItemInput[] = (detected.items || [])
      .filter((i) => i.status_bypass === 'perlu_bypass')
      .map((i) => ({
        pegawai_id: i.pegawai_id,
        nik: i.nik,
        tanggal: i.tanggal,
        shift: i.shift,
        urgensi: i.urgensi,
        jenis_dispensasi: i.jenis_dispensasi,
        no_pengajuan: i.no_pengajuan,
      }));

    if (itemsToBypass.length === 0) {
      this.logger.log('No pending cuti/izin found requiring bypass.');
      return { processedCount: 0, message: 'Tidak ada data cuti/izin yang perlu dibypass.' };
    }

    this.logger.log(`Found ${itemsToBypass.length} items to bypass. Executing transaction...`);
    const txResult = await this.deteksiCutiRepository.executeBypassTransaction(itemsToBypass);

    return {
      processedCount: txResult.processedCount,
      message: txResult.message,
    };
  }
}
```

- [ ] **Step 4: Register provider in `sdm.module.ts`**

Import and add `AutoBypassCutiIzinCronService` to `providers` array in `website/backend/src/sdm/sdm.module.ts`.

- [ ] **Step 5: Run tests to verify they pass**

Run:
```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test src/sdm/auto-bypass-cron.service.spec.ts
```
Expected: PASS.

- [ ] **Step 6: Commit changes**

```bash
git add src/sdm/auto-bypass-cron.service.ts src/sdm/auto-bypass-cron.service.spec.ts src/sdm/sdm.module.ts
git commit -m "feat(sdm): add auto bypass cron service for cuti and izin"
```

---

### Task 2: Build & Verification Check

**Files:**
- None (build verification)

- [ ] **Step 1: Run all SDM unit tests**

```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend test src/sdm/
```
Expected: 12 test suites pass.

- [ ] **Step 2: Build NestJS backend**

```bash
npm --prefix /Users/hardiko/Documents/Developer/NEXT/website/backend run build
```
Expected: Build passes with exit code 0.
