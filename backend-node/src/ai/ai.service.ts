import { Injectable, Logger } from "@nestjs/common";
import OpenAI from "openai";

export interface ExtractionPayload {
  url: string;
  rawTextSample: string;
  contextText: string;
}

export interface AiAnalysisResult {
  category: "ARTICLE" | "VIDEO" | "PRODUCT" | "DEV" | "TOOL" | "RECIPE" | "REPO" | "SOCIAL" | "DOCS";
  intent: "TO_READ" | "TO_BUY" | "CODE_REVIEW" | "TO_WATCH" | "TO_TRY" | "REFERENCE" | "GENERAL";
  summary: string;
  dynamic_tags: string[];
  confidence: number;
}

const SYSTEM_PROMPT = `You are the intelligence engine for "Link Graveyard", a smart bookmark manager.
Analyze the web page content and user context below.
Output ONLY valid JSON matching this exact schema — no markdown, no extra keys:
{
  "category": one of ["ARTICLE","VIDEO","PRODUCT","DEV","TOOL","RECIPE","REPO","SOCIAL","DOCS"],
  "intent":   one of ["TO_READ","TO_BUY","CODE_REVIEW","TO_WATCH","TO_TRY","REFERENCE","GENERAL"],
  "summary":  "2-3 sentence summary of what this page is about",
  "dynamic_tags": ["tag1","tag2"],
  "confidence": 0.0-1.0 float indicating how confident you are in the category/intent
}

Few-shot examples:
URL: https://github.com/user/repo -> category: REPO, intent: CODE_REVIEW, confidence: 0.97
URL: https://www.youtube.com/watch?v=xxx -> category: VIDEO, intent: TO_WATCH, confidence: 0.99
URL: https://docs.nestjs.com/modules -> category: DOCS, intent: REFERENCE, confidence: 0.96
URL: https://www.amazon.com/dp/xxx -> category: PRODUCT, intent: TO_BUY, confidence: 0.95
URL: https://news.ycombinator.com/item -> category: ARTICLE, intent: TO_READ, confidence: 0.88`;

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
      "USER_CONTEXT_NOTE: " + (payload.contextText || "none"),
      "WEBSITE_TEXT_SAMPLE: " + (payload.rawTextSample || "none"),
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
      const parsed = JSON.parse(raw) as AiAnalysisResult;

      // Clamp confidence to [0,1]
      parsed.confidence = Math.min(1, Math.max(0, parsed.confidence ?? 0.5));
      this.logger.log(`AI analysis complete: category=${parsed.category} confidence=${parsed.confidence}`);
      return parsed;
    } catch (err) {
      this.logger.error("AI analysis failed: " + err.message);
      return {
        category: "ARTICLE",
        intent: "GENERAL",
        summary: "Could not generate summary at this time.",
        dynamic_tags: [],
        confidence: 0,
      };
    }
  }
}