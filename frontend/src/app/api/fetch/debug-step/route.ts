import { NextResponse } from 'next/server';
import { fetchCodeBlockData } from '@/services/debugDataService'; // Assume this service interacts with your data source

export async function POST(request: Request) {
  try {
    const { codeBlockName } = await request.json();
    if (!codeBlockName) {
      return NextResponse.json({ error: 'codeBlockName is required' }, { status: 400 });
    }

    const data = await fetchCodeBlockData(codeBlockName);
    if (!data) {
      return NextResponse.json({ error: 'Data not found for the given codeBlockName' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in fetch/debug-step API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 