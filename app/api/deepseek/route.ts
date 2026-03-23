import { NextResponse } from "next/server";

// Helper function to call Typhoon API
async function callTyphoon(prompt: string, signal: AbortSignal) {
  const response = await fetch(
    "https://api.opentyphoon.ai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TYPHOON_API_KEY}`,
      },
      signal,
      body: JSON.stringify({
        model: "typhoon-v2.5-30b-a3b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that analyzes student portfolios. Respond in Thai language with JSON format when requested. Be concise and accurate.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 8000,
        temperature: 0.7,
      }),
    }
  );

  const data = await response.json();
  console.log('Typhoon API Status:', response.status);
  console.log('Typhoon Response:', JSON.stringify(data, null, 2).substring(0, 500));

  // Check if response has error
  if (!response.ok) {
    throw new Error(`Typhoon HTTP error: ${response.status} - ${data?.error?.message || 'Unknown'}`);
  }

  // Check if response has valid content
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Typhoon empty response: ${JSON.stringify(data).substring(0, 200)}`);
  }

  return data;
}

// Helper function to call DeepSeek API
async function callDeepSeek(prompt: string, signal: AbortSignal) {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      // change deepseek model
      model: "deepseek-reasoner",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that analyzes student portfolios. Respond in Thai language with JSON format when requested. Be concise and accurate.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 8000,
      temperature: 0.7,
    }),
  });

  const data = await response.json();
  console.log('DeepSeek API Status:', response.status);

  if (!response.ok) {
    throw new Error(`DeepSeek failed: ${data?.error?.message || response.statusText}`);
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is empty" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let data: any;
    let usedProvider = '';

    // Try Typhoon first
    try {
      console.log('Trying Typhoon API...');
      data = await callTyphoon(prompt, controller.signal);
      usedProvider = 'typhoon';
      console.log('Typhoon succeeded');
    } catch (typhoonError) {
      console.warn('Typhoon failed, falling back to DeepSeek:', typhoonError);

      // Fallback to DeepSeek
      try {
        console.log('Trying DeepSeek API...');
        data = await callDeepSeek(prompt, controller.signal);
        usedProvider = 'deepseek';
        console.log('DeepSeek succeeded');
      } catch (deepseekError) {
        console.error('DeepSeek also failed:', deepseekError);
        clearTimeout(timeoutId);
        return NextResponse.json(
          { error: "Both AI providers failed", details: String(deepseekError) },
          { status: 503 }
        );
      }
    }

    clearTimeout(timeoutId);

    console.log(`AI Response from ${usedProvider}:`, JSON.stringify(data, null, 2).substring(0, 300));

    return NextResponse.json({ result: data, provider: usedProvider });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }

    console.error("Error in AI API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
