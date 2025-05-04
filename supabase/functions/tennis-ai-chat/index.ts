
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced tennis coaching system prompt with improved instruction and examples
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
7. Keep responses focused and to-the-point, in the 50-200 word range unless detailed explanations are requested
8. Use bullet points for clarity when listing multiple recommendations or steps

When asked about equipment:
- Always consider the player's skill level, playing style, and physical attributes
- Avoid overly promoting specific brands unless the user asks for brand recommendations
- Focus on the technical aspects and benefits of equipment choices

When asked about training:
- Suggest exercises appropriate to the player's described level
- Include a balance of technique, fitness, and mental components
- Recommend appropriate progression paths based on skill development

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
      // Create new conversation with a more descriptive title
      const titleText = message.length > 40 ? message.substring(0, 40) + '...' : message;
      const { data: newConversation, error: createError } = await supabase
        .from('ai_conversations')
        .insert({ user_id: userId, title: titleText })
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

    // Get user profile information (for future personalization)
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Prepare for personalization (will be expanded in the future)
    let systemPrompt = TENNIS_SYSTEM_PROMPT;
    
    // In the future, we can enhance the prompt with user information
    if (userProfile && !profileError) {
      const profileInfo = [];
      if (userProfile.experience_level) profileInfo.push(`Player experience level: ${userProfile.experience_level}`);
      if (userProfile.playing_style) profileInfo.push(`Playing style: ${userProfile.playing_style}`);
      
      // Only add personalization if we have data
      if (profileInfo.length > 0) {
        systemPrompt += `\n\nUSER INFORMATION (use to personalize your advice):\n${profileInfo.join('\n')}`;
      }
    }

    // Format message history for OpenAI chat completion
    const messages = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (messageHistory && messageHistory.length > 0) {
      // Limit context window to prevent token limits
      const recentMessages = messageHistory.slice(-10); // Use only the 10 most recent messages
      recentMessages.forEach(msg => {
        messages.push({
          role: msg.is_from_ai ? "assistant" : "user",
          content: msg.content
        });
      });
    }

    // Add the current message
    messages.push({ role: "user", content: message });

    // Call OpenAI API with retry logic
    let openaiResponse;
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        console.log(`Attempt ${retries + 1}: Sending ${messages.length} messages to OpenAI`);
        openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
        
        if (openaiResponse.ok) break;
        
        const errorData = await openaiResponse.json();
        console.error(`Attempt ${retries + 1} failed:`, errorData);
        
        // If we're rate limited, wait a bit and try again
        if (openaiResponse.status === 429 && retries < maxRetries) {
          const backoff = Math.pow(2, retries) * 1000; // Exponential backoff
          console.log(`Rate limited. Retrying in ${backoff}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoff));
          retries++;
          continue;
        }
        
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      } catch (error) {
        if (retries >= maxRetries) throw error;
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simple delay for network errors
      }
    }

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API final failure after ${retries} retries`);
    }

    const responseData = await openaiResponse.json();
    const aiMessage = responseData.choices[0].message.content;

    // Update conversation title if this is the first message
    if (messageHistory.length === 0) {
      // Generate a more descriptive title (first ~30 chars of the AI response)
      let titleText = aiMessage.split('.')[0];
      if (titleText.length > 30) titleText = titleText.substring(0, 27) + '...';
      
      await supabase
        .from('ai_conversations')
        .update({ title: titleText })
        .eq('id', currentConversationId);
    }

    // Update conversation's updated_at timestamp
    await supabase
      .from('ai_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', currentConversationId);

    // Save AI response to the database
    const { error: saveResponseError } = await supabase
      .from('ai_messages')
      .insert({
        conversation_id: currentConversationId,
        content: aiMessage,
        is_from_ai: true
      });

    if (saveResponseError) throw saveResponseError;

    // Track user interactions for future personalization (placeholder)
    try {
      // In the future, we can analyze the conversation to identify skills, techniques, or topics
      // discussed and store them for personalization
      console.log("Will track conversation insights for future personalization");
    } catch (trackingError) {
      // Don't fail the request if tracking fails
      console.error("Error tracking conversation insights:", trackingError);
    }

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
