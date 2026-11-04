/**
 * Centralized GraphQL endpoint resolver.
 * - Client-side (browser): uses relative `/graphql` to proxy through Next.js rewrites
 *   to avoid mixed-content, CORS, or dead `localhost` calls from remote browsers.
 * - Server-side (SSR / Route handlers): uses internal loopback to NestJS backend.
 */
export function getGqlEndpoint() {
	if (typeof window !== "undefined") {
		const pub = process.env.NEXT_PUBLIC_BACKEND_URL;
		if (!pub || pub.includes("localhost") || pub.includes("127.0.0.1")) {
			return "/graphql";
		}
		return `${pub.replace(/\/$/, "")}/graphql`;
	}

	const serverBackend =
		process.env.INTERNAL_BACKEND_URL ||
		process.env.BACKEND_URL ||
		process.env.NEXT_PUBLIC_BACKEND_URL ||
		"http://127.0.0.1:3001";

	return `${serverBackend.replace(/\/$/, "")}/graphql`;
}

export const GQL_ENDPOINT = getGqlEndpoint();
