import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    { message: 'Chat endpoint not yet implemented by AGENT_03.' },
    { status: 501 }
  )
}
