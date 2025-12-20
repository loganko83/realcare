import React, { useState, useRef } from 'react';
import { FileText, Check, AlertTriangle, Loader2, X, Camera, Image as ImageIcon, Save, CheckCircle, File, Share2, AlignLeft, Download, RefreshCw } from 'lucide-react';
import { analyzeContract } from '../services/geminiService';
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface Risk {
  clause: string;
  explanation: string;
  severity: string;
  suggestion: string[];
}

interface AnalysisResult {
  summary: string;
  risks: Risk[];
}

export const Contract: React.FC = () => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [lastAnalyzedText, setLastAnalyzedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<{name: string, data: string, mimeType: string, size: number} | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [showShareModal, setShowShareModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      // result is like data:image/jpeg;base64,....
      const [header, data] = result.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      
      setSelectedFile({
        name: file.name,
        mimeType: file.type || mimeType,
        data,
        size: file.size
      });
      setSaveStatus('idle'); // Reset save status on new file
      setShareStatus('idle');
    };
    reader.readAsDataURL(file);
    
    // Reset inputs so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setSaveStatus('idle');
    setShareStatus('idle');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setSaveStatus('idle');
    setShareStatus('idle');
  };

  const handleAnalyze = async () => {
    if (!text && !selectedFile) return;
    setLoading(true);
    // setAnalysis(null); // Keep previous analysis visible during re-analysis
    setSaveStatus('idle');
    setShareStatus('idle');
    setLastAnalyzedText(text);
    
    try {
      const resultJson = await analyzeContract(text, selectedFile?.data, selectedFile?.mimeType);
      const result = JSON.parse(resultJson);
      setAnalysis(result);
    } catch (e) {
      console.error("Failed to parse analysis", e);
      setAnalysis({
        summary: "분석 중 오류가 발생했습니다.",
        risks: []
      });
    }
    setLoading(false);
  };

  const handleSave = () => {
    if (!analysis) return;

    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      analysis: analysis,
      originalText: text,
      attachedFile: selectedFile ? {
        name: selectedFile.name,
        type: selectedFile.mimeType,
        size: selectedFile.size,
        data: selectedFile.data // This might be large
      } : null
    };

    try {
      const stored = localStorage.getItem('realcare_saved_analyses');
      const list = stored ? JSON.parse(stored) : [];
      list.unshift(record); // Add to top
      localStorage.setItem('realcare_saved_analyses', JSON.stringify(list));
      setSaveStatus('saved');
    } catch (e) {
      console.error("Storage error:", e);
      // Fallback: Try saving without the file data if it's too big
      if (selectedFile) {
        try {
          const recordNoFile = { ...record, attachedFile: { ...record.attachedFile, data: null, note: "File not saved (too large)" } };
          const stored = localStorage.getItem('realcare_saved_analyses');
          const list = stored ? JSON.parse(stored) : [];
          list.unshift(recordNoFile);
          localStorage.setItem('realcare_saved_analyses', JSON.stringify(list));
          setSaveStatus('saved');
          alert("분석이 저장되었습니다! (이미지는 용량 제한으로 저장되지 않았습니다)");
          return;
        } catch (e2) {
           setSaveStatus('error');
        }
      }
      setSaveStatus('error');
    }
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('analysis-report-content');
    if (!element) return;
    
    setDownloadingPdf(true);
    try {
      const canvas = await html2canvas(element, {
        scale: 2, // better resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`realcare-contract-analysis-${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF 생성 중 오류가 발생했습니다.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const processShare = async (template: 'full' | 'summary' | 'risks') => {
    if (!analysis) return;
    
    const header = `[리얼케어] 계약서 안전 진단 리포트\n\n`;
    const footer = `\n------------------\nAI 부동산 비서, 리얼케어`;
    let content = "";

    switch (template) {
      case 'summary':
        content = `📊 요약\n${analysis.summary}\n`;
        break;
      
      case 'risks':
        content = `⚠️ 핵심 리스크 점검\n\n`;
        const keyRisks = analysis.risks.filter(r => r.severity === 'High' || r.severity === 'Medium');
        if (keyRisks.length === 0) {
          content += "✅ 큰 위험 요소가 발견되지 않았습니다. (안전)\n";
        } else {
          keyRisks.forEach((risk, idx) => {
             const severityKR = risk.severity === 'High' ? '🔴 고위험' : '🟠 주의';
             content += `${idx + 1}. [${severityKR}] ${risk.clause.substring(0, 30)}${risk.clause.length > 30 ? '...' : ''}\n`;
             content += `   이유: ${risk.explanation}\n\n`;
          });
        }
        break;

      case 'full':
      default:
        content = `📊 요약\n${analysis.summary}\n\n⚠️ 상세 분석 결과\n`;
        analysis.risks.forEach((risk, idx) => {
            const severityKR = risk.severity === 'High' ? '🔴 고위험' : risk.severity === 'Medium' ? '🟠 주의' : '🟡 참고';
            content += `${idx + 1}. [${severityKR}] ${risk.clause.substring(0, 30)}${risk.clause.length > 30 ? '...' : ''}\n`;
            
            // Handle array or string for compatibility (though type says string[])
            const suggestions = Array.isArray(risk.suggestion) ? risk.suggestion : [risk.suggestion];
            const suggestionText = suggestions.map(s => `      - ${s}`).join('\n');
            content += `   💡 조언:\n${suggestionText}\n\n`;
        });
        break;
    }

    const shareText = `${header}${content}${footer}`;
    
    const shareData = {
      title: '리얼케어 계약 분석',
      text: shareText,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n🔗 ${window.location.href}`);
        setShareStatus('copied');
        setTimeout(() => setShareStatus('idle'), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
    setShowShareModal(false);
  };

  const isPdf = selectedFile?.mimeType === 'application/pdf';

  return (
    <div className="p-4 pb-24 relative">
      <h1 className="text-xl font-bold text-slate-800 mb-2">계약 안심 케어</h1>
      <p className="text-sm text-slate-500 mb-6">계약서 사진을 올리거나 조항을 입력하여 위험을 진단하세요.</p>

      {/* Upload Area */}
      <div className={`bg-white rounded-2xl border-2 border-dashed ${selectedFile ? 'border-brand-500 bg-brand-50' : 'border-gray-200'} p-6 flex flex-col items-center justify-center mb-6 transition relative min-h-[200px]`}>
        
        {/* Hidden Inputs */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          className="hidden" 
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center animate-fade-in">
             {isPdf ? (
               <div className="relative w-24 h-32 mb-3 bg-white rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col overflow-hidden group">
                 {/* Visual fold effect */}
                 <div className="absolute top-0 right-0 w-0 h-0 border-l-[12px] border-l-transparent border-t-[12px] border-t-slate-200/50 drop-shadow-sm"></div>
                 
                 <div className="flex-1 p-3 flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-12 border-2 border-slate-200 rounded flex flex-col items-center justify-center bg-slate-50">
                        <span className="text-[6px] font-bold text-slate-400">DOC</span>
                    </div>
                    <div className="space-y-1 w-full flex flex-col items-center">
                         <div className="w-12 h-0.5 bg-slate-100 rounded-full"></div>
                         <div className="w-10 h-0.5 bg-slate-100 rounded-full"></div>
                    </div>
                 </div>
                 
                 <div className="h-7 bg-red-50 border-t border-red-100 flex items-center justify-center text-red-600">
                    <FileText size={12} className="mr-1" />
                    <span className="text-[9px] font-bold">PDF 문서</span>
                 </div>
               </div>
             ) : (
               <div className="relative w-24 h-24 mb-3 rounded-2xl overflow-hidden shadow-md border border-gray-100 group">
                 <img 
                   src={`data:${selectedFile.mimeType};base64,${selectedFile.data}`} 
                   alt="Preview" 
                   className="w-full h-full object-cover"
                 />
                 <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition" />
                 <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                   IMG
                 </div>
               </div>
             )}

            <p className="text-sm font-bold text-slate-700 max-w-[200px] truncate text-center">{selectedFile.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">
                {formatBytes(selectedFile.size)}
              </span>
              <span className="text-xs text-brand-500 font-medium">준비됨</span>
            </div>
            
            <button 
              onClick={handleRemoveFile} 
              className="absolute top-3 right-3 p-2 rounded-full bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 shadow-sm border border-gray-100 transition"
              title="파일 삭제"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full">
            <p className="text-sm font-medium text-slate-600 mb-6">계약서 업로드</p>
            
            <div className="flex gap-4 w-full justify-center px-4">
              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-brand-50 text-brand-600 hover:bg-brand-100 transition border border-brand-100 shadow-sm group"
              >
                <div className="p-2 bg-white rounded-full shadow-sm text-brand-500 group-hover:scale-110 transition">
                  <Camera size={24} />
                </div>
                <span className="text-xs font-bold">사진 촬영</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex flex-col items-center justify-center gap-3 p-5 rounded-2xl bg-gray-50 text-slate-600 hover:bg-gray-100 transition border border-gray-100 shadow-sm group"
              >
                <div className="p-2 bg-white rounded-full shadow-sm text-slate-500 group-hover:scale-110 transition">
                  <ImageIcon size={24} />
                </div>
                <span className="text-xs font-bold">갤러리 / PDF</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-4 flex items-center gap-1">
              <File size={10} /> 지원: 이미지(JPG, PNG), PDF
            </p>
          </div>
        )}
      </div>

      {/* Manual Input for Demo */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">또는 계약 조항 직접 입력</label>
        <textarea
          className="w-full p-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm h-32 resize-none"
          placeholder="예: 임차인이 계약을 중도 해지할 경우 계약금은 반환되지 않는다..."
          value={text}
          onChange={handleTextChange}
        ></textarea>
      </div>

      <button 
        onClick={handleAnalyze}
        disabled={loading || (!text && !selectedFile)}
        className="w-full bg-slate-800 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-slate-900 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin" size={20}/> : <FileText size={20} />}
        {analysis 
          ? (text !== lastAnalyzedText && text ? "수정된 내용으로 재분석" : "리스크 재분석") 
          : "리스크 분석 시작"}
      </button>

      {/* Analysis Result */}
      {analysis && (
        <div className={`mt-8 animate-fade-in space-y-6 ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
          
          <div id="analysis-report-content" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-brand-600" size={24} />
                <h2 className="font-bold text-lg text-slate-800">분석 리포트</h2>
              </div>
              <button 
                onClick={handleAnalyze}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-brand-600 transition shadow-sm"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                다시 분석
              </button>
            </div>
            
            {/* Summary */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-slate-800 mb-2">요약</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Risks */}
            {analysis.risks.length > 0 ? (
              <div className="space-y-4">
                {analysis.risks.map((risk, idx) => (
                    <div key={idx} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${
                      risk.severity === 'High' ? 'border-red-500' : 
                      risk.severity === 'Medium' ? 'border-orange-400' : 
                      'border-yellow-300'
                    }`}>
                      <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                            risk.severity === 'High' ? 'bg-red-50 text-red-600' : 
                            risk.severity === 'Medium' ? 'bg-orange-50 text-orange-600' : 
                            'bg-yellow-50 text-yellow-700'
                          }`}>
                            {risk.severity === 'High' ? '고위험' : risk.severity === 'Medium' ? '주의' : '참고'}
                          </span>
                      </div>
                      
                      <div className="mb-4">
                          <p className="text-xs text-slate-400 uppercase font-bold mb-1">관련 조항</p>
                          <div className="text-sm font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                            "{risk.clause}"
                          </div>
                      </div>
                      
                      <div className="mb-4">
                          <p className="text-sm text-slate-600">{risk.explanation}</p>
                      </div>
                      
                      <div className="bg-brand-50 p-3 rounded-lg flex gap-3 items-start border border-brand-100">
                          <CheckCircle className="text-brand-600 shrink-0 mt-0.5" size={18} />
                          <div className="w-full">
                            <p className="text-xs font-bold text-brand-700 mb-1">추천 대응 방안</p>
                            <ul className="text-sm text-brand-800 list-disc pl-4 space-y-1">
                              {Array.isArray(risk.suggestion) ? risk.suggestion.map((step, i) => (
                                <li key={i}>{step}</li>
                              )) : (
                                <li>{risk.suggestion}</li>
                              )}
                            </ul>
                          </div>
                      </div>
                    </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 p-5 rounded-xl border border-green-100 text-center">
                <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                <p className="text-green-800 font-medium">큰 위험 요소가 발견되지 않았습니다!</p>
                <p className="text-green-600 text-sm mt-1">분석된 내용은 표준적인 것으로 보입니다.</p>
              </div>
            )}

            <div className="flex justify-between items-center mb-4 px-2">
                <button className="text-xs font-medium text-slate-400 hover:text-slate-600">
                  면책 조항: 이 결과는 AI가 생성한 것으로 법적 효력이 없으며 참고용으로만 활용하세요.
              </button>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100">
            <div className="flex gap-3 justify-end">
              <button 
                onClick={handleSave}
                disabled={saveStatus === 'saved'}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold transition shadow-sm ${
                  saveStatus === 'saved' 
                  ? 'bg-green-100 text-green-700' 
                  : saveStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-white text-slate-700 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {saveStatus === 'saved' ? (
                  <>
                    <CheckCircle size={18} /> 저장됨
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertTriangle size={18} /> 실패
                  </>
                ) : (
                  <>
                    <Save size={18} /> 저장
                  </>
                )}
              </button>

              <button 
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold bg-white text-slate-700 border border-gray-200 hover:bg-gray-50 transition shadow-sm"
              >
                {downloadingPdf ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                PDF
              </button>

              {saveStatus === 'saved' && (
                <button 
                  onClick={() => setShowShareModal(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-900 transition shadow-md"
                >
                  {shareStatus === 'copied' ? <CheckCircle size={18} /> : <Share2 size={18} />}
                  {shareStatus === 'copied' ? '복사됨' : '공유'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center sm:items-center p-4">
          <div 
            className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-fade-in relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-lg text-slate-800">공유 형식 선택</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => processShare('full')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-700 group-hover:text-brand-700">전체 리포트</p>
                  <p className="text-xs text-slate-500">요약 + 모든 리스크 + 상세 조언 포함</p>
                </div>
              </button>

              <button 
                onClick={() => processShare('summary')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition group text-left"
              >
                 <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <AlignLeft size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-700 group-hover:text-brand-700">요약본만 공유</p>
                  <p className="text-xs text-slate-500">핵심 내용만 간결하게 전달</p>
                </div>
              </button>

              <button 
                onClick={() => processShare('risks')}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-red-500 hover:bg-red-50 transition group text-left"
              >
                 <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-700 group-hover:text-red-700">핵심 위험 (주의/위험)</p>
                  <p className="text-xs text-slate-500">중요한 리스크 항목만 발췌</p>
                </div>
              </button>
            </div>
            
            <div className="mt-4 text-center">
               <p className="text-[10px] text-slate-400">선택 시 클립보드에 복사되거나 공유 창이 열립니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};