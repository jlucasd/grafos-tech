import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  ZoomIn, 
  Upload, 
  Edit3, 
  AlertCircle, 
  TriangleAlert, 
  ArrowRight, 
  Flag, 
  Check,
  Loader2,
  RefreshCw,
  Save
} from 'lucide-react';
import { ASSETS, Vehicle, VerificationData } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface ValidationCardProps {
  vehicles: Vehicle[];
  onValidationComplete: (data: VerificationData) => void;
}

export const ValidationCard: React.FC<ValidationCardProps> = ({ vehicles, onValidationComplete }) => {
  // Application State
  const [imageSrc, setImageSrc] = useState<string>(ASSETS.dashboard);
  const [manualMileage, setManualMileage] = useState<string>('12500');
  const [aiMileage, setAiMileage] = useState<number | null>(12580);
  const [confidence, setConfidence] = useState<number>(0.98);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'divergence' | 'error'>('divergence');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehicles.length > 0 ? vehicles[0].id : '');
  const [isSaved, setIsSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update selected vehicle if the list changes and current selection is invalid
  useEffect(() => {
    if (vehicles.length > 0 && !vehicles.find(v => v.id === selectedVehicleId)) {
        setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  // Derived state
  const numericManual = parseInt(manualMileage.replace(/\D/g, '') || '0', 10);
  const hasDivergence = aiMileage !== null && numericManual !== aiMileage;

  // Effect to update status based on values
  useEffect(() => {
    // Only update status if we haven't saved yet (lock state after save)
    if (!isSaved) {
      if (aiMileage !== null && hasDivergence) {
        setStatus('divergence');
      } else if (aiMileage !== null && !hasDivergence) {
        setStatus('success');
      }
    }
  }, [manualMileage, aiMileage, hasDivergence, isSaved]);

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handler: File Selection
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsAnalyzing(true);
      setErrorMessage('');
      setIsSaved(false); // Reset saved state for new image
      const base64Data = await fileToBase64(file);
      setImageSrc(base64Data);
      
      // Extract clean base64 string (remove data:image/jpeg;base64, prefix)
      const base64Content = base64Data.split(',')[1];
      await analyzeImageWithGemini(base64Content, file.type);
      
    } catch (error) {
      console.error("Error processing file:", error);
      setErrorMessage("Erro ao processar a imagem.");
      setIsAnalyzing(false);
    }
  };

  // Function: Call Gemini API
  const analyzeImageWithGemini = async (base64Image: string, mimeType: string) => {
    try {
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
              text: "Analyze this dashboard image. Identify the odometer reading (total distance traveled). Ignore trip meters (usually smaller numbers or with decimals). Return the value as an integer."
            }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mileage: { type: Type.INTEGER, description: "The odometer reading value" },
              confidence: { type: Type.NUMBER, description: "Confidence score between 0 and 1" }
            },
            required: ["mileage", "confidence"]
          }
        }
      });

      const jsonText = response.text;
      if (jsonText) {
        const result = JSON.parse(jsonText);
        setAiMileage(result.mileage);
        setConfidence(result.confidence);
        // Auto-fill manual mileage for UX convenience if it was empty/zero
        if (numericManual === 0) {
            setManualMileage(String(result.mileage));
        }
      } else {
        throw new Error("No data returned");
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      setErrorMessage("Não foi possível ler o odômetro. Tente uma foto mais clara.");
      setAiMileage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const completeValidation = (finalMileage: number) => {
    const data: VerificationData = {
      id: Math.random().toString(36).substr(2, 9),
      imageUrl: imageSrc,
      imageDate: new Date().toISOString(),
      imageSize: 'N/A',
      vehicleId: selectedVehicleId,
      manualMileage: finalMileage,
      aiMileage: aiMileage || 0,
      confidence: confidence,
      status: 'success'
    };
    
    onValidationComplete(data);
    setIsSaved(true);
    setStatus('success');
  };

  const handleAcceptAiValue = () => {
    if (aiMileage !== null) {
      setManualMileage(String(aiMileage));
      completeValidation(aiMileage);
    }
  };

  const handleManualConfirm = () => {
    completeValidation(numericManual);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Image Upload/Preview */}
        <div className="p-6 lg:p-8 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col">
          <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <ImageIcon size={18} className="text-primary" />
            Evidência Fotográfica
          </h3>
          
          <div className="flex-1 min-h-[300px] relative rounded-lg overflow-hidden group border-2 border-dashed border-slate-300 hover:border-primary/50 transition-colors bg-white">
            {isAnalyzing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <p className="text-sm text-slate-500 font-medium">Analisando imagem com IA...</p>
              </div>
            ) : (
              <img 
                src={imageSrc}
                alt="Dashboard Speedometer" 
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Hover Actions Overlay */}
            <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[1px] ${isAnalyzing || isSaved ? 'hidden' : 'opacity-0 group-hover:opacity-100'}`}>
              <button 
                onClick={() => window.open(imageSrc, '_blank')}
                className="bg-white/90 hover:bg-white text-slate-800 px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
              >
                <ZoomIn size={16} />
                Expandir
              </button>
              <button 
                onClick={triggerFileUpload}
                className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
              >
                <Upload size={16} />
                Nova Foto
              </button>
            </div>

            {/* AI Focus Box (Simulated visualization of detection) */}
            {!isAnalyzing && aiMileage !== null && (
               <div className="absolute top-[45%] left-[38%] w-32 h-12 border-2 border-primary shadow-[0_0_15px_rgba(19,127,236,0.5)] rounded bg-primary/10 pointer-events-none animate-pulse">
                  <div className="absolute -top-6 left-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-t uppercase">
                     Confidence: {(confidence * 100).toFixed(0)}%
                  </div>
               </div>
            )}
          </div>
          
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 font-mono">
             {errorMessage ? (
               <span className="text-red-500 flex items-center gap-1">
                 <AlertCircle size={14} /> {errorMessage}
               </span>
             ) : (
               <span>Imagem processada</span>
             )}
            {!isSaved && (
              <button onClick={triggerFileUpload} className="text-primary hover:underline">
                Alterar imagem
              </button>
            )}
          </div>
        </div>

        {/* Right: Manual Input & Actions */}
        <div className="p-6 lg:p-8 flex flex-col h-full">
          <h3 className="text-sm font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Edit3 size={18} className="text-primary" />
            Dados da Leitura
          </h3>

          <form className="space-y-6 flex-1" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="vehicle" className="block text-sm font-medium text-slate-700 mb-1.5">
                Veículo
              </label>
              <div className="relative">
                <select
                  id="vehicle"
                  name="vehicle"
                  disabled={isSaved}
                  className="block w-full rounded-lg border-slate-300 bg-white text-slate-900 shadow-sm focus:border-primary focus:ring-primary sm:text-sm py-2.5 pl-3 pr-10 border disabled:bg-slate-100 disabled:text-slate-500"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  {vehicles.length === 0 && <option value="">Nenhum veículo cadastrado</option>}
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} - {v.plate}</option>
                  ))}
                </select>
              </div>
              {vehicles.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  Cadastre veículos no menu "Frota" para prosseguir.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-slate-700 mb-1.5">
                Quilometragem Informada (Manual)
              </label>
              <div className="relative rounded-lg shadow-sm">
                <input
                  type="text" 
                  pattern="[0-9]*"
                  name="mileage"
                  id="mileage"
                  disabled={isSaved}
                  className={`block w-full rounded-lg border sm:text-sm py-2.5 pr-12 focus:outline-none focus:ring-1 transition-all disabled:bg-slate-100 ${
                    status === 'divergence' && !isSaved
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500' 
                      : status === 'success' || isSaved
                        ? 'border-green-300 text-green-900 focus:border-green-500 focus:ring-green-500'
                        : 'border-slate-300 focus:border-primary focus:ring-primary'
                  }`}
                  value={manualMileage}
                  onChange={(e) => setManualMileage(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className={`${status === 'divergence' && !isSaved ? 'text-red-500' : 'text-slate-500'} sm:text-sm font-medium`}>km</span>
                </div>
                {!isSaved && status === 'divergence' && (
                  <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                )}
                {(status === 'success' || isSaved) && (
                  <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                    <Check className="h-5 w-5 text-green-500" aria-hidden="true" />
                  </div>
                )}
              </div>
              {!isSaved && status === 'divergence' && (
                <p className="mt-2 text-sm text-red-600 animate-in slide-in-from-top-1">
                  Valor diverge da leitura automática.
                </p>
              )}
               {(status === 'success' || isSaved) && (
                <p className="mt-2 text-sm text-green-600 animate-in slide-in-from-top-1">
                  Leitura validada.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto">
              {isSaved ? (
                 <button
                 type="button"
                 onClick={() => { setIsSaved(false); setManualMileage(''); setAiMileage(null); setImageSrc(ASSETS.dashboard); }}
                 className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-lg shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
               >
                 <RefreshCw className="w-5 h-5 mr-2 text-slate-500" />
                 Iniciar Nova Verificação
               </button>
              ) : isAnalyzing ? (
                 <button
                 type="button"
                 disabled
                 className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-slate-400 bg-slate-100 cursor-not-allowed"
               >
                 <Loader2 className="w-5 h-5 animate-spin mr-2" />
                 Processando...
               </button>
              ) : (
                <button
                  type="button"
                  onClick={() => analyzeImageWithGemini(imageSrc.split(',')[1], 'image/jpeg')}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Reprocessar Validação
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Validation Result Section */}
      {!isSaved && status === 'divergence' && aiMileage !== null && (
        <div className="border-t border-slate-200 bg-slate-50 p-6 lg:p-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <TriangleAlert className="h-6 w-6 text-red-500" aria-hidden="true" />
              </div>
              <div className="ml-3 w-full">
                <h3 className="text-lg font-medium text-red-800">Divergência Detectada</h3>
                
                <div className="mt-4 flex flex-col sm:flex-row gap-4">
                  {/* Manual Value Chip */}
                  <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-red-100 flex flex-col items-center justify-center">
                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Valor Digitado</span>
                    <span className="text-xl font-bold text-slate-700 font-mono mt-1">
                      {numericManual.toLocaleString('pt-BR')} km
                    </span>
                  </div>

                  <div className="flex items-center justify-center text-red-300">
                    <ArrowRight size={24} />
                  </div>

                  {/* AI Value Chip */}
                  <div className="flex-1 bg-white rounded-lg p-3 shadow-sm border border-primary/20 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl">
                      IA
                    </div>
                    <span className="text-xs text-primary uppercase tracking-wider font-semibold">Extraído pela IA</span>
                    <span className="text-xl font-bold text-primary font-mono mt-1">
                      {aiMileage.toLocaleString('pt-BR')} km
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3 flex-wrap">
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <Flag size={16} className="mr-2" />
                    Marcar para Revisão
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                    onClick={handleAcceptAiValue}
                  >
                    <Check size={16} className="mr-2 text-green-600" />
                    Aceitar Valor da IA
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Success/Saved State */}
      {status === 'success' && (
         <div className="border-t border-slate-200 bg-green-50 p-6 lg:p-8 animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-green-900">
                    {isSaved ? "Validação Salva" : "Validação Pronta"}
                  </h3>
                  <p className="text-green-700">
                    {isSaved ? "O registro foi adicionado ao histórico com sucesso." : "Os valores conferem. Deseja registrar essa leitura?"}
                  </p>
                </div>
              </div>
              
              {!isSaved && (
                <button
                  onClick={handleManualConfirm}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Save size={16} className="mr-2" />
                  Registrar Leitura
                </button>
              )}
            </div>
         </div>
      )}
    </div>
  );
};