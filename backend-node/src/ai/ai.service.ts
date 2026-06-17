import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";

export interface ExtractionPayload {
  url: string;
  rawTextSample: string;
  contextText: string;
}

export interface AiAnalysisResult {
  category: "ARTICLE" | "VIDEO" | "PRODUCT" | "DEV";
  intent: "TO_READ" | "TO_BUY" | "CODE_REVIEW" | "GENERAL";
  summary: string;
  dynamic_tags: string[];
}

const SYSTEM_PROMPT = [
  'You are the intelligence engine for "Link Graveyard".',
  "Analyze the following web page content and user context.",
  "Output strictly valid JSON with the following schema:",
  "{",
  '  "category": "ARTICLE" | "VIDEO" | "PRODUCT" | "DEV",',
  '  "intent": "TO_READ" | "TO_BUY" | "CODE_REVIEW" | "GENERAL",',
  '  "summary": "A concise 2-3 sentence summary of the content.",',
  '  "dynamic_tags": ["tag1", "tag2"]',
  "}",
].join("\n");

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async analyzeLink(payload: ExtractionPayload): Promise<AiAnalysisResult> {
    this.logger.log("Analyzing link: " + payload.url);

    const userContent = [
      "URL: " + payload.url,
      "USER_CONTEXT_NOTE: " + payload.contextText,
      "WEBSITE_TEXT_SAMPLE: " + payload.rawTextSample,
    ].join("\n");

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const raw = response.choices[0].message.content;
      this.logger.log("AI analysis complete for " + payload.url);
      return JSON.parse(raw) as AiAnalysisResult;
    } catch (err) {
      this.logger.error("AI analysis failed: " + err.message);
      return {
        category: "ARTICLE",
        intent: "GENERAL",
        summary: "Could not generate summary at this time.",
        dynamic_tags: [],
      };
    }
  }
}
