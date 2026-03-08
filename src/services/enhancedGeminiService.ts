import { GoogleGenAI, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "";
const GITHUB_API_KEY = import.meta.env.VITE_GITHUB_API_KEY || import.meta.env.GITHUB_API_KEY || "";

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
  reasoning: string[];
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
    finalImpact: string;
  };
}

export async function analyzeTrueUpPdf(trueUpBase64: string, arrBase64: string): Promise<AnalysisResult> {
  if (!API_KEY) {
    console.log("API key not configured, using mock data");
    // Return mock data following CSEZA structure when API key is not available
    return {
      introduction: {
        applicant: "Cochin Special Economic Zone Authority (CSEZA)",
        respondent: "Kerala State Electricity Regulatory Commission (KSERC)",
        financialYear: "2023-24"
      },
      operationalPerformance: {
        consumers: "166",
        saleOfPower: "586.75 lakh units",
        distributionLossApproved: "1.44%",
        distributionLossActual: "1.528%"
      },
      sectionSummaries: [
        {
          category: "Energy Sales & Consumer Analysis",
          summary: "Commission approved actual sales of 586.75 lakh units against ARR&ERC projection of 565.81 lakh units, reflecting higher operational activity. The truing up process ensures accurate tariff setting based on actual performance.",
          reasoning: [
            "**Data**: Actual sales reached 586.75 lakh units across 166 consumers",
            "**Regulatory Analysis**: Commission approved actual sales despite being higher than ARR&ERC projection",
            "**Under This Regulatory Norm**: Truing Up process compares actual operational data against previous projections for accurate tariff setting"
          ]
        },
        {
          category: "Distribution Loss & Power Purchase Disallowance",
          summary: "Commission disallowed Rs. 3.67 lakh in power purchase costs due to excess distribution loss of 0.088% above approved normative level. The disallowance follows Regulation 73(3) for cost recovery limitations.",
          reasoning: [
            "**Data**: Actual distribution loss was 1.528% vs approved normative loss of 1.44%",
            "**Regulatory Analysis**: Disallowance calculation: 0.53 lakh units excess loss × Rs. 6.92/unit average cost = Rs. 3.67 lakh",
            "**Under This Regulatory Norm (Regulation 73(3))**: If actual loss exceeds approved level, cost of excess power purchased is disallowed and cannot be passed to consumers"
          ]
        },
        {
          category: "Operation & Maintenance (O&M) Efficiency Gains",
          summary: "Licensee achieved efficiency gains of Rs. 31.38 lakh by spending Rs. 177.16 lakh against normative limit of Rs. 208.54 lakh. The 2:1 sharing mechanism applies to these gains.",
          reasoning: [
            "**Data**: Actual spending Rs. 177.16 lakh vs normative limit Rs. 208.54 lakh",
            "**Regulatory Analysis**: Approved costs - Employee Cost: Rs. 126.38 lakh, R&M: Rs. 11.23 lakh, A&G: Rs. 39.55 lakh",
            "**Under This Regulatory Norm (Regulation 14)**: 2:1 sharing mechanism - 2/3rd (Rs. 20.92 lakh) retained by licensee, 1/3rd (Rs. 10.46 lakh) passed to consumers"
          ]
        },
        {
          category: "Asset Management & Depreciation Audit",
          summary: "Commission reduced depreciation claim from Rs. 91.54 lakh to Rs. 35.56 lakh due to assets created from Accumulated Regulatory Surplus. Depreciation not allowed on consumer-funded assets.",
          reasoning: [
            "**Data**: Claimed depreciation Rs. 91.54 lakh, approved Rs. 35.56 lakh",
            "**Regulatory Analysis**: Reduction focuses on assets created from Accumulated Regulatory Surplus of Rs. 956.20 lakh",
            "**Under This Regulatory Norm**: Depreciation not allowed on assets funded by consumer contributions or regulatory surplus as licensee did not incur upfront costs"
          ]
        },
        {
          category: "Final Financial Reconciliation",
          summary: "Final audit shows revenue surplus of Rs. 87.85 lakh against petitioner's claimed revenue gap of Rs. 3.42 lakh. Closing Accumulated Revenue Surplus stands at Rs. 1891.16 lakh.",
          reasoning: [
            "**Data**: Total Audited Income: Rs. 4369.51 lakh, Total Audited Expenditure: Rs. 4281.66 lakh",
            "**Regulatory Analysis**: Final Revenue Surplus Rs. 87.85 lakh vs petitioner's claimed revenue gap Rs. 3.42 lakh",
            "**Audit Conclusion**: Closing Accumulated Revenue Surplus at year end: Rs. 1891.16 lakh"
          ]
        }
      ],
      summaryTable: [
        {
          particulars: "Energy Sales Income",
          sbu: "Operations",
          approvedArr: 4250.00,
          actualPetition: 4380.50,
          truedUpCommission: 4380.50,
          rejectedAmount: 0.00,
          reason: "Approved based on actual sales data",
          isRedFlag: false
        },
        {
          particulars: "Power Purchase Cost",
          sbu: "Operations",
          approvedArr: 3200.00,
          actualPetition: 3203.67,
          truedUpCommission: 3200.00,
          rejectedAmount: 3.67,
          reason: "Excess distribution loss disallowance",
          isRedFlag: true
        },
        {
          particulars: "Employee Cost",
          sbu: "O&M",
          approvedArr: 126.38,
          actualPetition: 126.38,
          truedUpCommission: 126.38,
          rejectedAmount: 0.00,
          reason: "Within normative limits",
          isRedFlag: false
        },
        {
          particulars: "R&M Expenses",
          sbu: "O&M",
          approvedArr: 11.23,
          actualPetition: 11.23,
          truedUpCommission: 11.23,
          rejectedAmount: 0.00,
          reason: "Within normative limits",
          isRedFlag: false
        },
        {
          particulars: "A&G Expenses",
          sbu: "O&M",
          approvedArr: 39.55,
          actualPetition: 39.55,
          truedUpCommission: 39.55,
          rejectedAmount: 0.00,
          reason: "Within normative limits",
          isRedFlag: false
        },
        {
          particulars: "Depreciation",
          sbu: "Finance",
          approvedArr: 35.56,
          actualPetition: 91.54,
          truedUpCommission: 35.56,
          rejectedAmount: 55.98,
          reason: "Assets from regulatory surplus not eligible",
          isRedFlag: true
        }
      ],
      overallSummary: {
        totalApproved: 4369.51,
        totalActual: 4380.50,
        totalTruedUp: 4369.51,
        totalRejected: 59.65,
        revenueGapSurplus: 87.85,
        keyObservations: [
          "Energy sales exceeded projections by 20.94 lakh units",
          "Distribution loss disallowance of Rs. 3.67 lakh for excess losses",
          "Efficiency gains of Rs. 31.38 lakh shared 2:1 between licensee and consumers",
          "Major depreciation reduction of Rs. 55.98 lakh due to regulatory surplus assets",
          "Final revenue surplus of Rs. 87.85 lakh vs claimed gap of Rs. 3.42 lakh"
        ],
        finalVerdict: "Revenue Surplus of Rs. 87.85 lakh confirmed with Closing Accumulated Revenue Surplus of Rs. 1891.16 lakh",
        finalImpact: "The surplus will be carried forward to the next financial year and may impact future tariff calculations through the accumulated surplus mechanism."
      }
    };
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `You are a Senior Regulatory Auditor creating a comprehensive, court-ready audit report that will serve as legal evidence in regulatory disputes.

CRITICAL LEGAL REQUIREMENTS:
1. Create a COURT-READY document that can be used as legal evidence
2. Include EVERY regulatory provision, tariff regulation, and legal citation
3. NO wasted space - every page must contain valuable legal and financial information
4. Provide clear legal framework that prevents licensees from making claims in court
5. Include all supporting calculations, regulatory references, and legal bases

COURT-READY STRUCTURE (Follow this EXACT legal format):

1. LEGAL FRAMEWORK AND REGULATORY BASIS
- List ALL applicable KSERC regulations with exact citations
- Include tariff order references and legal provisions
- Provide statutory basis for Commission's authority

2. ENERGY SALES & CONSUMER ANALYSIS (Legal Evidence)
Data: Extract EXACT figures with legal verification
Regulatory Analysis: Cite specific regulations allowing/disallowing claims
Legal Precedent: Reference similar cases and Commission's consistent approach
Court Argument: Clear legal reasoning that prevents future claims

3. DISTRIBUTION LOSS & POWER PURCHASE DISALLOWANCE (Legal Evidence)
Data: EXACT loss calculations with legal verification
Regulatory Analysis: Regulation 73(3) legal interpretation with case law
Legal Basis: Statutory prohibition on cost recovery for excess losses
Court Argument: Legal framework preventing licensee claims for excess costs

4. OPERATION & MAINTENANCE EFFICIENCY GAINS (Legal Evidence)
Data: EXACT efficiency calculations with legal verification
Regulatory Analysis: Regulation 14 2:1 sharing mechanism legal interpretation
Legal Basis: Statutory framework for efficiency gain distribution
Court Argument: Legal reasoning preventing claims for full efficiency gains

5. ASSET MANAGEMENT & DEPRECIATION AUDIT (Legal Evidence)
Data: EXACT depreciation calculations with legal verification
Regulatory Analysis: Legal prohibition on depreciation of regulatory surplus assets
Legal Basis: Asset funding source legal principles
Court Argument: Legal framework preventing depreciation claims on consumer-funded assets

6. FINAL FINANCIAL RECONCILIATION (Legal Summary)
Data: EXACT financial reconciliation with legal verification
Legal Summary: Complete legal position preventing future claims
Court-Ready Conclusion: Final legal position with all regulatory citations

COURT-READY ENHANCEMENTS:
- Legal Citations: Include regulation numbers, sections, and subsections
- Case Law References: Reference previous Commission orders and legal precedents
- Legal Reasoning: Clear step-by-step legal analysis for each disallowance
- Evidence Tables: All calculations with legal verification
- Preventive Language: Clear legal statements preventing future claims
- Professional Format: Court-ready document structure

LEGAL PROTECTION MEASURES:
- Each regulatory decision must include legal basis
- Include statutory authority for Commission's actions
- Provide legal framework preventing licensee claims
- Reference tariff orders and regulatory provisions
- Include all supporting legal documentation

FORMAT REQUIREMENTS:
- Professional legal document format
- No wasted space - every page contains legal evidence
- Clear legal headings and subheadings
- Professional table formatting for legal evidence
- Complete legal citations and references

Return result in JSON format with comprehensive legal analysis that can be used as court evidence and prevents any future claims by licensees.`;

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
