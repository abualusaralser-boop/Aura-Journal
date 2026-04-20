import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;
    
    // Priority: Server Environment Variables -> Client Header Key
    let apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const clientApiKey = req.headers.get('Authorization')?.replace('Bearer ', '') || req.headers.get('x-api-key');
    
    if (!apiKey || apiKey.includes('_key_here')) {
      apiKey = clientApiKey || '';
    }

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Application not configured. Please add API keys to .env.local',
        isMissingKey: true 
      }, { status: 401 });
    }

    // Detect if it's a Groq key
    const isGroq = apiKey.startsWith('gsk_');
    const baseURL = isGroq ? 'https://api.groq.com/openai/v1' : undefined;

    const openai = new OpenAI({ apiKey, baseURL });

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    const tempFileName = `${randomUUID()}.webm`;
    
    // Use /tmp which is writable in Vercel serverless functions
    const tempFilePath = path.join('/tmp', tempFileName);
    fs.writeFileSync(tempFilePath, buffer);

    const fileStream = fs.createReadStream(tempFilePath);
    
    const dialect = req.headers.get('x-dialect') || 'sudanese';
    
    // Customize prompt based on dialect
    let prompt = "هذا تسجيل يوميات. يجب تفريغ الصوت وتحويله إلى نص حرفياً كما نطق به المتحدث وبنفس الكلمات والتعابير دون تحويلها إلى اللغة العربية الفصحى.";
    if (dialect === 'sudanese') {
      prompt = "هذا تسجيل يوميات بصوت شخص يتحدث اللهجة السودانية. يجب تفريغ الصوت وتحويله إلى نص حرفياً وكما نطق به المتحدث وبنفس الكلمات والتعابير السودانية (مثل استخدام 'شنو'، 'داير'، 'هسي') دون تحويلها للفصحى.";
    } else if (dialect === 'egyptian') {
      prompt = "هذا تسجيل يوميات بصوت شخص يتحدث اللهجة المصرية. يجب تفريغ الصوت وتحويله إلى نص حرفياً وكما نطق به المتحدث وبنفس الكلمات والتعابير المصرية دون تحويلها للفصحى.";
    }
    
    const response = await openai.audio.transcriptions.create({
      file: fileStream as any,
      model: isGroq ? 'whisper-large-v3' : 'whisper-1',
      // Removed fixed 'ar' language to allow auto-detection of English or Arabic
      prompt: "This is a journal entry. Please transcribe the audio exactly as spoken in its original language, whether it is Arabic (Sudanese, Egyptian, or Fusha) or English. Do not translate between languages, just transcribe faithfully. إذا كان الكلام بالعربية السودانية أو المصرية، اكتبه كما قيل وبنفس الكلمات والتعابير المحلية.",
    });

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    return NextResponse.json({ text: response.text });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message || 'Transcription processing failed' }, { status: 500 });
  }
}
