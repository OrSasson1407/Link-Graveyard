import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
    this.logger.log('Transcribing audio: ' + filename);
    try {
      const uint8Array = new Uint8Array(audioBuffer);
      const blob = new Blob([uint8Array], { type: 'audio/webm' });
      const file = new File([blob], filename, { type: 'audio/webm' });
      const transcription = await this.openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
      });
      return transcription.text;
    } catch (err) {
      this.logger.error('Audio transcription failed: ' + err.message);
      throw err;
    }
  }

  async extractIntentFromTranscript(transcript: string): Promise<string> {
    const systemContent = [
      "Extract the user's intent from this voice note transcript.",
      'Return one of: TO_READ, TO_BUY, CODE_REVIEW, GENERAL.',
      'Return only the intent string.',
    ].join(' ');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: transcript },
      ],
      max_tokens: 20,
    });
    return response.choices[0].message.content.trim();
  }
}
