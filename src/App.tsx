import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  FileText, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  BarChart3, 
  Table as TableIcon, 
  FileSearch,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search,
  Flag,
  LayoutDashboard,
  PieChart as PieChartIcon,
  Info,
  X,
  ExternalLink,
  Lock,
  User,
  Download,
  Scale,
  ShieldCheck,
  AlertTriangle,
  History,
  BookOpen,
  Clock,
  MoreHorizontal,
  Printer,
  Share2,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { analyzeTrueUpPdf, AnalysisResult, TrueUpItem } from './services/enhancedGeminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#8B0000', '#D4AF37', '#006400', '#3b82f6', '#8b5cf6'];

const REGULATORY_NORMS = [
  {
    category: "Employee Cost",
    norm: "Regulation 61 of KSERC Tariff Regulations, 2021",
    detail: "Employee costs are trued up based on normative limits. Any excess over normative levels is disallowed unless prior approval for additional recruitment is obtained."
  },
  {
    category: "R&M Expenses",
    norm: "Regulation 58 of KSERC Tariff Regulations, 2021",
    detail: "Repair and Maintenance expenses are allowed as per normative levels linked to the opening GFA (Gross Fixed Assets)."
  },
  {
    category: "A&G Expenses",
    norm: "Regulation 59 of KSERC Tariff Regulations, 2021",
    detail: "Administrative and General expenses are trued up based on inflation-indexed normative levels."
  },
  {
    category: "Interest & Finance Charges",
    norm: "Regulation 26 of KSERC Tariff Regulations, 2021",
    detail: "Interest on long-term loans is allowed on the actual loan amount or normative loan (70% of capital cost), whichever is lower."
  },
  {
    category: "Depreciation",
    norm: "Regulation 27 of KSERC Tariff Regulations, 2021",
    detail: "Depreciation is calculated on the GFA approved by the Commission, excluding assets funded through consumer contribution or grants."
  }
];

const Logo = () => (
  <div className="flex flex-col gap-1 group cursor-pointer">
    <div className="flex items-center gap-2">
      <div className="w-1 h-8 bg-kerala-maroon rounded-full" />
      <div className="flex flex-col">
        <span className="text-sm font-bold tracking-tight leading-tight text-kerala-maroon dark:text-white font-serif italic">RAJADHANI</span>
        <span className="text-[10px] font-medium text-slate-500 dark:text-white/40 uppercase tracking-widest">Institute of Engineering & Tech</span>
      </div>
    </div>
    <div className="flex flex-col pl-3 border-l border-slate-300 dark:border-white/10 mt-1">
      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight tracking-tight">KSERC Audit Portal</span>
      <span className="text-[8px] font-mono text-kerala-maroon dark:text-kerala-gold uppercase tracking-[0.2em]">Powered by Rajadhani Institute of Engineering and Technology</span>
    </div>
  </div>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const [theme, setTheme] = useState<'dark'>('dark');
  const [history, setHistory] = useState<{id: string, name: string, date: string, result: AnalysisResult}[]>([]);
  const [isNormsOpen, setIsNormsOpen] = useState(false);

  const [trueUpFile, setTrueUpFile] = useState<File | null>(null);
  const [arrFile, setArrFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'datagrid' | 'report'>('dashboard');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportConfig, setExportConfig] = useState({
    filename: 'KSERC_Audit_Report',
    format: 'pdf' as 'pdf' | 'csv' | 'json'
  });
  
  const [sbuFilter, setSbuFilter] = useState<string>('All');
  const [redFlagOnly, setRedFlagOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleTheme = () => {
    // Theme is now fixed to dark mode
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginData.username === 'admin' && loginData.password === 'admin') {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid Official ID or Security Key');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
    setResult(null);
    setTrueUpFile(null);
    setArrFile(null);
    setError(null);
  };

  const onDropTrueUp = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setTrueUpFile(acceptedFiles[0]);
      setError(null);
      setResult(null);
    }
  }, []);

  const onDropArr = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setArrFile(acceptedFiles[0]);
      setError(null);
      setResult(null);
    }
  }, []);

  const trueUpDropzone = useDropzone({
    onDrop: onDropTrueUp,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const arrDropzone = useDropzone({
    onDrop: onDropArr,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false
  });

  const handleAnalyze = async () => {
    if (!trueUpFile || !arrFile) {
      setError("Please upload both True-Up Order and ARR Order files.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const readFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
        });
      };

      const [trueUpBase64, arrBase64] = await Promise.all([
        readFile(trueUpFile),
        readFile(arrFile)
      ]);

      const analysisResult = await analyzeTrueUpPdf(trueUpBase64, arrBase64);
      setResult(analysisResult);
      
      setHistory(prev => [{
        id: Math.random().toString(36).substr(2, 9),
        name: `Audit: ${trueUpFile.name}`,
        date: new Date().toLocaleString(),
        result: analysisResult
      }, ...prev]);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = () => {
    if (!result) return;

    const { filename, format } = exportConfig;
    const data = result.summaryTable;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.json`;
      link.click();
    } else if (format === 'csv') {
      const headers = ['Particulars', 'SBU', 'Approved ARR', 'Claimed Petition', 'Trued Up Commission', 'Rejected Amount', 'Audit Reason'];
      const rows = data.map(item => [
        item.particulars,
        item.sbu,
        item.approvedArr,
        item.actualPetition,
        item.truedUpCommission,
        item.rejectedAmount,
        item.reason
      ]);
      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.csv`;
      link.click();
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      let pageNumber = 1;
      
      // Helper for page numbering
      const addPageNumber = (pageNum: number) => {
        doc.setFontSize(10);
        doc.setTextColor(0);
        doc.setFont('times', 'normal');
        doc.text(pageNum.toString(), 105, 10, { align: 'center' });
      };

      // Page 1: Legal Framework and Regulatory Basis
      addPageNumber(pageNumber++);
      
      // Court-ready color scheme
      const legalColor: [number, number, number] = [0, 51, 102]; // Dark blue for legal authority
      const evidenceColor: [number, number, number] = [128, 0, 0]; // Dark red for evidence
      const textColor: [number, number, number] = [0, 0, 0]; // Black for legal documents
      const tableBg: [number, number, number] = [245, 245, 250]; // Light for legal tables
      
      // Legal Header
      doc.setTextColor(...legalColor);
      doc.setFontSize(16);
      doc.setFont('times', 'bold');
      doc.text('KERALA STATE ELECTRICITY REGULATORY COMMISSION', 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text('THIRUVANANTHAPURAM', 105, 22, { align: 'center' });
      
      doc.setTextColor(...textColor);
      doc.setFontSize(11);
      doc.text(`Petition No: OP ${Math.floor(Math.random() * 100)} / 2024`, 105, 30, { align: 'center' });
      doc.text('IN THE MATTER OF: Truing Up of Accounts Order', 105, 37, { align: 'center' });
      
      // Legal Authority Section
      let currentY = 50;
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.setFontSize(14);
      doc.text('LEGAL FRAMEWORK AND REGULATORY BASIS', 105, currentY, { align: 'center' });
      currentY += 15;
      
      // Legal Authority Table
      autoTable(doc, {
        startY: currentY,
        head: [['Legal Authority', 'Regulation', 'Section', 'Applicability']],
        body: [
          ['KSERC Act, 1999', 'Section 15', 'Power to determine tariffs', 'Primary authority'],
          ['KSERC Regulations, 2021', 'Regulation 73(3)', 'Distribution loss limits', 'Cost recovery restrictions'],
          ['KSERC Regulations, 2021', 'Regulation 14', 'Efficiency gains sharing', '2:1 mechanism'],
          ['KSERC Regulations, 2021', 'Regulation 61', 'Employee cost norms', 'Normative caps'],
          ['KSERC Regulations, 2021', 'Regulation 58', 'R&M expenses', 'GFA linkage'],
          ['KSERC Regulations, 2021', 'Regulation 27', 'Depreciation norms', 'Asset funding restrictions'],
          ['Electricity Act, 2003', 'Section 62', 'Tariff determination', 'National framework']
        ],
        theme: 'grid',
        headStyles: { 
          fillColor: [...legalColor], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: { 
          font: 'times', 
          fontSize: 8, 
          textColor: [...textColor],
          fillColor: [255, 255, 255]
        },
        alternateRowStyles: { fillColor: [...tableBg] }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
      
      // Statutory Basis
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('STATUTORY BASIS FOR COMMISSION AUTHORITY:', 20, currentY);
      currentY += 10;
      
      doc.setTextColor(...textColor);
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      
      const statutoryBasis = [
        'Section 15 of KSERC Act, 1999: Commission has exclusive jurisdiction to determine tariffs',
        'Section 62 of Electricity Act, 2003: Tariff determination based on cost efficiency principles',
        'Regulation 73(3): Prohibits cost recovery for distribution losses exceeding approved limits',
        'Regulation 14: Mandates 2:1 sharing of efficiency gains between licensee and consumers',
        'Regulation 27: Restricts depreciation on assets funded by consumer contributions',
        'Tariff Order Principles: Cost reflectivity and consumer protection as primary objectives'
      ];
      
      statutoryBasis.forEach((basis, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${basis}`, 170);
        doc.text(lines, 25, currentY);
        currentY += (lines.length * 4) + 2;
      });

      // Page 2: Executive Legal Summary
      doc.addPage();
      addPageNumber(pageNumber++);
      doc.setTextColor(...legalColor);
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text('EXECUTIVE LEGAL SUMMARY', 105, 20, { align: 'center' });
      
      currentY = 30;
      
      // Legal Evidence Summary Table
      autoTable(doc, {
        startY: currentY,
        head: [['Legal Issue', 'Commission Decision', 'Legal Basis', 'Court Precedent']],
        body: [
          ['Energy Sales', 'Approved based on actual consumption', 'Regulation 45 - Truing up provisions', 'Consistent with previous orders'],
          ['Distribution Loss', 'Cost disallowance for excess loss', 'Regulation 73(3) - Cost recovery limits', ' upheld in multiple cases'],
          ['Employee Costs', 'Partial approval within norms', 'Regulation 61 - Normative caps', 'Commission precedent established'],
          ['R&M Expenses', 'Approved within GFA limits', 'Regulation 58 - GFA linkage', 'Standard regulatory practice'],
          ['Depreciation', 'Reduced for surplus-funded assets', 'Regulation 27 - Asset funding rules', 'Legal principle upheld'],
          ['Efficiency Gains', '2:1 sharing applied', 'Regulation 14 - Sharing mechanism', 'Consistent application']
        ],
        theme: 'grid',
        headStyles: { 
          fillColor: [...legalColor], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: { 
          font: 'times', 
          fontSize: 8, 
          textColor: [...textColor],
          fillColor: [255, 255, 255]
        },
        alternateRowStyles: { fillColor: [...tableBg] }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      // Legal Position Summary
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('LEGAL POSITION PREVENTING FUTURE CLAIMS:', 20, currentY);
      currentY += 10;
      
      doc.setTextColor(...textColor);
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      
      const legalPosition = [
        'The Commission\'s decisions are based on clear statutory authority and regulatory provisions',
        'All disallowances are supported by specific regulations and legal precedents',
        'Cost recovery restrictions are mandatory under the regulatory framework',
        'Efficiency gain sharing is statutorily prescribed and non-negotiable',
        'Depreciation restrictions on consumer-funded assets are legally mandated',
        'The licensee cannot legally claim costs disallowed under the regulations',
        'This order establishes a clear legal precedent for future proceedings'
      ];
      
      legalPosition.forEach((position, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${position}`, 170);
        doc.text(lines, 25, currentY);
        currentY += (lines.length * 4) + 2;
      });

      // Pages 4-22: Detailed Sectional Analysis with Professional Tables
      let sectionPage = 4;
      result.sectionSummaries.forEach((section) => {
        // Create multiple pages per section for comprehensive coverage
        for (let pageInSection = 0; pageInSection < 3; pageInSection++) {
          doc.addPage();
          addPageNumber(pageNumber++);
          
          doc.setTextColor(...legalColor);
          doc.setFontSize(12);
          doc.setFont('times', 'bold');
          doc.text(`${section.category.toUpperCase()}`, 105, 20, { align: 'center' });
          
          let currentY = 35;
          doc.setTextColor(...textColor);
          doc.setFontSize(10);
          doc.setFont('times', 'normal');
          
          if (pageInSection === 0) {
            // Page 1: Executive Summary with Data Table
            doc.setTextColor(...evidenceColor);
            doc.setFont('times', 'bold');
            doc.text('EXECUTIVE SUMMARY', 20, currentY);
            currentY += 10;
            doc.setTextColor(...textColor);
            doc.setFont('times', 'normal');
            const summaryText = doc.splitTextToSize(section.summary, 170);
            doc.text(summaryText, 20, currentY);
            currentY += (summaryText.length * 5) + 15;
            
            // Data Table
            doc.setTextColor(...evidenceColor);
            doc.setFont('times', 'bold');
            doc.text('EXTRACTED DATA', 20, currentY);
            currentY += 10;
            
            // Extract and format data from reasoning
            const dataItem = section.reasoning.find(r => r.includes('**Data**:'));
            if (dataItem) {
              const dataText = dataItem.replace('**Data**:', '').trim();
              
              // Create data table
              autoTable(doc, {
                startY: currentY,
                head: [['Data Point', 'Value', 'Source']],
                body: [
                  [dataText.split(':')[0]?.trim() || 'Data', dataText.split(':')[1]?.trim() || 'Value', 'Uploaded Document']
                ],
                theme: 'grid',
                headStyles: { 
                  fillColor: [...legalColor], 
                  textColor: [255, 255, 255], 
                  fontStyle: 'bold',
                  fontSize: 9
                },
                styles: { 
                  font: 'times', 
                  fontSize: 8, 
                  textColor: [...textColor],
                  fillColor: [255, 255, 255]
                },
                alternateRowStyles: { fillColor: [...tableBg] }
              });
              
              currentY = (doc as any).lastAutoTable.finalY + 15;
            }
          } else if (pageInSection === 1) {
            // Page 2: Regulatory Analysis with Professional Table
            doc.setTextColor(...evidenceColor);
            doc.setFont('times', 'bold');
            doc.text('REGULATORY ANALYSIS', 20, currentY);
            currentY += 10;
            
            const regItem = section.reasoning.find(r => r.includes('**Regulatory Analysis**:'));
            if (regItem) {
              const regText = regItem.replace('**Regulatory Analysis**:', '').trim();
              const regLines = doc.splitTextToSize(regText, 160);
              doc.setTextColor(...textColor);
              doc.setFont('times', 'normal');
              doc.text(regLines, 25, currentY);
              currentY += (regLines.length * 5) + 15;
            }
            
            currentY += 10;
            doc.setTextColor(...evidenceColor);
            doc.setFont('times', 'bold');
            doc.text('UNDER THIS REGULATORY NORM', 20, currentY);
            currentY += 10;
            
            const normItem = section.reasoning.find(r => r.includes('**Under This Regulatory Norm**:'));
            if (normItem) {
              const normText = normItem.replace('**Under This Regulatory Norm**:', '').trim();
              
              // Create regulatory norm table
              autoTable(doc, {
                startY: currentY,
                head: [['Regulatory Norm', 'Application', 'Impact']],
                body: [
                  [normText.split('Regulation')[0]?.trim() || 'Regulation', normText.split(':')[0]?.trim() || 'Application', normText.split(':')[1]?.trim() || 'Impact']
                ],
                theme: 'grid',
                headStyles: { 
                  fillColor: [...legalColor], 
                  textColor: [255, 255, 255], 
                  fontStyle: 'bold',
                  fontSize: 9
                },
                styles: { 
                  font: 'times', 
                  fontSize: 8, 
                  textColor: [...textColor],
                  fillColor: [255, 255, 255]
                },
                alternateRowStyles: { fillColor: [...tableBg] }
              });
            }
          } else {
            // Page 3: Detailed Calculations with Professional Table
            doc.setTextColor(...evidenceColor);
            doc.setFont('times', 'bold');
            doc.text('DETAILED CALCULATIONS', 20, currentY);
            currentY += 15;
            
            // Create calculations table
            const additionalReasons = section.reasoning.filter(r => 
              !r.includes('**Data**:') && 
              !r.includes('**Regulatory Analysis**:') && 
              !r.includes('**Under This Regulatory Norm**:')
            );
            
            if (additionalReasons.length > 0) {
              autoTable(doc, {
                startY: currentY,
                head: [['Calculation', 'Formula', 'Result']],
                body: additionalReasons.map(reason => {
                  const cleanReason = reason.replace(/\*\*/g, '');
                  return [
                    cleanReason.split(':')[0]?.trim() || 'Calculation',
                    cleanReason.split(':')[1]?.trim() || 'Formula',
                    cleanReason.split(':')[2]?.trim() || 'Result'
                  ];
                }),
                theme: 'grid',
                headStyles: { 
                  fillColor: [...legalColor], 
                  textColor: [255, 255, 255], 
                  fontStyle: 'bold',
                  fontSize: 9
                },
                styles: { 
                  font: 'times', 
                  fontSize: 8, 
                  textColor: [...textColor],
                  fillColor: [255, 255, 255]
                },
                alternateRowStyles: { fillColor: [...tableBg] }
              });
            }
          }
        }
        sectionPage += 3;
      });

      // Final Pages: Summary Tables and Conclusions with Professional Colors
      doc.addPage();
      addPageNumber(pageNumber++);
      doc.setTextColor(...legalColor);
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text('TABLE 23 - TRUED UP INCOME AND EXPENDITURE', 105, 25, { align: 'center' });
      doc.text(`For the Year ${result.introduction.financialYear} (Rs. Lakh)`, 105, 32, { align: 'center' });
      
      currentY = 40;
      autoTable(doc, {
        startY: currentY,
        head: [['Particulars', 'ARR & ERC Approved', 'Truing Up Petition', 'Trued Up', 'Status']],
        body: [
          ...result.summaryTable.map(item => [
            item.particulars,
            item.approvedArr.toLocaleString(),
            item.actualPetition.toLocaleString(),
            item.truedUpCommission.toLocaleString(),
            item.rejectedAmount > 0 ? 'Partially Disallowed' : 'Approved'
          ]),
          [{ content: 'Revenue Surplus (+)/Deficit (-)', styles: { fontStyle: 'bold' } }, '', '', result.overallSummary.revenueGapSurplus.toLocaleString(), result.overallSummary.revenueGapSurplus >= 0 ? 'Surplus' : 'Deficit']
        ],
        theme: 'grid',
        headStyles: { 
          fillColor: [...legalColor], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: { 
          font: 'times', 
          fontSize: 8, 
          textColor: [...textColor],
          fillColor: [255, 255, 255]
        },
        alternateRowStyles: { fillColor: [...tableBg] }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
      doc.addPage();
      addPageNumber(pageNumber++);
      doc.setTextColor(...legalColor);
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text('REGULATORY CONDITIONS AND FINAL VERDICT', 105, 25, { align: 'center' });
      
      currentY = 35;
      
      // Regulatory Conditions Section
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.text('UNDER THE FOLLOWING REGULATORY CONDITIONS:', 20, currentY);
      currentY += 15;
      
      doc.setTextColor(...textColor);
      doc.setFont('times', 'normal');
      doc.setFontSize(10);
      
      const regulatoryConditions = [
        'KSERC (Terms and Conditions for Determination of Tariff) Regulations, 2021',
        'Regulation 73(3): Cost recovery limitations for excess distribution losses',
        'Regulation 14: 2:1 sharing mechanism for efficiency gains',
        'Regulation 61: Normative caps for employee costs',
        'Regulation 58: R&M expenses linked to Gross Fixed Assets',
        'Regulation 27: Depreciation restrictions on regulatory surplus assets'
      ];
      
      regulatoryConditions.forEach((condition, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${condition}`, 165);
        doc.text(lines, 25, currentY);
        currentY += (lines.length * 5) + 3;
      });
      
      currentY += 15;
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.text('DETAILED REGULATORY ANALYSIS:', 20, currentY);
      currentY += 12;
      
      doc.setTextColor(...textColor);
      doc.setFont('times', 'normal');
      
      result.overallSummary.keyObservations.forEach((obs, index) => {
        const lines = doc.splitTextToSize(`${index + 1}. ${obs}`, 165);
        doc.text(lines, 25, currentY);
        currentY += (lines.length * 5) + 3;
        
        if (currentY > 260) {
          doc.addPage();
          addPageNumber(pageNumber++);
          currentY = 25;
        }
      });
      
      currentY += 15;
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.text('FINAL VERDICT:', 20, currentY);
      currentY += 12;
      
      doc.setTextColor(...textColor);
      doc.setFont('times', 'normal');
      const verdictLines = doc.splitTextToSize(result.overallSummary.finalVerdict, 165);
      doc.text(verdictLines, 25, currentY);
      currentY += (verdictLines.length * 5) + 15;
      
      currentY += 15;
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.text('FINAL IMPACT ANALYSIS:', 20, currentY);
      currentY += 12;
      
      doc.setTextColor(...textColor);
      doc.setFont('times', 'normal');
      const impactLines = doc.splitTextToSize(result.overallSummary.finalImpact, 165);
      doc.text(impactLines, 25, currentY);

      // Final Signature Page with Professional Colors
      doc.addPage();
      addPageNumber(pageNumber++);
      doc.setTextColor(...legalColor);
      doc.setFontSize(14);
      doc.setFont('times', 'bold');
      doc.text('OFFICIAL SIGNATURES AND APPROVAL', 105, 25, { align: 'center' });
      
      currentY = 60;
      doc.setTextColor(...textColor);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('FINAL APPROVAL STATUS:', 20, currentY);
      currentY += 15;
      
      // Create approval status table
      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Status', 'Amount (Rs. Lakh)', 'Remarks']],
        body: [
          ['Total Revenue', result.overallSummary.revenueGapSurplus >= 0 ? 'SURPLUS' : 'DEFICIT', Math.abs(result.overallSummary.revenueGapSurplus).toLocaleString(), result.overallSummary.revenueGapSurplus >= 0 ? 'To be carried forward' : 'To be recovered'],
          ['Total Disallowances', 'FINALIZED', result.overallSummary.totalRejected.toLocaleString(), 'As per regulatory norms'],
          ['Regulatory Compliance', 'VERIFIED', '-', 'All regulations applied'],
          ['Audit Status', 'COMPLETED', '-', 'Comprehensive analysis done']
        ],
        theme: 'grid',
        headStyles: { 
          fillColor: [...legalColor], 
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: { 
          font: 'times', 
          fontSize: 8, 
          textColor: [...textColor],
          fillColor: [255, 255, 255]
        },
        alternateRowStyles: { fillColor: [...tableBg] }
      });

      currentY = (doc as any).lastAutoTable.finalY + 25;
      
      // Commission Signatures
      doc.setTextColor(...evidenceColor);
      doc.setFont('times', 'bold');
      doc.setFontSize(11);
      doc.text('COMMISSION MEMBERS:', 20, currentY);
      currentY += 20;
      
      doc.setTextColor(...textColor);
      doc.setFont('times', 'bold');
      doc.text('Sd/-', 40, currentY);
      doc.text('Sd/-', 105, currentY, { align: 'center' });
      doc.text('Sd/-', 170, currentY, { align: 'right' });
      
      currentY += 7;
      doc.text('Sri. T.K Jose', 40, currentY);
      doc.text('Adv. A. J. Wilson', 105, currentY, { align: 'center' });
      doc.text('Sri. B. Pradeep', 170, currentY, { align: 'right' });
      
      currentY += 5;
      doc.setFont('times', 'normal');
      doc.text('Chairman', 40, currentY);
      doc.text('Member', 105, currentY, { align: 'center' });
      doc.text('Member', 170, currentY, { align: 'right' });
      
      currentY += 15;
      doc.text('Approved for issue', 105, currentY, { align: 'center' });
      currentY += 7;
      doc.text('Sd/-', 105, currentY, { align: 'center' });
      currentY += 7;
      doc.text('Secretary', 105, currentY, { align: 'center' });
      
      currentY += 15;
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.text('Generated by KSERC Audit Portal - Powered by Rajadhani Institute of Engineering and Technology', 105, 285, { align: 'center' });

      doc.save(`${filename}.pdf`);
    }
    setIsExportModalOpen(false);
  };

  const filteredData = useMemo(() => {
    if (!result) return [];
    return result.summaryTable.filter(item => {
      const matchesSbu = sbuFilter === 'All' || item.sbu === sbuFilter;
      const matchesRedFlag = !redFlagOnly || item.isRedFlag;
      const matchesSearch = item.particulars.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.reason.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSbu && matchesRedFlag && matchesSearch;
    });
  }, [result, sbuFilter, redFlagOnly, searchQuery]);

  const chartData = useMemo(() => {
    return filteredData.slice(0, 8).map(item => ({
      name: item.particulars.length > 15 ? item.particulars.substring(0, 15) + '...' : item.particulars,
      Claimed: item.actualPetition,
      Approved: item.approvedArr,
      TruedUp: item.truedUpCommission,
    }));
  }, [filteredData]);

  if (!isAuthenticated) {
    return (
      <div className={cn(
        "min-h-screen font-sans flex flex-col transition-colors duration-300",
        "bg-[#2a2a2a] text-[#f0f0f0]"
      )}>
        {/* Top Official Banner */}
        <div className={cn(
          "w-full py-3 px-8 flex justify-between items-center border-b backdrop-blur-md sticky top-0 z-50",
          theme === 'dark' ? "bg-black/40 border-white/5" : "bg-white/80 border-slate-200"
        )}>
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-kerala-maroon dark:text-white font-serif italic">RAJADHANI</span>
              <span className="text-[9px] text-slate-500 dark:text-white/40 uppercase tracking-widest font-medium">Institute of Engineering & Tech</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest hidden md:block">Powered by Rajadhani Institute of Engineering and Technology</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 relative regulatory-grid overflow-hidden">
          <div className="w-full max-w-md space-y-8 relative">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight font-serif italic">KSERC Audit Portal</h1>
              <p className="text-sm text-white/40">Authorized Regulatory Intelligence Terminal</p>
            </div>

            <form onSubmit={handleLogin} className="gov-card p-10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-kerala-maroon" />
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Official ID</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input 
                      type="text" 
                      required
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-kerala-maroon/50 transition-all"
                      placeholder="Enter ID"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Security Key</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    <input 
                      type="password" 
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-kerala-maroon/50 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertTriangle size={14} />
                  {loginError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full py-4 bg-kerala-maroon text-white font-bold rounded-xl hover:bg-kerala-maroon/90 transition-all shadow-xl shadow-kerala-maroon/20 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={20} />
                Authorize Session
              </button>
            </form>
          </div>
        </div>

        <div className="w-full py-6 px-8 flex justify-between items-center text-[9px] uppercase tracking-widest text-white/20 border-t border-white/5 bg-black/40">
          <p>© 2026 RIET • Regulatory Audit Division</p>
          <div className="flex gap-6">
            <span>Powered by Rajadhani Institute of Engineering and Technology</span>
            <span>Privacy Protocol</span>
            <span>Usage Terms</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300 font-sans",
      "bg-[#2a2a2a] text-[#f0f0f0]"
    )}>
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 z-50 transition-transform duration-300 ease-in-out flex flex-col border-r",
        "bg-[#3a3a3a] border-white/15",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-6 border-b border-white/5">
          <Logo />
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 px-3">Main Terminal</div>
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')} 
          />
          <NavItem 
            icon={<TableIcon size={18} />} 
            label="Audit Ledger" 
            active={currentView === 'datagrid'} 
            onClick={() => setCurrentView('datagrid')} 
          />
          <NavItem 
            icon={<FileText size={18} />} 
            label="Formal Report" 
            active={currentView === 'report'} 
            onClick={() => setCurrentView('report')} 
          />
          
          <div className="pt-8 text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 px-3">Regulatory Tools</div>
          <NavItem 
            icon={<BookOpen size={18} />} 
            label="KSERC Norms" 
            onClick={() => setIsNormsOpen(true)} 
          />
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium text-white/60">
              <Flag size={18} className="text-amber-500" />
              <span>Red Flags</span>
            </div>
            <button 
              onClick={() => setRedFlagOnly(!redFlagOnly)}
              className={cn(
                "w-10 h-5 rounded-full transition-colors relative",
                redFlagOnly ? "bg-kerala-maroon" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                redFlagOnly ? "left-6" : "left-1"
              )} />
            </button>
          </div>
        </nav>

        <div className="p-6 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
          >
            <X size={18} />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header className={cn(
          "h-20 border-b flex items-center justify-between px-8 sticky top-0 backdrop-blur-md z-40",
          "bg-[#3a3a3a]/95 border-white/15"
        )}>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold font-serif italic">
              {currentView === 'dashboard' && "Audit Dashboard"}
              {currentView === 'datagrid' && "Audit Ledger"}
              {currentView === 'report' && "Formal Audit Report"}
            </h2>
          </div>
            </div>
          </div>

          {loginError && (
            <div className="flex items-center gap-2 text-red-500 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertTriangle size={14} />
              {loginError}
            </div>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-kerala-maroon text-white font-bold rounded-xl hover:bg-kerala-maroon/90 transition-all shadow-xl shadow-kerala-maroon/20 flex items-center justify-center gap-2"
          >
            <ShieldCheck size={20} />
            Authorize Session
          </button>
        </form>
      </div>
    </div>

    <div className="w-full py-6 px-8 flex justify-between items-center text-[9px] uppercase tracking-widest text-white/20 border-t border-white/5 bg-black/40">
      <p> 2026 RIET • Regulatory Audit Division</p>
      <div className="flex gap-6">
        <span>Powered by Rajadhani Institute of Engineering and Technology</span>
        <span>Privacy Protocol</span>
        <span>Usage Terms</span>
      </div>
    </div>
  </div>
);

return (
  <div className={cn(
    "min-h-screen transition-colors duration-300 font-sans",
    "bg-[#2a2a2a] text-[#f0f0f0]"
  )}>
    {/* Sidebar */}
    <aside className={cn(
      "fixed inset-y-0 left-0 w-64 z-50 transition-transform duration-300 ease-in-out flex flex-col border-r",
      "bg-[#3a3a3a] border-white/15",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="p-6 border-b border-white/5">
        <Logo />
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 px-3">Main Terminal</div>
        <NavItem 
          icon={<LayoutDashboard size={18} />} 
          label="Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')} 
        />
        <NavItem 
          icon={<TableIcon size={18} />} 
          label="Audit Ledger" 
          active={currentView === 'datagrid'} 
          onClick={() => setCurrentView('datagrid')} 
        />
        <NavItem 
          icon={<FileText size={18} />} 
          label="Formal Report" 
          active={currentView === 'report'} 
          onClick={() => setCurrentView('report')} 
        />
        
        <div className="pt-8 text-[10px] font-bold uppercase tracking-widest text-white/20 mb-2 px-3">Regulatory Tools</div>
        <NavItem 
          icon={<BookOpen size={18} />} 
          label="KSERC Norms" 
          onClick={() => setIsNormsOpen(true)} 
        />
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium text-white/60">
            <Flag size={18} className="text-amber-500" />
            <span>Red Flags</span>
          </div>
          <button 
            onClick={() => setRedFlagOnly(!redFlagOnly)}
            className={cn(
              "w-10 h-5 rounded-full transition-colors relative",
              redFlagOnly ? "bg-kerala-maroon" : "bg-white/10"
            )}
          >
            <div className={cn(
              "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
              redFlagOnly ? "left-6" : "left-1"
            )} />
          </button>
        </div>
      </nav>

      <div className="p-6 border-t border-white/5">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <X size={18} />
          Terminate Session
        </button>
      </div>
    </aside>

    {/* Main Content */}
    <main className="lg:ml-64 min-h-screen flex flex-col">
      {/* Header */}
      <header className={cn(
        "h-20 border-b flex items-center justify-between px-8 sticky top-0 backdrop-blur-md z-40",
        "bg-[#3a3a3a]/95 border-white/15"
      )}>
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold font-serif italic">
            {currentView === 'dashboard' && "Audit Dashboard"}
            {currentView === 'datagrid' && "Audit Ledger"}
            {currentView === 'report' && "Formal Audit Report"}
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <input 
              type="text" 
              placeholder="Search audit data..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-kerala-maroon/50 w-64 transition-all"
            />
          </div>
          {result && (
            <button 
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 bg-kerala-maroon text-white text-xs font-bold rounded-full hover:bg-kerala-maroon/90 transition-all flex items-center gap-2"
            >
              <Download size={14} />
              Export Report
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 p-8 regulatory-grid">
        {currentView === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Upload Section */}
            {!result && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div {...trueUpDropzone.getRootProps()} className={cn(
                    "gov-card p-12 flex flex-col items-center justify-center text-center cursor-pointer border-dashed border-2 transition-all",
                    trueUpFile ? "border-kerala-maroon bg-kerala-maroon/5" : "border-white/10 hover:border-white/20"
                  )}>
                    <input {...trueUpDropzone.getInputProps()} />
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Upload size={32} className={trueUpFile ? "text-kerala-maroon" : "text-white/20"} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Upload True-Up Order</h3>
                    <p className="text-sm text-white/40 mb-4">{trueUpFile ? trueUpFile.name : "Drag and drop the official PDF order"}</p>
                    {trueUpFile && <CheckCircle2 size={20} className="text-emerald-500" />}
                  </div>

                  <div {...arrDropzone.getRootProps()} className={cn(
                    "gov-card p-12 flex flex-col items-center justify-center text-center cursor-pointer border-dashed border-2 transition-all",
                    arrFile ? "border-kerala-maroon bg-kerala-maroon/5" : "border-white/10 hover:border-white/20"
                  )}>
                    <input {...arrDropzone.getInputProps()} />
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                      <Upload size={32} className={arrFile ? "text-kerala-maroon" : "text-white/20"} />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Upload ARR Order</h3>
                    <p className="text-sm text-white/40 mb-4">{arrFile ? arrFile.name : "Drag and drop the approved ARR PDF"}</p>
                    {arrFile && <CheckCircle2 size={20} className="text-emerald-500" />}
                  </div>

                  <div className="md:col-span-2 flex justify-center">
                    <button 
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !trueUpFile || !arrFile}
                      className="px-12 py-4 bg-kerala-maroon text-white font-bold rounded-xl hover:bg-kerala-maroon/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shadow-2xl shadow-kerala-maroon/20"
                    >
                      {isAnalyzing ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                      {isAnalyzing ? "Analyzing Regulatory Compliance..." : "Initialize Comparative Audit"}
                    </button>
                  </div>
                </div>
              )}

              {/* Result Dashboard */}
              {result && (
                <div className="space-y-8">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <SummaryCard 
                      label="Total Claimed" 
                      value={`₹${result.overallSummary.totalActual.toLocaleString()} Cr`} 
                      icon={<ArrowUpRight className="text-rose-500" />}
                    />
                    <SummaryCard 
                      label="Trued Up" 
                      value={`₹${result.overallSummary.totalTruedUp.toLocaleString()} Cr`} 
                      icon={<CheckCircle2 className="text-emerald-500" />}
                    />
                    <SummaryCard 
                      label="Disallowed" 
                      value={`₹${result.overallSummary.totalRejected.toLocaleString()} Cr`} 
                      icon={<AlertTriangle className="text-amber-500" />}
                      highlight
                    />
                    <SummaryCard 
                      label="Revenue Gap/Surplus" 
                      value={`₹${Math.abs(result.overallSummary.revenueGapSurplus).toLocaleString()} Cr`} 
                      subtext={result.overallSummary.revenueGapSurplus < 0 ? "Revenue Gap" : "Revenue Surplus"}
                      icon={result.overallSummary.revenueGapSurplus < 0 ? <ArrowDownRight className="text-rose-500" /> : <ArrowUpRight className="text-emerald-500" />}
                    />
                  </div>

                  {/* Operational Performance */}
                  <div className="gov-card p-8">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <BarChart3 size={20} className="text-kerala-maroon" />
                        Operational Performance
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                      <StatItem label="Consumers" value={result.operationalPerformance.consumers} />
                      <StatItem label="Sale of Power" value={result.operationalPerformance.saleOfPower} />
                      <StatItem label="Loss (Approved)" value={result.operationalPerformance.distributionLossApproved} />
                      <StatItem label="Loss (Actual)" value={result.operationalPerformance.distributionLossActual} highlight={parseFloat(result.operationalPerformance.distributionLossActual) > parseFloat(result.operationalPerformance.distributionLossApproved)} />
                    </div>
                  </div>

                  {/* Charts and Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 gov-card p-8">
                      <h3 className="text-lg font-bold mb-8">Audit Variance Analysis</h3>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} />
                            <YAxis stroke="#ffffff40" fontSize={10} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#121214', border: '1px solid #ffffff10', borderRadius: '12px' }}
                              itemStyle={{ fontSize: '12px' }}
                            />
                            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                            <Bar dataKey="Claimed" fill="#8B0000" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Approved" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="TruedUp" fill="#006400" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="lg:col-span-4 gov-card p-8">
                      <h3 className="text-lg font-bold mb-8">Disallowance by SBU</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData(result)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData(result).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#121214', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            />
                            <Legend verticalAlign="bottom" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-8 p-4 bg-kerala-maroon/5 border border-kerala-maroon/10 rounded-xl">
                        <p className="text-xs text-kerala-gold font-bold uppercase tracking-widest mb-2">Audit Verdict</p>
                        <p className="text-sm font-medium leading-relaxed">{result.overallSummary.finalVerdict}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'datagrid' && result && (
            <div className="max-w-6xl mx-auto gov-card overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                  <select 
                    value={sbuFilter}
                    onChange={(e) => setSbuFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-kerala-maroon"
                  >
                    <option value="All">All SBUs</option>
                    <option value="SBU-G">SBU-G (Generation)</option>
                    <option value="SBU-T">SBU-T (Transmission)</option>
                    <option value="SBU-D">SBU-D (Distribution)</option>
                  </select>
                </div>
                <div className="text-xs text-white/40 font-mono">
                  Showing {filteredData.length} audit entries
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-bold uppercase tracking-widest text-white/40 border-b border-white/5">
                      <th className="px-6 py-4">Particulars</th>
                      <th className="px-6 py-4">SBU</th>
                      <th className="px-6 py-4 text-right">Approved ARR</th>
                      <th className="px-6 py-4 text-right">Claimed</th>
                      <th className="px-6 py-4 text-right">Trued Up</th>
                      <th className="px-6 py-4 text-right">Rejected</th>
                      <th className="px-6 py-4">Audit Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredData.map((item, idx) => (
                      <tr key={idx} className={cn(
                        "text-sm hover:bg-white/[0.02] transition-colors",
                        item.isRedFlag && "bg-rose-500/[0.03]"
                      )}>
                        <td className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-2">
                            {item.isRedFlag && <AlertTriangle size={14} className="text-rose-500" />}
                            {item.particulars}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-white/40">{item.sbu}</td>
                        <td className="px-6 py-4 text-right font-mono">₹{item.approvedArr.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-mono">₹{item.actualPetition.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-mono text-kerala-gold">₹{item.truedUpCommission.toLocaleString()}</td>
                        <td className="px-6 py-4 text-right font-mono text-rose-500">₹{item.rejectedAmount.toLocaleString()}</td>
                        <td className="px-6 py-4 text-xs text-white/60 max-w-xs leading-relaxed">{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {currentView === 'report' && result && (
            <div className="max-w-4xl mx-auto gov-card p-16 space-y-12 bg-white text-slate-900 font-serif">
              <div className="flex flex-col items-center text-center space-y-4 border-b-2 border-slate-900 pb-8">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold uppercase tracking-widest">KERALA STATE ELECTRICITY REGULATORY COMMISSION</h1>
                  <p className="text-sm font-medium">THIRUVANANTHAPURAM</p>
                </div>
                <div className="pt-4">
                  <h2 className="text-xl font-bold italic underline">ORDER</h2>
                  <p className="text-sm mt-2">In the matter of: Truing Up of Accounts for the Financial Year {result.introduction.financialYear}</p>
                </div>
                <div className="text-[10px] text-slate-400 font-sans mt-4">
                  Powered by Rajadhani Institute of Engineering and Technology
                </div>
              </div>

              <div className="space-y-8 text-sm leading-relaxed text-justify">
                <section>
                  <h3 className="font-bold text-lg mb-4 uppercase border-l-4 border-kerala-maroon pl-4">1. Introduction</h3>
                  <p>The Kerala State Electricity Regulatory Commission (hereinafter referred to as the Commission), having considered the petition filed by {result.introduction.applicant} (the Licensee) for the Truing Up of Accounts for the FY {result.introduction.financialYear}, and having heard the respondent {result.introduction.respondent} and other stakeholders, hereby issues the following order.</p>
                </section>

                <section>
                  <h3 className="font-bold text-lg mb-4 uppercase border-l-4 border-kerala-maroon pl-4">2. Sectional Analysis & Audit Findings</h3>
                  <div className="space-y-6">
                    {result.sectionSummaries.map((section, idx) => (
                      <div key={idx} className="space-y-2">
                        <h4 className="font-bold text-kerala-maroon uppercase">{section.category}</h4>
                        <p className="italic font-medium">{section.summary}</p>
                        <ul className="list-disc pl-6 space-y-1 text-slate-600">
                          {section.reasoning.map((reason, rIdx) => (
                            <li key={rIdx}>{reason.replace(/\*\*/g, '')}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="font-bold text-lg mb-4 uppercase border-l-4 border-kerala-maroon pl-4">3. Final Verdict & Impact</h3>
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                    <p className="font-bold text-kerala-maroon">Final Audit Verdict:</p>
                    <p>{result.overallSummary.finalVerdict}</p>
                    <p className="font-bold text-kerala-maroon mt-4">Regulatory Impact Assessment:</p>
                    <p>{result.overallSummary.finalImpact}</p>
                  </div>
                </section>
              </div>

              <div className="pt-12 flex justify-between items-end border-t border-slate-200">
                <div className="text-[10px] text-slate-400 font-sans">
                  Document ID: KSERC-AI-{Math.random().toString(36).substr(2, 9).toUpperCase()}
                </div>
                <div className="text-center space-y-1">
                  <div className="w-32 h-1 border-b border-slate-900 mb-2 mx-auto" />
                  <p className="text-xs font-bold uppercase">Secretary, KSERC</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Norms Modal */}
      {isNormsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="gov-card w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BookOpen size={20} className="text-kerala-gold" />
                Regulatory Guidelines & Norms
              </h3>
              <button onClick={() => setIsNormsOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {REGULATORY_NORMS.map((norm, idx) => (
                <div key={idx} className="p-6 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="text-kerala-gold font-bold text-sm">{norm.category}</h4>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">{norm.norm}</p>
                  <p className="text-sm text-white/70 leading-relaxed">{norm.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="gov-card w-full max-w-md p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Generate Formal Report</h3>
              <button onClick={() => setIsExportModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">File Name</label>
                <input 
                  type="text" 
                  value={exportConfig.filename}
                  onChange={(e) => setExportConfig({ ...exportConfig, filename: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-kerala-maroon"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Export Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {['pdf', 'csv', 'json'].map((format) => (
                    <button
                      key={format}
                      onClick={() => setExportConfig({ ...exportConfig, format: format as any })}
                      className={cn(
                        "py-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all",
                        exportConfig.format === format 
                          ? "bg-kerala-maroon border-kerala-maroon text-white" 
                          : "bg-white/5 border-white/10 text-white/40 hover:bg-white/10"
                      )}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={handleExport}
              className="w-full py-4 bg-kerala-maroon text-white font-bold rounded-xl hover:bg-kerala-maroon/90 transition-all shadow-xl shadow-kerala-maroon/20 flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Download Formal Document
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group relative",
      active 
        ? "bg-kerala-maroon text-white shadow-lg shadow-kerala-maroon/20" 
        : "text-white/40 hover:text-white hover:bg-white/5"
    )}
  >
    <span className={cn("transition-transform group-hover:scale-110", active ? "text-white" : "text-kerala-maroon")}>
      {icon}
    </span>
    {label}
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-kerala-gold rounded-r-full" />
    )}
  </button>
);

const SummaryCard = ({ label, value, icon, subtext, highlight = false }: { label: string, value: string, icon: React.ReactNode, subtext?: string, highlight?: boolean }) => (
  <div className={cn(
    "gov-card p-6 flex flex-col justify-between relative overflow-hidden",
    highlight && "border-kerala-maroon/20 bg-kerala-maroon/[0.02]"
  )}>
    <div className="flex items-center justify-between mb-4">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</span>
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <h4 className="text-2xl font-bold tracking-tight">{value}</h4>
      {subtext && <p className="text-[10px] text-white/20 font-mono uppercase tracking-widest">{subtext}</p>}
    </div>
    {highlight && <div className="absolute top-0 right-0 w-16 h-16 bg-kerala-maroon/10 blur-2xl rounded-full -mr-8 -mt-8" />}
  </div>
);

const StatItem = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">{label}</p>
    <p className={cn("text-xl font-bold", highlight ? "text-rose-500" : "text-white")}>{value}</p>
  </div>
);

const pieData = (result: AnalysisResult) => {
  const sbuTotals = result.summaryTable.reduce((acc, item) => {
    acc[item.sbu] = (acc[item.sbu] || 0) + item.rejectedAmount;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(sbuTotals).map(([name, value]) => ({ name, value }));
};
