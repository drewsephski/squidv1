import { DeepgramClient } from "@deepgram/sdk";

export interface DeepgramSTTConfig {
  model?: string;
  language?: string;
  smart_format?: boolean;
  interim_results?: boolean;
  utterance_end_ms?: number;
  vad_events?: boolean;
  endpointing?: number;
}

export interface TranscriptionResult {
  transcript: string;
  is_final: boolean;
  confidence?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
}

export class DeepgramSTT {
  private client: DeepgramClient;
  private connection: any = null;
  private config: DeepgramSTTConfig;
  private apiKey: string;

  constructor(apiKey: string, config: DeepgramSTTConfig = {}) {
    this.apiKey = apiKey;
    this.client = new DeepgramClient({ apiKey: apiKey });
    this.config = {
      model: "nova-3",
      language: "en",
      smart_format: true,
      interim_results: true,
      utterance_end_ms: 1000,
      vad_events: true,
      endpointing: 300,
      ...config,
    };
  }

  /**
   * Start a live transcription session
   */
  async startLiveTranscription(
    onTranscript: (result: TranscriptionResult) => void,
    onError?: (error: any) => void,
    onSpeechStarted?: (timestamp: number) => void,
    onSpeechEnded?: () => void,
  ): Promise<void> {
    try {
      console.log("Starting Deepgram connection...");

      const connection = await this.client.listen.v1.connect({
        model: this.config.model || "nova-3",
        language: this.config.language || "en",
        smart_format: this.config.smart_format ? "true" : "false",
        interim_results: this.config.interim_results ? "true" : "false",
        utterance_end_ms: this.config.utterance_end_ms,
        vad_events: this.config.vad_events ? "true" : "false",
        endpointing: this.config.endpointing,
        Authorization: `Token ${this.apiKey}`,
      });

      this.connection = connection;

      console.log("Deepgram connection created, setting up event handlers...");

      // Set up event handlers
      this.connection.on("open", () => {
        console.log("Deepgram connection opened");
      });

      // Handle all message types in one handler
      this.connection.on("message", (data: any) => {
        console.log("Deepgram message received:", data); // Debug log

        // Handle transcription results
        if (data.channel && data.channel.alternatives) {
          const result = this.parseTranscriptionResult(data);
          if (result) {
            onTranscript(result);
          }
        }

        // Handle speech started event
        if (data.type === "SpeechStarted") {
          console.log("Speech detected");
          onSpeechStarted?.(Date.now());
        }

        // Handle utterance end
        if (data.type === "UtteranceEnd") {
          console.log("Utterance ended");
          onSpeechEnded?.();
        }
      });

      // Handle errors
      this.connection.on("error", (error: any) => {
        console.error("Deepgram error:", error);
        onError?.(error);
      });

      // Handle connection closed
      this.connection.on("close", () => {
        console.log("Deepgram connection closed");
        this.connection = null;
      });

      // Connect to websocket and wait for it to open
      this.connection.connect();
      await this.connection.waitForOpen();
      console.log("Deepgram connection established and ready");
    } catch (error) {
      console.error("Failed to start Deepgram connection:", error);
      onError?.(error);
      throw error;
    }
  }

  /**
   * Send audio data to Deepgram
   */
  sendAudio(audioData: ArrayBuffer | Blob): void {
    if (this.connection && this.connection.readyState === 1) {
      // WebSocket.OPEN = 1
      this.connection.sendMedia(audioData);
    } else {
      console.warn("No active Deepgram connection or connection not open");
    }
  }

  /**
   * Keep the connection alive
   */
  keepAlive(): void {
    if (this.connection && this.connection.readyState === 1) {
      this.connection.sendKeepAlive({});
    } else {
      console.warn(
        "Cannot send keep alive: no active Deepgram connection or connection not open",
      );
    }
  }

  /**
   * Close the transcription session
   */
  close(): void {
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.connection !== null && this.connection.readyState === 1; // WebSocket.OPEN = 1
  }

  /**
   * Parse Deepgram transcription result
   */
  private parseTranscriptionResult(data: any): TranscriptionResult | null {
    try {
      console.log("Parsing transcription data:", data); // Debug log

      const channel = data.channel;
      if (
        !channel ||
        !channel.alternatives ||
        channel.alternatives.length === 0
      ) {
        return null;
      }

      const alternative = channel.alternatives[0];
      const result = {
        transcript: alternative.transcript || "",
        is_final: data.is_final || false,
        confidence: alternative.confidence,
        words: alternative.words || [],
      };

      console.log("Parsed transcription result:", result); // Debug log
      return result;
    } catch (error) {
      console.error("Error parsing transcription result:", error);
      return null;
    }
  }

  /**
   * Transcribe audio file (non-real-time)
   */
  async transcribeFile(audioBuffer: ArrayBuffer): Promise<TranscriptionResult> {
    try {
      const response = await this.client.listen.v1.media.transcribeFile(
        audioBuffer,
        {
          model: this.config.model,
          language: this.config.language,
          smart_format: this.config.smart_format,
        },
      );

      // The response is wrapped in HttpResponsePromise which has a data property
      const result = (response as any).data.results;

      if (!result || !result.channels || result.channels.length === 0) {
        throw new Error("No transcription results");
      }

      const channel = result.channels[0];
      const alternative = channel.alternatives[0];

      return {
        transcript: alternative.transcript || "",
        is_final: true,
        confidence: alternative.confidence,
        words: alternative.words || [],
      };
    } catch (error) {
      console.error("File transcription error:", error);
      throw error;
    }
  }
}

// Singleton instance for the application
let deepgramSTT: DeepgramSTT | null = null;

export function getDeepgramSTT(apiKey?: string): DeepgramSTT {
  if (!deepgramSTT) {
    const key = apiKey || process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;
    if (!key) {
      throw new Error(
        "Deepgram API key is required. Set NEXT_PUBLIC_DEEPGRAM_API_KEY in your environment.",
      );
    }
    deepgramSTT = new DeepgramSTT(key);
  }
  return deepgramSTT;
}

export function resetDeepgramSTT(): void {
  if (deepgramSTT) {
    deepgramSTT.close();
    deepgramSTT = null;
  }
}
