import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-dummy-key-for-build',
});

// Check if OpenAI is properly configured
if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV !== 'development') {
  console.warn('OPENAI_API_KEY is not configured');
}

export async function POST(request) {
  try {
    const { previousPosts, topic, goal, writingStyle } = await request.json();

    // First, analyze the writing style from previous posts
    const styleAnalysisPrompt = `Analyze the following newsletter posts and extract the key characteristics of the writing style:
    ${previousPosts.join('\n\n')}
    
    Please identify: tone, vocabulary level, sentence structure patterns, and unique stylistic elements.`;

    const styleAnalysis = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are a writing style analyst. Analyze the given text and identify key stylistic patterns."
        },
        {
          role: "user",
          content: styleAnalysisPrompt
        }
      ],
      temperature: 0.7,
    });

    // Generate the new newsletter content using the analyzed style
    const writingPrompt = `Write a newsletter post about ${topic} with the goal of ${goal}. 
    Match this writing style: ${styleAnalysis.choices[0].message.content}
    Additional style notes: ${writingStyle}`;

    const newsletterContent = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert newsletter writer who can perfectly mimic writing styles while maintaining engaging and valuable content."
        },
        {
          role: "user",
          content: writingPrompt
        }
      ],
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      content: newsletterContent.choices[0].message.content,
      styleAnalysis: styleAnalysis.choices[0].message.content
    });

  } catch (error) {
    console.error('AI Newsletter Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 