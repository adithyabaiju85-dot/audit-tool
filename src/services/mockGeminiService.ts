// Mock analysis service for testing without API key
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
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Mock analysis data
  return {
    introduction: {
      applicant: "Kerala State Electricity Board (KSEB)",
      respondent: "Kerala State Electricity Regulatory Commission (KSERC)",
      financialYear: "2023-2024"
    },
    operationalPerformance: {
      consumers: "1,23,45,678",
      saleOfPower: "24,567.89 MU",
      distributionLossApproved: "18.5%",
      distributionLossActual: "19.2%"
    },
    sectionSummaries: [
      {
        category: "Power Purchase Cost",
        summary: "Commission approved power purchase cost of Rs. 1,234.56 Cr after disallowing excess claims of Rs. 45.67 Cr due to higher distribution losses.",
        reasoning: [
          "**Regulation 45**: Power purchase costs trued up based on actual energy consumption",
          "**Normative Loss**: Actual loss of 19.2% exceeds approved 18.5%",
          "**Penalty Applied**: 0.7% excess loss results in disallowance as per tariff order"
        ]
      },
      {
        category: "Employee Cost",
        summary: "Employee costs approved at Rs. 234.56 Cr, with partial disallowance of Rs. 12.34 Cr for exceeding normative limits.",
        reasoning: [
          "**Regulation 61**: Employee costs subject to normative caps",
          "**Excess Staff**: 15% increase over approved staffing levels",
          "**Prior Approval**: No approval obtained for additional recruitment"
        ]
      },
      {
        category: "R&M Expenses",
        summary: "Repair & Maintenance expenses approved at Rs. 89.76 Cr, with Rs. 8.90 Cr disallowed for non-compliance with normative standards.",
        reasoning: [
          "**Regulation 58**: R&M expenses linked to GFA",
          "**Normative Cap**: Expenses exceed 1.5% of GFA limit",
          "**Documentation**: Insufficient documentation for major repairs"
        ]
      }
    ],
    summaryTable: [
      {
        particulars: "Power Purchase Cost",
        sbu: "Generation",
        approvedArr: 1234.56,
        actualPetition: 1280.23,
        truedUpCommission: 1234.56,
        rejectedAmount: 45.67,
        reason: "Excess distribution loss beyond approved limit",
        isRedFlag: true
      },
      {
        particulars: "Employee Cost",
        sbu: "Administrative",
        approvedArr: 234.56,
        actualPetition: 246.90,
        truedUpCommission: 234.56,
        rejectedAmount: 12.34,
        reason: "Exceeds normative employee cost limits",
        isRedFlag: true
      },
      {
        particulars: "R&M Expenses",
        sbu: "Distribution",
        approvedArr: 89.76,
        actualPetition: 98.66,
        truedUpCommission: 89.76,
        rejectedAmount: 8.90,
        reason: "Exceeds normative R&M limits",
        isRedFlag: false
      },
      {
        particulars: "A&G Expenses",
        sbu: "Administrative",
        approvedArr: 67.89,
        actualPetition: 67.89,
        truedUpCommission: 67.89,
        rejectedAmount: 0.00,
        reason: "Within approved limits",
        isRedFlag: false
      },
      {
        particulars: "Depreciation",
        sbu: "Generation",
        approvedArr: 145.67,
        actualPetition: 145.67,
        truedUpCommission: 145.67,
        rejectedAmount: 0.00,
        reason: "As per approved rates",
        isRedFlag: false
      }
    ],
    overallSummary: {
      totalApproved: 1772.44,
      totalActual: 1839.35,
      totalTruedUp: 1772.44,
      totalRejected: 66.91,
      revenueGapSurplus: -66.91,
      keyObservations: [
        "Total disallowance of Rs. 66.91 Cr due to regulatory non-compliance",
        "Major disallowances in Power Purchase (45.67 Cr) and Employee Costs (12.34 Cr)",
        "Distribution loss at 19.2% exceeds approved 18.5%",
        "Need for better cost control and documentation",
        "Recommendation: Implement stricter monitoring mechanisms"
      ],
      finalVerdict: "Revenue Gap of Rs. 66.91 Cr to be recovered through tariff adjustment",
      finalImpact: "The revenue gap will impact future tariff calculations and necessitates cost optimization measures for the next financial year."
    }
  };
}
