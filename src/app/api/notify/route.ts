import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { recipientEmail, alertType, message, location } = await req.json();

    // In production, integrate Nodemailer or Twilio SMS API here.
    // For prototype demonstration, we log and simulate successful dispatch:
    console.log(`[DISPATCH SYSTEM] Sending ${alertType} alert to ${recipientEmail}:`, {
      message,
      location,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({ 
      success: true, 
      status: `Alert successfully dispatched to ${recipientEmail || "designated naval authority channel"}` 
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Dispatch failure";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}