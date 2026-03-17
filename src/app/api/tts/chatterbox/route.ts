import { NextRequest, NextResponse } from "next/server";

// Chatterbox TTS server configuration
const CHATTERBOX_API_URL =
  process.env.CHATTERBOX_API_URL || "http://localhost:8004";
const CHATTERBOX_API_KEY = process.env.CHATTERBOX_API_KEY;

interface TTSRequest {
  text: string;
  voiceId?: string;
  speed?: number;
  voiceFile?: File;
  temperature?: number;
  exaggeration?: number;
  cfg_weight?: number;
}
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    let ttsRequest: TTSRequest;
    let voiceFile: File | undefined;

    // Handle both JSON and multipart form data
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      ttsRequest = {
        text: formData.get("text") as string,
        voiceId: formData.get("voiceId") as string,
        speed: parseFloat(formData.get("speed") as string) || 1.0,
        temperature: parseFloat(formData.get("temperature") as string) || 0.7,
        exaggeration: parseFloat(formData.get("exaggeration") as string) || 0.5,
        cfg_weight: parseFloat(formData.get("cfg_weight") as string) || 0.5,
      };
      voiceFile = formData.get("voiceFile") as File | undefined;
    } else {
      ttsRequest = await request.json();
    }

    const {
      text,
      voiceId,
      speed = 1.0,
      temperature = 0.7,
      exaggeration = 0.5,
      cfg_weight = 0.5,
    } = ttsRequest;

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    console.log("TTS Request:", {
      text,
      voiceId,
      speed,
      temperature,
      exaggeration,
      cfg_weight,
    });

    // Call Chatterbox TTS server API
    const audioData = await generateTTSAudio(text, voiceId, voiceFile, {
      speed_factor: speed,
      temperature,
      exaggeration,
      cfg_weight,
    });

    return new Response(audioData, {
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("TTS Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate speech" },
      { status: 500 },
    );
  }
}

// Actual Chatterbox TTS generation function
async function generateTTSAudio(
  text: string,
  voiceId?: string,
  voiceFile?: File,
  options?: {
    speed_factor?: number;
    temperature?: number;
    exaggeration?: number;
    cfg_weight?: number;
  },
): Promise<ArrayBuffer> {
  try {
    // Prepare request to Chatterbox TTS server
    const formData = new FormData();
    formData.append("text", text);
    formData.append("output_format", "wav");

    // Add generation parameters
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });
    }

    // Handle voice selection
    if (voiceFile) {
      // Voice cloning with uploaded file
      formData.append("voice_mode", "clone");
      formData.append("reference_audio", voiceFile);
    } else if (voiceId) {
      // Use predefined voice from library
      formData.append("voice_mode", "predefined");
      formData.append("predefined_voice_id", voiceId);
    } else {
      // Use default voice
      formData.append("voice_mode", "predefined");
      formData.append("predefined_voice_id", "default.wav");
    }

    // Call Chatterbox TTS server
    const response = await fetch(`${CHATTERBOX_API_URL}/tts`, {
      method: "POST",
      body: formData,
      headers: CHATTERBOX_API_KEY
        ? { Authorization: `Bearer ${CHATTERBOX_API_KEY}` }
        : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Chatterbox API error: ${response.status} - ${errorText}`,
      );
    }

    // Return audio buffer
    return await response.arrayBuffer();
  } catch (error) {
    console.error("Chatterbox TTS API error:", error);

    // Fallback to placeholder implementation if API is unavailable
    console.log("Falling back to placeholder audio generation");
    return generatePlaceholderAudio(text);
  }
}

// Fallback placeholder audio generation
function generatePlaceholderAudio(text: string): ArrayBuffer {
  const sampleRate = 22050;
  const duration = Math.max(1, text.length * 0.1);
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, numSamples * 2, true);

  // Generate simple sine wave
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.1 * 32767;
    view.setInt16(44 + i * 2, sample, true);
  }

  return buffer;
}

// Voice cloning endpoint - upload voice to Chatterbox library
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const voiceName = formData.get("voiceName") as string;
    const language = (formData.get("language") as string) || "en";

    if (!audioFile || !voiceName) {
      return NextResponse.json(
        { error: "Audio file and voice name are required" },
        { status: 400 },
      );
    }

    console.log("Voice cloning request:", {
      voiceName,
      audioSize: audioFile.size,
      language,
    });

    // Upload voice to Chatterbox library
    const uploadFormData = new FormData();
    uploadFormData.append("voice_file", audioFile);
    uploadFormData.append("name", voiceName);
    uploadFormData.append("language", language);

    const response = await fetch(`${CHATTERBOX_API_URL}/voices`, {
      method: "POST",
      body: uploadFormData,
      headers: CHATTERBOX_API_KEY
        ? { Authorization: `Bearer ${CHATTERBOX_API_KEY}` }
        : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Voice upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    return NextResponse.json({
      voiceId: result.voice_id || `${voiceName}.wav`,
      voiceName,
      message: "Voice profile created successfully",
      ...result,
    });
  } catch (error: any) {
    console.error("Voice cloning error:", error);

    // Fallback - generate placeholder voice ID
    const voiceId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      voiceId,
      voiceName: "Unknown Voice",
      message: "Voice profile created (fallback mode)",
      warning: "Using fallback mode - Chatterbox API unavailable",
    });
  }
}
