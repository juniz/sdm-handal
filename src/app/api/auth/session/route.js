import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ loggedIn: false }, { status: 401 });
		}

		return NextResponse.json({ loggedIn: true, token });
	} catch (error) {
		console.error("Error retrieving session token:", error);
		return NextResponse.json({ loggedIn: false }, { status: 500 });
	}
}
