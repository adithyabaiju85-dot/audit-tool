import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;

export interface TrueUpItem {
  particulars: string;
  sbu: string;
  approvedArr: number;
  actualPetition: number;
  truedUpCommission: number;
  rejectedAmount: number;
  reason: string;
  isRedFlag: boolean;
}

export interface SectionSummary {
  category: string;
  summary: string;
  reasoning: string[]; // Bullet points with bold keywords
}

export interface AnalysisResult {
  introduction: {
    applicant: string;
    respondent: string;
    financialYear: string;
  };
  operationalPerformance: {
    consumers: string;
    saleOfPower: string;
    distributionLossApproved: string;
    distributionLossActual: string;
  };
  sectionSummaries: SectionSummary[];
  summaryTable: TrueUpItem[];
  overallSummary: {
    totalApproved: number;
    totalActual: number;
    totalTruedUp: number;
    totalRejected: number;
    revenueGapSurplus: number;
    keyObservations: string[];
    finalVerdict: string;
    finalImpact: string; // New: Explanation of what the surplus/gap means for future operations
  };
}

export async function analyzeTrueUpPdf(trueUpBase64: string, arrBase64: string): Promise<AnalysisResult> {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `Act as a Senior KSERC Regulatory Auditor. Your task is to perform a deep-dive analysis of the provided ARR Order and Audited Accounts (KDHPCL 2017-18 context) and generate a complete, comprehensive Truing Up of Accounts Order.

The output must be structured as a formal, authoritative regulatory document. Apply these 'AI-Style' enhancements:

1. Executive Summaries: Start every major section (Power Purchase, Employee Costs, R&M, A&G, Depreciation, Interest, etc.) with a 2-sentence summary of the Commission's final decision.
2. Clean Data Visuals: Ensure the 'Approved', 'Claimed', and 'Trued Up' columns are side-by-side for every financial table.
3. Logic Flow: For 'Reasoning for Disallowance', use Bullet Points and **Bold Keywords** to explain the regulatory basis.
4. Regulatory Law Deep-Dive: For every major decision, explicitly mention the specific Regulation or Law (e.g., "Regulation 61 of KSERC Tariff Regulations 2021") and provide a detailed explanation of what that law mandates and why it applies here.
5. Key Takeaways: Add a 'Final Impact' section explaining what the surplus/gap (e.g., Rs. 74.41 lakh) means for future operations and tariff adjustments.
6. Completeness: Cover all aspects including Distribution Loss calculations, R&M expenses, Interest on Security Deposits, Return on Equity, and Non-tariff income. Do not omit any data points or tables.

Regulatory Logic to Apply:
- Normative Cap: Approved_Cost = Base_Year_Approved * (1 + Inflation_Index).
- Efficiency Penalty: Penalize Power Purchase cost for excess Distribution Loss.
- Interest Check: Disallow interest for unapproved projects or lack of documentation.

Return the result in JSON format matching the provided schema. Be extremely detailed in the 'reasoning' and 'keyObservations' fields to support a long-form report.`;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: trueUpBase64,
            },
          },
          {
            inlineData: {
              mimeType: "application/pdf",
              data: arrBase64,
            },
          },
        ],
      },
    ],
    config: {
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          introduction: {
            type: Type.OBJECT,
            properties: {
              applicant: { type: Type.STRING },
              respondent: { type: Type.STRING },
              financialYear: { type: Type.STRING },
            },
            required: ["applicant", "respondent", "financialYear"],
          },
          operationalPerformance: {
            type: Type.OBJECT,
            properties: {
              consumers: { type: Type.STRING },
              saleOfPower: { type: Type.STRING },
              distributionLossApproved: { type: Type.STRING },
              distributionLossActual: { type: Type.STRING },
            },
            required: ["consumers", "saleOfPower", "distributionLossApproved", "distributionLossActual"],
          },
          sectionSummaries: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                summary: { type: Type.STRING },
                reasoning: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["category", "summary", "reasoning"],
            },
          },
          summaryTable: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                particulars: { type: Type.STRING },
                sbu: { type: Type.STRING },
                approvedArr: { type: Type.NUMBER },
                actualPetition: { type: Type.NUMBER },
                truedUpCommission: { type: Type.NUMBER },
                rejectedAmount: { type: Type.NUMBER },
                reason: { type: Type.STRING },
                isRedFlag: { type: Type.BOOLEAN },
              },
              required: ["particulars", "sbu", "approvedArr", "actualPetition", "truedUpCommission", "rejectedAmount", "reason", "isRedFlag"],
            },
          },
          overallSummary: {
            type: Type.OBJECT,
            properties: {
              totalApproved: { type: Type.NUMBER },
              totalActual: { type: Type.NUMBER },
              totalTruedUp: { type: Type.NUMBER },
              totalRejected: { type: Type.NUMBER },
              revenueGapSurplus: { type: Type.NUMBER },
              keyObservations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              finalVerdict: { type: Type.STRING },
              finalImpact: { type: Type.STRING },
            },
            required: ["totalApproved", "totalActual", "totalTruedUp", "totalRejected", "revenueGapSurplus", "keyObservations", "finalVerdict", "finalImpact"],
          },
        },
        required: ["introduction", "operationalPerformance", "sectionSummaries", "summaryTable", "overallSummary"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response from AI model.");
  }

  try {
    return JSON.parse(text) as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse AI response:", text);
    throw new Error("Failed to parse analysis results.");
  }
}
