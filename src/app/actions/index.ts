"use server";

import OpenAI from "openai";

const openaiApi = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const TRANSCRIPTION_MODEL = "whisper-1";
const LANGUAGE = "ja";

export async function transcribeAudio(formData: FormData): Promise<string> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("ファイルが提供されていないか、無効です。");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`ファイルサイズが大きすぎます。${MAX_FILE_SIZE_MB}MB以下のファイルを使用してください。`);
  }

  try {
    const transcription = await openaiApi.audio.transcriptions.create({
      file,
      model: TRANSCRIPTION_MODEL,
      language: LANGUAGE,
    });

    return transcription.text;
  } catch (error) {
    console.error("音声の文字起こし中にエラーが発生しました:", error);
    throw new Error("文字起こしに失敗しました。もう一度お試しください。");
  }
}
