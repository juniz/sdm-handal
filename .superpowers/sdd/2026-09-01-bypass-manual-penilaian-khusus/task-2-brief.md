# Task 2 Brief: Backend Service & GraphQL Resolver for Manual Bypass

## Objective
Tambahkan method `processManualBypass` pada `DeteksiCutiService`, mutation `bypassManualPegawai` pada `DeteksiCutiResolver`, dan update unit tests.

## Target Workspace
`/Users/hardiko/Documents/Developer/NEXT/website/backend`

## Target Files
- `src/sdm/deteksi-cuti.service.ts`
- `src/sdm/deteksi-cuti.resolver.ts`
- `src/sdm/deteksi-cuti.service.spec.ts`
- `src/schema.gql`

## Detailed Specifications

### 1. `DeteksiCutiService`
Tambahkan method:
```typescript
async processManualBypass(
  userId: number,
  dept: string,
  input: BypassManualPegawaiInput,
): Promise<BypassManualResultDto> {
  const isAuthorized = await this.repository.isAuthorized(userId, dept);
  if (!isAuthorized) {
    throw new ForbiddenException('Forbidden access to manual leave bypass');
  }
  return this.repository.executeManualBypassTransaction(input);
}
```

### 2. `DeteksiCutiResolver`
Tambahkan mutation:
```typescript
@Mutation(() => BypassManualResultDto, { name: 'bypassManualPegawai' })
async bypassManualPegawai(
  @CurrentUser() user: any,
  @Args('input', { type: () => BypassManualPegawaiInput })
  input: BypassManualPegawaiInput,
): Promise<BypassManualResultDto> {
  return this.service.processManualBypass(
    user.id,
    user.departemen || '',
    input,
  );
}
```

### 3. Unit Tests (`src/sdm/deteksi-cuti.service.spec.ts`)
Tambahkan test case untuk `processManualBypass`:
- Verifikasi throw `ForbiddenException` jika auth gagal.
- Verifikasi pemanggilan `executeManualBypassTransaction` jika auth berhasil.

## Verification
- Run: `npm test -- src/sdm/deteksi-cuti.service.spec.ts`
- Run: `npm run build`

## Git Commit
`feat(sdm): add bypassManualPegawai GraphQL mutation and service method`
