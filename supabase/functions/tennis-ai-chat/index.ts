
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tennis coaching system prompt
const TENNIS_SYSTEM_PROMPT = `You are an expert tennis coach and analyst with years of experience. 
You provide friendly, detailed advice on tennis techniques, strategies, training regimens, and equipment.

Your knowledge includes:
- Proper technique for all tennis strokes (serve, forehand, backhand, volley, etc.)
- Match strategy and tactics for different play styles and court surfaces
- Training routines and exercise recommendations for players of all levels
- Equipment advice including racket selection, strings, shoes, and accessories
- Rules of the game and tournament formats
- Mental preparation and sports psychology as it relates to tennis
- Injury prevention and recovery specific to tennis players
- Analysis of professional players' styles and techniques

When giving advice:
1. Be encouraging and positive while remaining honest
2. Tailor advice to the user's described skill level when mentioned
3. Explain the "why" behind your recommendations
4. Use clear, concise descriptions of physical movements
5. Provide specific, actionable advice that can be implemented immediately
6. Reference relevant professional players as examples when appropriate

IMPORTANT: If you don't know the answer to something, admit it rather than making up information. Suggest resources where the user might find more information or recommend consulting with a local tennis professional for personalized advice.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get API key from env
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Get the request JSON
    const { conversationId, message, userId } = await req.json();
    
    if (!message || !userId) {
      throw new Error('Message and userId are required');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch conversation history or create a new conversation
    let conversation;
    let currentConversationId = conversationId;

    if (!currentConversationId) {
      // Create new conversation
      const { data: newConversation, error: createError } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title: message.substring(0, 40) + '...' })
        .select()
        .single();

      if (createError) throw createError;
      currentConversationId = newConversation.id;
      conversation = newConversation;
      console.log(`Created new conversation: ${currentConversationId}`);
    } else {
      // Fetch existing conversation to verify ownership
      const { data: existingConversation, error: fetchError } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', currentConversationId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existingConversation) {
        throw new Error('Conversation not found or access denied');
      }
      conversation = existingConversation;
      console.log(`Using existing conversation: ${currentConversationId}`);
    }

    // Fetch conversation history
    const { data: messageHistory, error: historyError } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    if (historyError) throw historyError;

    // Save user message to the database
    const { error: insertError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: currentConversationId,
        content: message,
        is_from_ai: false
      });

    if (insertError) throw insertError;

    // Format message history for OpenAI chat completion
    const messages = [
      { role: "system", content: TENNIS_SYSTEM_PROMPT },
    ];

    // Add conversation history
    if (messageHistory && messageHistory.length > 0) {
      messageHistory.forEach(msg => {
        messages.push({
          role: msg.is_from_ai ? "assistant" : "user",
          content: msg.content
        });
      });
    }

    // Add the current message
    messages.push({ role: "user", content: message });

    // Call OpenAI API
    console.log(`Sending ${messages.length} messages to OpenAI`);
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const responseData = await openaiResponse.json();
    const aiMessage = responseData.choices[0].message.content;

    // Save AI response to the database
    const { error: saveResponseError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: currentConversationId,
        content: aiMessage,
        is_from_ai: true
      });

    if (saveResponseError) throw saveResponseError;

    // Return the response
    return new Response(
      JSON.stringify({
        conversationId: currentConversationId,
        message: aiMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error.message);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
