export interface Vehicle {
  id: string;
  name: string;
  plate: string;
  status: 'active' | 'inactive';
}

export interface VerificationData {
  id: string;
  imageUrl: string;
  imageDate: string;
  imageSize: string;
  vehicleId: string;
  manualMileage: number;
  aiMileage: number;
  confidence: number;
  status: 'pending' | 'success' | 'divergence';
}

export interface FiscalNoteResult {
  id: string;
  fileName: string;
  imageUrl: string;
  status: 'processing' | 'validated' | 'review' | 'rejected';
  aiData?: {
    classification: 'CANHOTO' | 'MERCADORIA' | 'OUTRO';
    nfNumberFound: string | null;
    isNfMatch: boolean;
    isSigned: boolean;
    confidence: number;
  };
  errorMessage?: string;
}

export const MOCK_VEHICLES: Vehicle[] = [
  { id: '1', name: 'VOLVO FH 540', plate: 'ABC-1234', status: 'active' },
  { id: '2', name: 'SCANIA R 450', plate: 'XYZ-9876', status: 'active' },
  { id: '3', name: 'MERCEDES ACTROS', plate: 'DEF-5678', status: 'inactive' },
];

// URLs provided by the user in the prompt
export const ASSETS = {
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDI2PTkpGqCTLPgTb_7zkjVWKoWhNnv5yHYB11sXgx2SpU3FIrRSCIK5YHTL4kULmP4DyI6uz42mlqaAxPSfscgMxpT5bB1Syq9B1FVp16M_i1TVInXsyYE42mrftfPyyinSYt8DRYQ_--Qm5bkqOJ2n_az0EyxWtHO05YIwnirKfwHKM4fTYn9odLl2PbBkAduazFJC08L34EJ-gKGs8Uc9Ocg3v8m430qf5B6BRLGnrxa_rYBdAL1Z-bEPDKHr4SAAdw-J59ZLss",
  dashboard: "https://lh3.googleusercontent.com/aida-public/AB6AXuDcsd0nTzjmRuNukGI5iXJKhzE8Mt6gPEAoNNr5iWRhF0tVTiASOBOal_D_kjo6Q1SAgIekpIBUAf7_2OQkhjgr930gAcW4TAhs23TB75ohBqdLMPhDreJK-yGYvwoXZuU2P0Y4JX4X7TyHRdBgeqeqHRQebyQYr6npIHo6mcQh5Tvoo0-EauUXyljWUDE1sA95m5PaFZyP7gz7homPLKvUf1ZEyKC4tmRnj7LL_xz8lNZ4RRF5yye9FbCsHXV1mTJlndZQ_jTdXcc"
};