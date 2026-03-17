export interface ChatterboxTTSConfig {
  baseUrl?: string;
  defaultVoice?: string;
  defaultSpeed?: number;
}

export interface VoiceProfile {
  voiceId: string;
  voiceName: string;
  createdAt: Date;
  audioSize?: number;
}

export interface TTSRequest {
  text: string;
  voiceId?: string;
  speed?: number;
  emotion?: string;
}

export class ChatterboxTTS {
  private config: ChatterboxTTSConfig;

  constructor(config: ChatterboxTTSConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || "/api/tts/chatterbox",
      defaultVoice: "default",
      defaultSpeed: 1.0,
      ...config,
    };
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(request: TTSRequest): Promise<ArrayBuffer> {
    try {
      const baseUrl = this.config.baseUrl;
      if (!baseUrl) {
        throw new Error("Base URL is required");
      }

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: request.text,
          voiceId: request.voiceId || this.config.defaultVoice,
          speed: request.speed || this.config.defaultSpeed,
          emotion: request.emotion,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate speech");
      }

      return response.arrayBuffer();
    } catch (error) {
      console.error("TTS generation error:", error);
      throw error;
    }
  }

  /**
   * Create a voice profile from audio (voice cloning)
   */
  async createVoiceProfile(
    audioFile: File,
    voiceName: string,
  ): Promise<VoiceProfile> {
    try {
      const baseUrl = this.config.baseUrl;
      if (!baseUrl) {
        throw new Error("Base URL is required");
      }

      const formData = new FormData();
      formData.append("audio", audioFile);
      formData.append("voiceName", voiceName);

      const response = await fetch(baseUrl, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create voice profile");
      }

      const result = await response.json();
      return {
        voiceId: result.voiceId,
        voiceName: result.voiceName,
        createdAt: new Date(),
        audioSize: audioFile.size,
      };
    } catch (error) {
      console.error("Voice profile creation error:", error);
      throw error;
    }
  }

  /**
   * Get available voice profiles (placeholder implementation)
   */
  async getVoiceProfiles(): Promise<VoiceProfile[]> {
    // This would typically fetch from a database or API
    // For now, return empty array or placeholder data
    return [];
  }

  /**
   * Delete a voice profile
   */
  async deleteVoiceProfile(voiceId: string): Promise<void> {
    // Placeholder implementation
    console.log("Delete voice profile:", voiceId);
  }

  /**
   * Convert ArrayBuffer to AudioBuffer for Web Audio API
   */
  async arrayBufferToAudioBuffer(
    arrayBuffer: ArrayBuffer,
  ): Promise<AudioBuffer> {
    try {
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      return await audioContext.decodeAudioData(arrayBuffer.slice(0));
    } catch (error) {
      console.error("Audio buffer conversion error:", error);
      throw error;
    }
  }

  /**
   * Play audio directly from ArrayBuffer
   */
  async playAudio(arrayBuffer: ArrayBuffer): Promise<void> {
    try {
      const audioBuffer = await this.arrayBufferToAudioBuffer(arrayBuffer);
      const audioContext = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();

      return new Promise((resolve) => {
        source.onended = () => resolve();
      });
    } catch (error) {
      console.error("Audio playback error:", error);
      throw error;
    }
  }

  /**
   * Create a blob URL for audio playback
   */
  createAudioURL(arrayBuffer: ArrayBuffer): string {
    const blob = new Blob([arrayBuffer], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }

  /**
   * Revoke an audio URL to free memory
   */
  revokeAudioURL(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Estimate audio duration from text
   */
  estimateDuration(text: string, speed: number = 1.0): number {
    // Rough estimate: average reading speed is 200 words per minute
    const wordsPerMinute = 200;
    const words = text.split(/\s+/).length;
    const minutes = words / wordsPerMinute;
    return (minutes * 60) / speed; // Return in seconds
  }
}

// Singleton instance for the application
let chatterboxTTS: ChatterboxTTS | null = null;

export function getChatterboxTTS(config?: ChatterboxTTSConfig): ChatterboxTTS {
  if (!chatterboxTTS) {
    chatterboxTTS = new ChatterboxTTS(config);
  }
  return chatterboxTTS;
}

export function resetChatterboxTTS(): void {
  chatterboxTTS = null;
}

// Utility functions for voice cloning
export function recordAudio(maxDuration: number = 30): Promise<Blob> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          resolve(audioBlob);
        };

        mediaRecorder.onerror = (_event) => {
          reject(new Error("Recording failed"));
        };

        // Start recording
        mediaRecorder.start();

        // Stop recording after maxDuration
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, maxDuration * 1000);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export function validateAudioFile(file: File): boolean {
  // Check file type
  const validTypes = ["audio/wav", "audio/mp3", "audio/m4a", "audio/ogg"];
  if (!validTypes.includes(file.type)) {
    return false;
  }

  // Check file size (max 10MB for voice cloning)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return false;
  }

  // Check duration (should be between 5-60 seconds for good voice cloning)
  // This would need to be checked after file upload/processing
  return true;
}
