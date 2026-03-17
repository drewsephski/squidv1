# Voice Chat Debugging Guide

## 🔍 **Complete Debug Setup Added**

I've added extensive debugging logs throughout the entire voice chat pipeline. Now when you test, you'll see exactly what's happening at each step.

## **Debug Logs to Watch:**

### 1. **Deepgram STT Connection:**
- `"Starting Deepgram connection..."`
- `"Deepgram connection created, setting up event handlers..."`
- `"Deepgram connection opened"`
- `"Deepgram message received:"` (with raw data)
- `"Parsed transcription result:"` (with `is_final: true/false`)

### 2. **LLM Processing:**
- `"Processing text with LLM:"` (with your spoken text)
- `"Chat completions request received"`
- `"Session:"` (Found user session or No session)
- `"Request body:"` (full request payload)
- `"Getting model for:"`
- `"Language model:"`
- `"Generating text with messages:"`
- `"Generated response:"`

### 3. **TTS Processing:**
- `"Playing audio response:"` (with AI text)
- `"Generated audio buffer, size:"`
- `"Audio playback completed"`

## **How to Debug:**

1. **Open Browser Dev Tools** → Console tab
2. **Start Voice Chat** (Cmd+K) → Select "Deepgram + Chatterbox"
3. **Click Microphone** and say "Hello world"
4. **Watch the console logs** step by step

## **Common Issues & Solutions:**

### **Issue: "No session found"**
- **Cause**: Missing authentication or session expired
- **Fix**: Ensure you're logged in and session is valid

### **Issue: "Deepgram connection not opening"**
- **Cause**: Missing `NEXT_PUBLIC_DEEPGRAM_API_KEY` or network issues
- **Fix**: Add API key to `.env` and check network/firewall

### **Issue: "No final transcripts"**
- **Cause**: Audio quality, wrong language, or VAD settings
- **Fix**: Check microphone permissions and audio quality

### **Issue: "LLM response not ok"**
- **Cause**: Model provider issues or API problems
- **Fix**: Check OpenRouter API key and model availability

## **Quick Test:**

```bash
# Set your API key
export NEXT_PUBLIC_DEEPGRAM_API_KEY=your_actual_deepgram_key

# Start the app
pnpm dev
```

Now you can see exactly where the voice chat pipeline is failing!
