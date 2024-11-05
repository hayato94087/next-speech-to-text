"use client";

import { useCallback, useRef, useState, type FC } from "react";

import { transcribeAudio } from "@/app/actions";

export const maxDuration = 30;

export const Recording: FC = () => {
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md sm:min-w-[360px] md:min-w-[480px] lg:min-w-[640px] bg-white rounded-lg shadow-xl p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">文字起こし内容:</h2>
        <p className="bg-gray-100 p-3 rounded">
          {isTranscribing ? (
            <span className="text-gray-500 italic">文字起こし中...</span>
          ) : transcription ? (
            transcription
          ) : (
            <span className="text-gray-500 italic">
              まだ文字起こしされていません
            </span>
          )}
        </p>
      </div>
      {error && (
        <div className="w-full max-w-md mb-8 p-3 bg-red-100 text-red-700 rounded text-xs">
          {error}
        </div>
      )}
      <form className="w-full max-w-md">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`w-[200px] rounded-full px-6 py-3 text-lg font-semibold text-white disabled:opacity-50 transition-colors ${
              isRecording
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isRecording
              ? "発話終了"
              : isTranscribing
              ? "文字起こし中..."
              : "発話開始"}
          </button>
        </div>
      </form>
    </div>
  );
};