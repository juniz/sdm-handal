export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { assertSafeBrotliRuntime, installSafeFetchWrapper } = await import(
			"@/lib/security/node2shell-guard"
		);
		assertSafeBrotliRuntime();
		installSafeFetchWrapper();
	}
}
