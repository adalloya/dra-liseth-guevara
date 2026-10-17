export interface ToothIPR {
  toothFDI: number;
  name: string;
  status: 'aligned' | 'ipr' | 'critical' | 'missing';
  diagnosis: string;
  iprMesial: number; // Ej. 0.3
  iprDistal: number; // Ej. 0.3
  biomechanics: string;
}

export interface MonthlyStage {
  phase: 'fase1' | 'fase2' | 'fase3';
  months: string;
  archwire: string;
  title: string;
  chairsideAction: string;
  expectedMovement: string;
}

export interface ClinicalStudyData {
  durationMonths: number;
  complexity: string;
  anchorage: string;
  summary: {
    skeletal: string;
    vertical: string;
    dentalFormula: string;
    rootAlert: string;
  };
  cephalometrics: Array<{
    parameter: string;
    finding: string;
    norm: string;
    implication: string;
  }>;
  additionalTreatments: string[];
  risks: Array<{
    title: string;
    level: 'Alto' | 'Medio-Alto' | 'Moderado';
    mitigation: string;
  }>;
  odontogram: Record<number, ToothIPR>;
  roadmap: MonthlyStage[];
  retentionProtocol: string;
}
