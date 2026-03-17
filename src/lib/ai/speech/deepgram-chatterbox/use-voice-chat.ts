"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  UIMessageWithCompleted,
  VoiceChatOptions,
  VoiceChatSession,
} from "../index";
import { generateUUID } from "lib/utils";
import { TextPart, ToolUIPart } from "ai";
import { getDeepgramSTT, TranscriptionResult } from "../deepgram-stt";
import { getChatterboxTTS } from "../chatterbox-tts";

const CHATTERBOX_VOICES = {
  Default: "default",
  Male: "male",
  Female: "female",
  Custom: "custom",
} as const;

type Content =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool-invocation";
      name: string;
      arguments: any;
      state: "call" | "result";
      toolCallId: string;
      result?: any;
    };

const createUIPart = (content: Content): TextPart | ToolUIPart => {
  if (content.type == "tool-invocation") {
    const part: ToolUIPart = {
      type: `tool-${content.name}`,
      input: content.arguments,
      state: "output-available",
      toolCallId: content.toolCallId,
      output: content.result,
    };
    return part;
  }
  return {
    type: "text",
    text: content.text,
  };
};

const createUIMessage = (m: {
  id?: string;
  role: "user" | "assistant";
  content: Content;
  completed?: boolean;
}): UIMessageWithCompleted => {
  const id = m.id ?? generateUUID();
  return {
    id,
    role: m.role,
    parts: [createUIPart(m.content)],
    completed: m.completed ?? false,
  };
};

export function useDeepgramChatterboxVoiceChat(
  props?: VoiceChatOptions,
): VoiceChatSession {
  const { model = "openrouter/free", voice = CHATTERBOX_VOICES.Default } =
    props || {};

  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeaking] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState<UIMessageWithCompleted[]>([]);
  const audioStream = useRef<MediaStream | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const currentTranscript = useRef<string>("");
  const isProcessing = useRef<boolean>(false);

  const startListening = useCallback(async () => {
    try {
      // Initialize services
      const deepgramSTT = getDeepgramSTT();

      if (!audioStream.current) {
        audioStream.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      }

      if (!mediaRecorder.current) {
        mediaRecorder.current = new MediaRecorder(audioStream.current);

        mediaRecorder.current.ondataavailable = async (event) => {
          if (event.data.size > 0 && deepgramSTT.isConnected()) {
            deepgramSTT.sendAudio(await event.data.arrayBuffer());
          }
        };

        mediaRecorder.current.start(250); // Send chunks every 250ms
      }

      setIsListening(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop();
      }
      if (audioStream.current) {
        audioStream.current.getTracks().forEach((track) => track.stop());
        audioStream.current = null;
      }
      setIsListening(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, []);

  const processTextWithLLM = useCallback(
    async (text: string): Promise<string> => {
      try {
        console.log("Processing text with LLM:", text); // Debug log

        // Create a simple text completion request
        const response = await fetch("/api/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: text,
              },
            ],
            model: model,
            stream: false,
          }),
        });

        if (!response.ok) {
          console.error(
            "LLM response not ok:",
            response.status,
            response.statusText,
          ); // Debug log
          throw new Error("Failed to get LLM response");
        }

        const result = await response.json();
        console.log("LLM response:", result); // Debug log

        return (
          result.choices[0]?.message?.content || "I understand what you said."
        );
      } catch (error) {
        console.error("LLM processing error:", error);
        return "I'm having trouble processing that right now.";
      }
    },
    [model],
  );

  const playAudioResponse = useCallback(
    async (text: string) => {
      try {
        console.log("Playing audio response:", text); // Debug log

        setIsAssistantSpeaking(true);

        // Initialize TTS service
        const chatterboxTTS = getChatterboxTTS();

        // Generate speech with Chatterbox
        const audioBuffer = await chatterboxTTS.generateSpeech({
          text,
          voiceId: voice,
        });

        console.log("Generated audio buffer, size:", audioBuffer.byteLength); // Debug log

        // Play the audio
        await chatterboxTTS.playAudio(audioBuffer);

        console.log("Audio playback completed"); // Debug log
      } catch (error) {
        console.error("Audio playback error:", error);
        // Fallback: just log the text
        console.log("Assistant response:", text);
      } finally {
        setIsAssistantSpeaking(false);
      }
    },
    [voice],
  );

  const handleTranscript = useCallback(
    async (result: TranscriptionResult) => {
      if (!result.is_final) {
        // Update interim transcript
        currentTranscript.current = result.transcript;
        return;
      }

      if (isProcessing.current) {
        return; // Skip if already processing
      }

      const finalTranscript = result.transcript.trim();
      if (!finalTranscript) {
        return;
      }

      isProcessing.current = true;

      try {
        // Add user message
        const userMessage = createUIMessage({
          role: "user",
          content: {
            type: "text",
            text: finalTranscript,
          },
          completed: true,
        });

        setMessages((prev) => [...prev, userMessage]);

        // Process with LLM
        const response = await processTextWithLLM(finalTranscript);

        // Add assistant message
        const assistantMessage = createUIMessage({
          role: "assistant",
          content: {
            type: "text",
            text: response,
          },
          completed: true,
        });

        setMessages((prev) => [...prev, assistantMessage]);

        // Play audio response
        await playAudioResponse(response);

        currentTranscript.current = "";
      } catch (error) {
        console.error("Processing error:", error);
        setError(error instanceof Error ? error : new Error(String(error)));
      } finally {
        isProcessing.current = false;
      }
    },
    [processTextWithLLM, playAudioResponse],
  );

  const start = useCallback(async () => {
    if (isActive || isLoading) return;

    setIsLoading(true);
    setError(null);
    setMessages([]);

    try {
      // Initialize services
      const deepgramSTT = getDeepgramSTT();

      // Start Deepgram connection
      await deepgramSTT.startLiveTranscription(
        handleTranscript,
        (error) => setError(error),
        () => setIsUserSpeaking(true),
        () => setIsUserSpeaking(false),
      );

      // Start listening
      await startListening();

      setIsActive(true);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsActive(false);
      setIsLoading(false);
    }
  }, [isActive, isLoading, handleTranscript, startListening]);

  const stop = useCallback(async () => {
    try {
      // Stop Deepgram connection
      const deepgramSTT = getDeepgramSTT();
      deepgramSTT.close();

      // Stop listening
      await stopListening();

      setIsActive(false);
      setIsListening(false);
      setIsUserSpeaking(false);
      setIsAssistantSpeaking(false);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isActive,
    isUserSpeaking,
    isAssistantSpeaking,
    isListening,
    isLoading,
    error,
    messages,
    start,
    stop,
    startListening,
    stopListening,
  };
}
