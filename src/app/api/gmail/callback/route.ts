import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOAuth2Client, storeTokens } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL!));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/emails/settings?error=${encodeURIComponent(error)}`, process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/emails/settings?error=no_code", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  try {
    const oauth2 = getOAuth2Client();
    const { tokens } = await oauth2.getToken(code);
    await storeTokens(tokens as Record<string, unknown>);

    return NextResponse.redirect(
      new URL("/emails/settings?connected=true", process.env.NEXT_PUBLIC_APP_URL!)
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.redirect(
      new URL(`/emails/settings?error=${encodeURIComponent(message)}`, process.env.NEXT_PUBLIC_APP_URL!)
    );
  }
}
