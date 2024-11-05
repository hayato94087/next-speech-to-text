import { useState, useRef, useCallback } from "react";
import { transcribeAudio } from "@/app/actions";

export const useVoiceRecognition = () => {
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleTranscription = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "audio.webm");
      const transcriptionResult = await transcribeAudio(formData);
      setTranscription(transcriptionResult);
    } catch (error) {
      console.error("文字起こし中にエラーが発生しました:", error);
      setError("文字起こしに失敗しました。もう一度お試しください。");
      setTranscription("");
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscription("");
      const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(newStream);
      const mediaRecorder = new MediaRecorder(newStream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        handleTranscription(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("録音の開始中にエラーが発生しました:", error);
      setError("録音を開始できませんでした。マイクへのアクセスを確認してください。");
      setIsRecording(false);
    }
  }, [handleTranscription]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && stream) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  return {
    transcription,
    isRecording,
    isTranscribing,
    error,
    startRecording,
    stopRecording,
  };
};