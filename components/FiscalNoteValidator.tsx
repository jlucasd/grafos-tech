import React, { useState, useRef } from 'react';
import { 
  History, 
  Hash, 
  Wand2, 
  CloudUpload, 
  Filter, 
  CheckCircle2, 
  HelpCircle, 
  AlertTriangle, 
  XCircle, 
  Check, 
  Search,
  FileText,
  Loader2,
  Trash2
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { FiscalNoteResult } from '../types';

export const FiscalNoteValidator: React.FC = () => {
  const [nfInput, setNfInput] = useState('');
  const [results, setResults] = useState<FiscalNoteResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to read file as Base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    if (!nfInput) {
      alert("Por favor, insira o número da Nota Fiscal antes de enviar imagens.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Convert FileList to Array immediately to avoid access issues
    const files: File[] = Array.from(fileList);

    // Create initial state entries
    const newResults: FiscalNoteResult[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      imageUrl: URL.createObjectURL(file), // Create local preview URL
      status: 'processing'
    }));

    // Update UI immediately with processing cards
    setResults(prev => [...newResults, ...prev]);
    setIsProcessing(true);

    // Reset input allows selecting the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';

    // Process files in parallel
    await Promise.all(files.map(async (file, index) => {
      const resultId = newResults[index].id;
      
      try {
        const base64Data = await readFileAsBase64(file);
        // Extract clean base64 string
        const base64Content = base64Data.split(',')[1];
        
        await analyzeImageWithGemini(resultId, base64Content, file.type, nfInput);
      } catch (error) {
        console.error("Error processing file", file.name, error);
        updateResult(resultId, { status: 'rejected', errorMessage: 'Erro ao ler arquivo' });
      }
    }));

    setIsProcessing(false);
  };

  const updateResult = (id: string, updates: Partial<FiscalNoteResult>) => {
    setResults(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const analyzeImageWithGemini = async (resultId: string, base64Image: string, mimeType: string, expectedNf: string) => {
    try {
      if (!process.env.API_KEY) {
        throw new Error("Chave de API não configurada");
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            },
            {
              text: `Você é um especialista em logística. Analise esta imagem.
              O número de Nota Fiscal (NF) esperado é: "${expectedNf}".

              Regras:
              1. Classifique a imagem como "CANHOTO" (papel de comprovante, nota fiscal, recibo), "MERCADORIA" (caixas, produtos, caminhão) ou "OUTRO".
              2. Se for "CANHOTO", procure pelo número da NF "${expectedNf}" na imagem. Pode estar manuscrito ou impresso.
              3. Se for "CANHOTO", verifique se há uma assinatura (rabisco, nome escrito) no campo de recebedor.

              Retorne o resultado em JSON seguindo exatamente o schema.`
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              classification: { 
                type: Type.STRING, 
                enum: ["CANHOTO", "MERCADORIA", "OUTRO"],
                description: "Classificação do tipo de imagem" 
              },
              nfNumberFound: { 
                type: Type.STRING, 
                description: "O número da NF encontrado na imagem (se houver)",
                nullable: true 
              },
              isNfMatch: { 
                type: Type.BOOLEAN, 
                description: "Verdadeiro se o número encontrado corresponde ao esperado" 
              },
              isSigned: { 
                type: Type.BOOLEAN, 
                description: "Verdadeiro se houver uma assinatura visual visível" 
              },
              confidence: { 
                type: Type.NUMBER, 
                description: "Nível de confiança da análise (0 a 1)" 
              }
            },
            required: ["classification", "isNfMatch", "isSigned", "confidence"]
          }
        }
      });

      let jsonText = response.text;
      if (!jsonText) throw new Error("Sem resposta da IA");

      // Clean Markdown code blocks if present (e.g. ```json ... ```)
      jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

      let aiData;
      try {
        aiData = JSON.parse(jsonText);
      } catch (e) {
        console.error("JSON Parse Error", jsonText);
        throw new Error("Erro ao interpretar resposta da IA");
      }

      // Determine final status based on rules
      let finalStatus: FiscalNoteResult['status'] = 'review';

      if (aiData.classification === 'CANHOTO') {
        if (aiData.isNfMatch && aiData.isSigned) {
          finalStatus = 'validated';
        } else if (!aiData.isNfMatch) {
          finalStatus = 'rejected'; // Canhoto but wrong NF
        } else {
          finalStatus = 'review'; // Canhoto, match NF, but maybe not signed or low confidence
        }
      } else if (aiData.classification === 'MERCADORIA') {
        finalStatus = 'review'; // Might be valid proof of condition, but not a receipt
      } else {
        finalStatus = 'rejected';
      }

      updateResult(resultId, {
        status: finalStatus,
        aiData: aiData
      });

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      updateResult(resultId, { 
        status: 'rejected', 
        errorMessage: error.message || 'Falha na análise da IA' 
      });
    }
  };

  const removeResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
  };

  // Filter logic
  const [filterType, setFilterType] = useState<'all' | 'validated' | 'review' | 'processing'>('all');
  
  const filteredResults = results.filter(r => {
    if (filterType === 'all') return true;
    if (filterType === 'processing') return r.status === 'processing';
    if (filterType === 'validated') return r.status === 'validated';
    if (filterType === 'review') return r.status === 'review' || r.status === 'rejected'; // Group rejected with review for this UI
    return true;
  });

  const counts = {
    validated: results.filter(r => r.status === 'validated').length,
    review: results.filter(r => r.status === 'review' || r.status === 'rejected').length,
    processing: results.filter(r => r.status === 'processing').length
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Validador de Canhotos de Entrega</h1>
          <p className="text-slate-500 mt-1">Verificação alimentada por IA para comprovantes de entrega e notas fiscais.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm">
            <History size={18} />
            Histórico
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form Inputs */}
            <div className="lg:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="nf-number">
                  Número da Nota Fiscal (NF-e)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash size={18} className="text-slate-400" />
                  </div>
                  <input
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all sm:text-sm"
                    id="nf-number"
                    placeholder="Ex: 450912001"
                    type="text"
                    value={nfInput}
                    onChange={(e) => setNfInput(e.target.value)}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Digite o número da NF para conciliar com o canhoto.</p>
              </div>
              <div className="pt-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!nfInput || isProcessing}
                  className={`w-full font-medium py-2.5 px-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 ${
                    !nfInput || isProcessing 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary-hover text-white hover:shadow-lg'
                  }`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18}/> : <Wand2 size={18} />}
                  {isProcessing ? 'Processando...' : 'Selecionar Imagens & Validar'}
                </button>
              </div>
            </div>
            
            {/* Dropzone */}
            <div className="lg:col-span-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                multiple 
                accept="image/*"
              />
              <div 
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors h-40 group ${
                  !isProcessing ? 'cursor-pointer hover:border-primary hover:bg-primary/5' : 'cursor-default opacity-50'
                }`}
              >
                <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <CloudUpload className="text-primary h-6 w-6" />
                </div>
                <p className="text-sm text-slate-900 font-medium">Clique para enviar ou arraste e solte</p>
                <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPG (máx. 5MB)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1 overflow-x-auto">
          <div className="flex gap-6 min-w-max">
            <button 
              onClick={() => setFilterType('all')}
              className={`pb-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${filterType === 'all' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setFilterType('validated')}
              className={`pb-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${filterType === 'validated' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Validados <span className="ml-1 bg-green-100 text-green-700 py-0.5 px-2 rounded-full text-xs">{counts.validated}</span>
            </button>
            <button 
              onClick={() => setFilterType('review')}
              className={`pb-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${filterType === 'review' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Revisão Necessária <span className="ml-1 bg-yellow-100 text-yellow-700 py-0.5 px-2 rounded-full text-xs">{counts.review}</span>
            </button>
            <button 
              onClick={() => setFilterType('processing')}
              className={`pb-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${filterType === 'processing' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              Processando <span className="ml-1 bg-slate-100 text-slate-600 py-0.5 px-2 rounded-full text-xs">{counts.processing}</span>
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 pl-4">
            <Filter size={18} />
            Filtros
          </div>
        </div>

        {/* Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          
          {filteredResults.length === 0 && (
             <div className="col-span-full py-12 text-center text-slate-400">
                <FileText className="mx-auto h-12 w-12 mb-3 opacity-20" />
                <p>Nenhuma imagem processada ainda.</p>
             </div>
          )}

          {filteredResults.map((result) => (
            <div key={result.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col overflow-hidden group relative">
              
              {/* Image Area */}
              <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
                {result.status === 'processing' ? (
                  <div className="flex flex-col items-center gap-2 z-10">
                     <Loader2 className="h-8 w-8 text-primary animate-spin" />
                     <span className="text-xs font-medium text-slate-500">Analisando IA...</span>
                  </div>
                ) : (
                  <img 
                    className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${result.status === 'rejected' ? 'grayscale opacity-75' : ''}`}
                    src={result.imageUrl}
                    alt="Documento"
                  />
                )}
                
                {/* Classification Badge */}
                {result.aiData && (
                  <div className="absolute top-3 left-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-sm ${
                      result.aiData.classification === 'CANHOTO' 
                        ? 'bg-blue-100 text-blue-800 border-blue-200' 
                        : 'bg-slate-100 text-slate-800 border-slate-200'
                    }`}>
                      {result.aiData.classification}
                    </span>
                  </div>
                )}

                {/* Remove Button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => removeResult(result.id)} className="bg-white/90 p-1.5 rounded-lg shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => window.open(result.imageUrl, '_blank')} className="bg-white/90 p-1.5 rounded-lg shadow-sm hover:bg-primary hover:text-white transition-colors">
                    <Search size={16} />
                  </button>
                </div>
              </div>

              {/* Status Header */}
              {result.status === 'validated' && (
                <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex items-start gap-2">
                   <CheckCircle2 size={14} className="text-green-600 mt-0.5" />
                   <p className="text-xs text-green-800 font-medium">Validado Automaticamente</p>
                </div>
              )}
               {result.status === 'review' && (
                <div className="bg-amber-50 px-4 py-2 border-b border-amber-100 flex items-start gap-2">
                   <AlertTriangle size={14} className="text-amber-500 mt-0.5" />
                   <p className="text-xs text-amber-800 font-medium">Revisão Necessária</p>
                </div>
              )}
              {result.status === 'rejected' && (
                <div className="bg-red-50 px-4 py-2 border-b border-red-100 flex items-start gap-2">
                   <XCircle size={14} className="text-red-500 mt-0.5" />
                   <p className="text-xs text-red-800 font-medium">{result.errorMessage || 'Rejeitado'}</p>
                </div>
              )}

              {/* Content Details */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                
                {result.status === 'processing' ? (
                   <div className="space-y-2 mt-2">
                     <div className="h-3 bg-slate-100 rounded w-full animate-pulse"></div>
                     <div className="h-3 bg-slate-100 rounded w-2/3 animate-pulse"></div>
                   </div>
                ) : result.aiData ? (
                  <div className="space-y-2">
                    {/* NF Match Check */}
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${result.aiData.isNfMatch ? 'bg-green-100' : 'bg-red-100'}`}>
                        {result.aiData.isNfMatch 
                          ? <Check size={12} className="text-green-600" /> 
                          : <XCircle size={12} className="text-red-600" />
                        }
                      </div>
                      <span className={`truncate ${!result.aiData.isNfMatch ? 'text-red-600' : 'text-slate-700'}`}>
                        NF: {result.aiData.nfNumberFound || 'Não encontrada'}
                      </span>
                    </div>

                    {/* Signature Check */}
                    {result.aiData.classification === 'CANHOTO' && (
                      <div className="flex items-center gap-2 text-sm">
                         <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${result.aiData.isSigned ? 'bg-green-100' : 'bg-slate-100'}`}>
                          {result.aiData.isSigned 
                            ? <Check size={12} className="text-green-600" /> 
                            : <HelpCircle size={12} className="text-slate-400" />
                          }
                        </div>
                        <span className="text-slate-700">
                          {result.aiData.isSigned ? 'Assinatura Detectada' : 'Sem Assinatura'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    {result.status === 'rejected' && !result.errorMessage 
                      ? 'Processamento falhou' 
                      : 'Aguardando processamento...'}
                  </p>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};