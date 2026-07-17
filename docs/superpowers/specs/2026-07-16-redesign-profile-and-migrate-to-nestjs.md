# Design Spec: Redesign Profile Page & Migrate to NestJS Backend

Redesign the Employee Profile page in the SDM Next.js application using the Azure Blue Hospital style guide and migrate the backend services from Next.js local API routes to NestJS GraphQL queries and mutations.

## User Review Required

> [!NOTE]
> Authorization will continue to use the HTTP-only `auth_token` cookie decoded by the NestJS backend via passport-jwt strategy.

## Proposed Changes

### Backend (NestJS)

#### [MODIFY] [employee-types.ts](file:///Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/dto/employee-types.ts)
*   Extend `SdmProfileDto` to include all profile properties retrieved from the database:
    ```typescript
    @Field(() => String, { nullable: true })
    jk?: string;
    @Field(() => String, { nullable: true })
    pendidikan?: string;
    @Field(() => String, { nullable: true })
    kota?: string;
    @Field(() => String, { nullable: true })
    bidang?: string;
    @Field(() => String, { nullable: true })
    kode_kelompok?: string;
    @Field(() => String, { nullable: true })
    mulai_kerja?: string;
    @Field(() => String, { nullable: true })
    ms_kerja?: string;
    @Field(() => String, { nullable: true })
    npwp?: string;
    @Field(() => String, { nullable: true })
    no_ktp?: string;
    @Field(() => String, { nullable: true })
    rekening?: string;
    @Field(() => String, { nullable: true })
    mulai_kontrak?: string;
    @Field(() => String, { nullable: true })
    stts_aktif?: string;
    @Field(() => String, { nullable: true })
    jbtn?: string;
    ```
*   Add `UpdateSdmProfileInput` input DTO:
    ```typescript
    @InputType()
    export class UpdateSdmProfileInput {
      @Field(() => String, { nullable: true })
      alamat?: string;
      @Field(() => String, { nullable: true })
      kota?: string;
      @Field(() => String, { nullable: true })
      jk?: string;
      @Field(() => String, { nullable: true })
      tmp_lahir?: string;
      @Field(() => String, { nullable: true })
      tgl_lahir?: string;
      @Field(() => String, { nullable: true })
      pendidikan?: string;
      @Field(() => String, { nullable: true })
      no_ktp?: string;
      @Field(() => String, { nullable: true })
      npwp?: string;
      @Field(() => String, { nullable: true })
      rekening?: string;
      @Field(() => String, { nullable: true })
      bidang?: string;
      @Field(() => String, { nullable: true })
      mulai_kerja?: string;
      @Field(() => String, { nullable: true })
      mulai_kontrak?: string;
    }
    ```
*   Add `SdmEducationDto`, `CreateSdmEducationInput`, and `UpdateSdmEducationInput`:
    ```typescript
    @ObjectType()
    export class SdmEducationDto {
      @Field(() => Number)
      id: number;
      @Field(() => String)
      pendidikan: string;
      @Field(() => String)
      sekolah: string;
      @Field(() => String)
      jurusan: string;
      @Field(() => String)
      thn_lulus: string;
      @Field(() => String)
      kepala: string;
      @Field(() => String)
      pendanaan: string;
      @Field(() => String)
      keterangan: string;
      @Field(() => String)
      status: string;
      @Field(() => String)
      berkas: string;
    }

    @InputType()
    export class CreateSdmEducationInput {
      @Field(() => String)
      pendidikan: string;
      @Field(() => String)
      sekolah: string;
      @Field(() => String, { nullable: true })
      jurusan?: string;
      @Field(() => String)
      thn_lulus: string;
      @Field(() => String, { nullable: true })
      kepala?: string;
      @Field(() => String, { nullable: true })
      pendanaan?: string;
      @Field(() => String, { nullable: true })
      keterangan?: string;
      @Field(() => String, { nullable: true })
      status?: string;
      @Field(() => String, { nullable: true })
      berkas?: string;
    }

    @InputType()
    export class UpdateSdmEducationInput {
      @Field(() => String)
      old_pendidikan: string;
      @Field(() => String)
      old_sekolah: string;
      @Field(() => String)
      pendidikan: string;
      @Field(() => String)
      sekolah: string;
      @Field(() => String, { nullable: true })
      jurusan?: string;
      @Field(() => String)
      thn_lulus: string;
      @Field(() => String, { nullable: true })
      kepala?: string;
      @Field(() => String, { nullable: true })
      pendanaan?: string;
      @Field(() => String, { nullable: true })
      keterangan?: string;
      @Field(() => String, { nullable: true })
      status?: string;
      @Field(() => String, { nullable: true })
      berkas?: string;
    }
    ```
*   Add `SdmSeminarDto`, `CreateSdmSeminarInput`, and `UpdateSdmSeminarInput`:
    ```typescript
    @ObjectType()
    export class SdmSeminarDto {
      @Field(() => Number)
      id: number;
      @Field(() => String)
      tingkat: string;
      @Field(() => String)
      jenis: string;
      @Field(() => String)
      nama_seminar: string;
      @Field(() => String)
      peranan: string;
      @Field(() => String)
      mulai: string;
      @Field(() => String)
      selesai: string;
      @Field(() => String)
      penyelengara: string;
      @Field(() => String)
      tempat: string;
      @Field(() => String)
      berkas: string;
    }

    @InputType()
    export class CreateSdmSeminarInput {
      @Field(() => String)
      tingkat: string;
      @Field(() => String)
      jenis: string;
      @Field(() => String)
      nama_seminar: string;
      @Field(() => String, { nullable: true })
      peranan?: string;
      @Field(() => String)
      mulai: string;
      @Field(() => String)
      selesai: string;
      @Field(() => String, { nullable: true })
      penyelengara?: string;
      @Field(() => String, { nullable: true })
      tempat?: string;
      @Field(() => String, { nullable: true })
      berkas?: string;
    }

    @InputType()
    export class UpdateSdmSeminarInput {
      @Field(() => String)
      old_nama_seminar: string;
      @Field(() => String)
      old_mulai: string;
      @Field(() => String)
      tingkat: string;
      @Field(() => String)
      jenis: string;
      @Field(() => String)
      nama_seminar: string;
      @Field(() => String, { nullable: true })
      peranan?: string;
      @Field(() => String)
      mulai: string;
      @Field(() => String)
      selesai: string;
      @Field(() => String, { nullable: true })
      penyelengara?: string;
      @Field(() => String, { nullable: true })
      tempat?: string;
      @Field(() => String, { nullable: true })
      berkas?: string;
    }
    ```
*   Add `SdmPendidikanDto` and `SdmPrintCvDto` type mappings:
    ```typescript
    @ObjectType()
    export class SdmPendidikanDto {
      @Field(() => String)
      tingkat: string;
    }

    @ObjectType()
    export class SdmHistoryJabatanDto {
      @Field(() => String)
      jabatan: string;
      @Field(() => String, { nullable: true })
      tgl_sk?: string;
    }

    @ObjectType()
    export class SdmHistoryPenghargaanDto {
      @Field(() => String)
      nama_penghargaan: string;
      @Field(() => String, { nullable: true })
      tanggal?: string;
      @Field(() => String, { nullable: true })
      instansi?: string;
      @Field(() => String, { nullable: true })
      pejabat_pemberi?: string;
    }

    @ObjectType()
    export class SdmHistoryGajiDto {
      @Field(() => String)
      pangkatjabatan: string;
      @Field(() => Number, { nullable: true })
      gapok?: number;
      @Field(() => String, { nullable: true })
      no_sk?: string;
      @Field(() => String, { nullable: true })
      tgl_sk?: string;
    }

    @ObjectType()
    export class SdmPrintCvDto {
      @Field(() => SdmProfileDto)
      pegawai: SdmProfileDto;
      @Field(() => [SdmHistoryJabatanDto])
      jabatan: SdmHistoryJabatanDto[];
      @Field(() => [SdmEducationDto])
      pendidikan: SdmEducationDto[];
      @Field(() => [SdmSeminarDto])
      seminar: SdmSeminarDto[];
      @Field(() => [SdmHistoryPenghargaanDto])
      penghargaan: SdmHistoryPenghargaanDto[];
      @Field(() => [SdmHistoryGajiDto])
      gaji: SdmHistoryGajiDto[];
    }
    ```

#### [MODIFY] [employee.repository.ts](file:///Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/repositories/employee.repository.ts)
*   Modify `getProfile` to query full details from database `pegawai` table (along with joins for `kelompok_jabatan`, `departemen`, and `stts_kerja`).
*   Implement:
    *   `updateProfile(id: number, data: any): Promise<boolean>`
    *   `getEducationHistory(id: number): Promise<any[]>`
    *   `createEducation(id: number, data: any): Promise<any>`
    *   `updateEducation(id: number, old_pendidikan: string, old_sekolah: string, data: any): Promise<boolean>`
    *   `deleteEducation(id: number, pendidikan: string, sekolah: string): Promise<boolean>`
    *   `getSeminarHistory(id: number): Promise<any[]>`
    *   `createSeminar(id: number, data: any): Promise<any>`
    *   `updateSeminar(id: number, old_nama_seminar: string, old_mulai: string, data: any): Promise<boolean>`
    *   `deleteSeminar(id: number, nama_seminar: string, mulai: string): Promise<boolean>`
    *   `getPendidikanList(): Promise<any[]>`
    *   `verifyOldPassword(username: string, oldPassword: string): Promise<boolean>`
    *   `updatePassword(username: string, newPassword: string): Promise<boolean>`
    *   `getPrintCvData(id: number, username: string): Promise<any>`

#### [MODIFY] [employee.service.ts](file:///Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/employee.service.ts)
*   Delegate resolver mutations/queries calls to `EmployeeRepository`.
*   Implement formatting and business logic.

#### [MODIFY] [employee.resolver.ts](file:///Users/hardiko/Documents/Developer/NEXT/website/backend/src/sdm/employee.resolver.ts)
*   Expose all queries and mutations with decorator validation.

---

### Frontend (Next.js)

#### [NEW] [profile-gql-client.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/lib/profile-gql-client.js)
*   Implement GraphQL operations:
    *   `fetchProfileDetail()`
    *   `mutationUpdateProfile(...)`
    *   `fetchEducationHistory()`
    *   `mutationCreateEducation(...)`
    *   `mutationUpdateEducation(...)`
    *   `mutationDeleteEducation(...)`
    *   `fetchSeminarHistory()`
    *   `mutationCreateSeminar(...)`
    *   `mutationUpdateSeminar(...)`
    *   `mutationDeleteSeminar(...)`
    *   `fetchPendidikanList()`
    *   `mutationUpdatePassword(...)`
    *   `fetchPrintCvData()`

#### [MODIFY] [page.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/profile/page.js)
*   Replace standard fetch API routes with imports from `profile-gql-client.js`.
*   Upgrade visual styling matching `RS Bhayangkara Nganjuk — UI Design Preset`:
    *   Figtree headings.
    *   Azure Blue (`#185FA5`) as primary color accents, active tab colors, and button colors.
    *   Subtle animations via framer-motion and smooth transitions on hover/focus states.
    *   Card layouts with shadow transitions (`translate-y-[-2px]`).

#### [MODIFY] [EducationHistorySection.jsx](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/profile/EducationHistorySection.jsx)
*   Convert REST fetches/posts/puts/deletes to GQL client calls.

#### [MODIFY] [SeminarHistorySection.jsx](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/profile/SeminarHistorySection.jsx)
*   Convert REST fetches/posts/puts/deletes to GQL client calls.

#### [MODIFY] [PrintCVReport.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/components/profile/PrintCVReport.js)
*   Refactor to fetch data using `fetchPrintCvData` GQL client.

---

### Clean Up

#### [DELETE] [route.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/profile/route.js)
#### [DELETE] [route.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/profile/education/route.js)
#### [DELETE] [route.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/profile/seminar/route.js)
#### [DELETE] [route.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/profile/password/route.js)
#### [DELETE] [route.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/pendidikan/route.js)
#### [DELETE] [route.js](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/profile/print-cv/route.js)

## Verification Plan

### Automated Tests
*   Run NestJS build to verify schema generation and DI compile validation:
    ```bash
    npm run build (in website/backend)
    ```
*   Run Next.js build to verify code compilation:
    ```bash
    npm run build (in sdm)
    ```

### Manual Verification
*   Check tab switching, profile fields display, edit profile modal, education/seminar CRUD, change password flow, and PDF CV generation in the browser.
