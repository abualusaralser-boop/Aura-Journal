import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const prompts: Record<string, string> = {
  enhance: `أنت مساعد كتابة محترف. المهمة: حسّن أسلوب النص التالي مع الحفاظ على المعنى واللهجة الأصلية للكاتب. 
اجعل الجمل أكثر سلاسة وتعبيراً. أعد فقط النص المُحسَّن دون أي تعليق.`,
  summarize: `أنت مساعد كتابة. المهمة: لخّص النص التالي في فقرة قصيرة تحتفظ بأهم الأفكار والمشاعر. 
أعد فقط الملخص دون أي تعليق.`,
  rephrase: `أنت مساعد كتابة. المهمة: أعد صياغة النص التالي بأسلوب مختلف لكن بنفس المعنى. 
احتفظ بنفس اللغة (عربي أو إنجليزي) والتون العام. أعد فقط النص المُعاد صياغته دون أي تعليق.`,
  discuss: `أنت صديق مستمع ومحلل ذكي. المهمة: اقرأ يومية المستخدم التالية وناقشها معه بأسلوب ودي ومتعاطف. 
اعطِ رأيك، قدم بعض الدعم النفسي، واطرح سؤالاً واحداً يحفزه على التفكير بعمق فيما كتب. 
يجب أن يكون الرد دافئاً ومختصراً (فقرة واحدة فقط). إذا كانت اليومية باللهجة السودانية، رد بمزيج من العربية البسيطة والسودانية الودودة.`,
};

export async function POST(req: Request) {
  try {
    const { content, action } = await req.json();
    console.log(`AI Action Started: ${action}`);
    
    // Priority: Server Environment Variables -> Client Header Key
    let apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
    const clientApiKey = req.headers.get('Authorization')?.replace('Bearer ', '') || req.headers.get('x-api-key');
    
    if (!apiKey || apiKey.includes('_key_here')) {
      apiKey = clientApiKey || '';
    }

    if (!content?.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    if (!['enhance', 'summarize', 'rephrase', 'discuss'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!apiKey) {
      console.error("AI Error: No API Key found on server or client");
      return NextResponse.json({ 
        error: 'Application not configured. Please add API keys to Vercel settings',
        isMissingKey: true 
      }, { status: 401 });
    }

    const isGroq = apiKey.startsWith('gsk_');
    const baseURL = isGroq ? 'https://api.groq.com/openai/v1' : undefined;
    const model = isGroq ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';

    console.log(`Using Model: ${model} on ${isGroq ? 'Groq' : 'OpenAI'}`);

    const openai = new OpenAI({ apiKey, baseURL });

    const response = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: prompts[action] },
        { role: 'user', content },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const result = response.choices[0]?.message?.content?.trim() ?? '';
    console.log("AI Response Received Successfully");
    return NextResponse.json({ result });

  } catch (error: any) {
    console.error('SERVER AI ERROR:', error);
    return NextResponse.json({ error: error.message || 'AI processing failed' }, { status: 500 });
  }
}
