# Task 2 Report: Backend Service & GraphQL Resolver for Manual Bypass

## Status: COMPLETED

## Summary of Changes
1. **`src/sdm/deteksi-cuti.service.ts`**:
   - Added `processManualBypass(userId, dept, input)` method.
   - Enforces authorization check using `repository.isAuthorized(userId, dept)`. Throws `ForbiddenException` on unauthorized requests.
   - Delegates execution to `repository.executeManualBypassTransaction(input)`.

2. **`src/sdm/deteksi-cuti.resolver.ts`**:
   - Added `@Mutation(() => BypassManualResultDto, { name: 'bypassManualPegawai' })`.
   - Passes `user.id`, `user.departemen`, and `input: BypassManualPegawaiInput` to `service.processManualBypass`.
   - Protected by `@UseGuards(GqlJwtSdmGuard, GqlThrottlerGuard)`.

3. **`src/sdm/deteksi-cuti.service.spec.ts`**:
   - Added mock for `executeManualBypassTransaction`.
   - Added test suite `processManualBypass`:
     - Verifies `ForbiddenException` thrown when user is not authorized.
     - Verifies `executeManualBypassTransaction` invoked with input when authorized and returns result.

4. **`src/schema.gql`**:
   - Schema auto-updated with `BypassManualPegawaiInput`, `BypassManualResultDto`, and `bypassManualPegawai` mutation.

## Verification
- **Unit Tests**:
  ```bash
  npm test -- src/sdm/deteksi-cuti.service.spec.ts
  ```
  Result: 8/8 tests passed.
  All SDM tests (`npm test -- src/sdm`): 7 test suites passed (36 tests).
- **Build**:
  ```bash
  npm run build
  ```
  Result: Exit code 0, build successful.

## Commit
- `09b4c8d`: `feat(sdm): add bypassManualPegawai GraphQL mutation and service method`
