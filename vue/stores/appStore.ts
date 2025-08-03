import { ref, computed, reactive, provide, inject, type Ref, type ComputedRef } from 'vue'

// Type definitions
export interface PersonalInfo {
  birthDate: string;
  name: string;
  gender: string;
}

export interface AnalysisResult {
  isHealthInsuranceCard: boolean;
  isMedicineNotebook: boolean;
  isContentVisible: boolean;
  isHealthInsuranceCardStraight: boolean;
  isMedicineNotebookStraight: boolean;
  isHealthInsuranceCardObstructed: boolean;
  isMedicineNotebookObstructed: boolean;
  canReadPersonalInfo: boolean;
  personalInfo: PersonalInfo;
  analysis: string;
  suggestions: string;
}

export interface CameraStatus {
  isStarted: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

export interface VoiceStatus {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
}

export interface SymptomsAnalysisResult {
  matched_categories: string[];
  is_emergency: boolean;
  emergency_reasons: string[];
  emergency_guidance: string | null;
}

// Store interface
export interface AppStore {
  // Camera & Analysis State (reactive refs)
  cameraStatus: Ref<CameraStatus>;
  analysisResult: Ref<AnalysisResult | null>;
  analysisTimestamp: Ref<number>;

  // Voice & Symptoms State (reactive refs)
  voiceStatus: Ref<VoiceStatus>;
  currentTranscript: Ref<string>;
  finalTranscript: Ref<string>;
  allRecognizedText: Ref<string>;
  symptomsAnalysisResult: Ref<SymptomsAnalysisResult | null>;
  symptomsAnalysisTimestamp: Ref<number>;

  // Computed (computed refs)
  hasAnalysisResult: ComputedRef<boolean>;
  hasSymptomsResult: ComputedRef<boolean>;

  // Camera & Analysis Methods
  updateCameraStatus: (status: Partial<CameraStatus>) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  clearAnalysisResult: () => void;

  // Voice & Symptoms Methods
  updateVoiceStatus: (status: Partial<VoiceStatus>) => void;
  updateTranscript: (current: string, final: string, all: string) => void;
  setSymptomsAnalysisResult: (result: SymptomsAnalysisResult) => void;
  clearSymptomsResult: () => void;
  resetVoiceData: () => void;
}

// Store symbol for provide/inject
export const APP_STORE_KEY = Symbol('AppStore')

// Create store function
export function createAppStore(): AppStore {
  // Reactive state
  const cameraStatus = ref<CameraStatus>({
    isStarted: false,
    isAnalyzing: false,
    error: null
  })

  const analysisResult = ref<AnalysisResult | null>(null)
  const analysisTimestamp = ref<number>(0)

  const voiceStatus = ref<VoiceStatus>({
    isRecording: false,
    isProcessing: false,
    error: null
  })

  const currentTranscript = ref<string>('')
  const finalTranscript = ref<string>('')
  const allRecognizedText = ref<string>('')
  const symptomsAnalysisResult = ref<SymptomsAnalysisResult | null>(null)
  const symptomsAnalysisTimestamp = ref<number>(0)

  // Computed values
  const hasAnalysisResult = computed(() => analysisResult.value !== null)
  const hasSymptomsResult = computed(() => symptomsAnalysisResult.value !== null)

  // Camera & Analysis Methods
  const updateCameraStatus = (status: Partial<CameraStatus>) => {
    cameraStatus.value = { ...cameraStatus.value, ...status }
  }

  const setAnalysisResult = (result: AnalysisResult) => {
    analysisResult.value = {
      isHealthInsuranceCard: Boolean(result.isHealthInsuranceCard),
      isMedicineNotebook: Boolean(result.isMedicineNotebook),
      isContentVisible: Boolean(result.isContentVisible),
      isHealthInsuranceCardStraight: Boolean(result.isHealthInsuranceCardStraight),
      isMedicineNotebookStraight: Boolean(result.isMedicineNotebookStraight),
      isHealthInsuranceCardObstructed: Boolean(result.isHealthInsuranceCardObstructed),
      isMedicineNotebookObstructed: Boolean(result.isMedicineNotebookObstructed),
      canReadPersonalInfo: Boolean(result.canReadPersonalInfo),
      personalInfo: {
        birthDate: String(result.personalInfo?.birthDate || ''),
        name: String(result.personalInfo?.name || ''),
        gender: String(result.personalInfo?.gender || '')
      },
      analysis: String(result.analysis || ''),
      suggestions: String(result.suggestions || '')
    }
    analysisTimestamp.value = Date.now()
  }

  const clearAnalysisResult = () => {
    analysisResult.value = null
    analysisTimestamp.value = 0
  }

  // Voice & Symptoms Methods
  const updateVoiceStatus = (status: Partial<VoiceStatus>) => {
    voiceStatus.value = { ...voiceStatus.value, ...status }
  }

  const updateTranscript = (current: string, final: string, all: string) => {
    currentTranscript.value = current
    finalTranscript.value = final
    allRecognizedText.value = all
  }

  const setSymptomsAnalysisResult = (result: SymptomsAnalysisResult) => {
    symptomsAnalysisResult.value = {
      matched_categories: Array.isArray(result.matched_categories) ? result.matched_categories : [],
      is_emergency: Boolean(result.is_emergency),
      emergency_reasons: Array.isArray(result.emergency_reasons) ? result.emergency_reasons : [],
      emergency_guidance: result.emergency_guidance || null
    }
    symptomsAnalysisTimestamp.value = Date.now()
  }

  const clearSymptomsResult = () => {
    symptomsAnalysisResult.value = null
    symptomsAnalysisTimestamp.value = 0
  }

  const resetVoiceData = () => {
    currentTranscript.value = ''
    finalTranscript.value = ''
    allRecognizedText.value = ''
    clearSymptomsResult()
  }

  return {
    // State (return ref objects to maintain reactivity)
    cameraStatus,
    analysisResult,
    analysisTimestamp,
    voiceStatus,
    currentTranscript,
    finalTranscript,
    allRecognizedText,
    symptomsAnalysisResult,
    symptomsAnalysisTimestamp,

    // Computed
    hasAnalysisResult,
    hasSymptomsResult,

    // Methods
    updateCameraStatus,
    setAnalysisResult,
    clearAnalysisResult,
    updateVoiceStatus,
    updateTranscript,
    setSymptomsAnalysisResult,
    clearSymptomsResult,
    resetVoiceData
  }
}

// Provide store function
export function provideAppStore() {
  const store = createAppStore()
  provide(APP_STORE_KEY, store)
  return store
}

// Inject store function
export function useAppStore(): AppStore {
  const store = inject<AppStore>(APP_STORE_KEY)
  if (!store) {
    throw new Error('AppStore not provided')
  }
  return store
}
