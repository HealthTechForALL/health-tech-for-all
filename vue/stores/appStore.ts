import { ref, computed, reactive, provide, inject, type Ref, type ComputedRef } from 'vue'

// Type definitions
export interface PersonalInfo {
  birthDate: string;
  name: string;
  gender: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  category: 'document' | 'medicine' | 'address';
}

export interface TaskList {
  items: TaskItem[];
  completedCount: number;
  totalCount: number;
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
  profile_name_first_kana: string;
  profile_name_last_kana: string;
  profile_phone: string;
  matched_categories: string[];
  is_emergency: boolean;
  emergency_reasons: string[];
  emergency_guidance: string | null;
}

export interface PatientInfo {
  profile_name_first_kana: string;
  profile_name_last_kana: string;
  profile_phone: string;
}

export interface FormData {
  symptoms_categories: string[];
  symptoms: string;
  profile_name_first_kana: string;
  profile_name_last_kana: string;
  profile_gender: string;
  profile_birthday_year: number;
  profile_birthday_month: number;
  profile_birthday_day: number;
  profile_phone: string;
  profile_location_zip: string;
  profile_location_prefecture: string;
  profile_location_municipality: string;
  profile_location_town: string;
  profile_location_house_number: string;
  profile_location_building_and_room_number: string;
  base64_image_insurance_card: string;
  base64_image_medication_notebook: string;
  base64_image_credentials_information: string;
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

  // Patient Info State (reactive ref)
  patientInfo: Ref<PatientInfo>;

  // Form Data (reactive refs)
  formData: Ref<FormData | null>;

  // Task List State (reactive refs)
  taskList: Ref<TaskList>;

  // Computed (computed refs)
  hasAnalysisResult: ComputedRef<boolean>;
  hasSymptomsResult: ComputedRef<boolean>;
  taskProgress: ComputedRef<string>;

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

  // Patient Info Methods
  updatePatientInfo: (info: Partial<PatientInfo>) => void;
  clearPatientInfo: () => void;

  // Task List Methods
  initializeTasks: () => void;
  updateTaskStatus: (taskId: string, status: 'pending' | 'completed') => void;
  markTaskCompleted: (taskId: string) => void;
  resetTasks: () => void;

  // LocalStorage Methods
  saveFormDataToLocalStorage: () => void;
  loadFormDataFromLocalStorage: () => FormData | null;
  clearFormDataFromLocalStorage: () => void;
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

  // Patient Info State
  const patientInfo = ref<PatientInfo>({
    profile_name_first_kana: '',
    profile_name_last_kana: '',
    profile_phone: ''
  })

  const formData = ref<FormData | null>(null)

  // Task List State
  const taskList = ref<TaskList>({
    items: [],
    completedCount: 0,
    totalCount: 0
  })

  // Computed values
  const hasAnalysisResult = computed(() => analysisResult.value !== null)
  const hasSymptomsResult = computed(() => symptomsAnalysisResult.value !== null)
  const taskProgress = computed(() => {
    const { completedCount, totalCount } = taskList.value
    return `${completedCount}/${totalCount}完了`
  })

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
      profile_name_first_kana: result.profile_name_first_kana || '',
      profile_name_last_kana: result.profile_name_last_kana || '',
      profile_phone: result.profile_phone || '',
      matched_categories: Array.isArray(result.matched_categories) ? result.matched_categories : [],
      is_emergency: Boolean(result.is_emergency),
      emergency_reasons: Array.isArray(result.emergency_reasons) ? result.emergency_reasons : [],
      emergency_guidance: result.emergency_guidance || null
    }
    symptomsAnalysisTimestamp.value = Date.now()

    // Update patient info state with the extracted information
    updatePatientInfo({
      profile_name_first_kana: result.profile_name_first_kana || '',
      profile_name_last_kana: result.profile_name_last_kana || '',
      profile_phone: result.profile_phone || ''
    })
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
    clearPatientInfo()

    // Clear FormData from localStorage when resetting voice data
    clearFormDataFromLocalStorage()
  }

  // Patient Info Methods
  const updatePatientInfo = (info: Partial<PatientInfo>) => {
    patientInfo.value = { ...patientInfo.value, ...info }
  }

  const clearPatientInfo = () => {
    patientInfo.value = {
      profile_name_first_kana: '',
      profile_name_last_kana: '',
      profile_phone: ''
    }
  }

  // Task List Methods
  const initializeTasks = () => {
    const defaultTasks: TaskItem[] = [
      {
        id: 'insurance_card',
        title: '健康保険証等の提示',
        description: '健康保険証もしくはマイナンバーカードもしくは「資格情報のお知らせ」の紙を見せてください',
        status: 'pending',
        category: 'document'
      },
      {
        id: 'medicine_notebook',
        title: 'おくすり手帳の提示',
        description: 'おくすり手帳の中のページを見せてください (表紙ではなく中身をお願いいたします)',
        status: 'pending',
        category: 'medicine'
      },
      {
        id: 'address_verification',
        title: '住所確認書類の提示',
        description: '運転免許証や郵便物など住所がわかるものを見せてください',
        status: 'pending',
        category: 'address'
      }
    ]

    taskList.value = {
      items: defaultTasks,
      completedCount: 0,
      totalCount: defaultTasks.length
    }
  }

  const updateTaskStatus = (taskId: string, status: 'pending' | 'completed') => {
    const task = taskList.value.items.find(item => item.id === taskId)
    if (task) {
      task.status = status
      // Update completed count
      taskList.value.completedCount = taskList.value.items.filter(item => item.status === 'completed').length
    }
  }

  const markTaskCompleted = (taskId: string) => {
    updateTaskStatus(taskId, 'completed')
  }

  const resetTasks = () => {
    initializeTasks()
  }

  // LocalStorage Methods
  const saveFormDataToLocalStorage = () => {
    try {
      // Create FormData object with current state values
      const currentFormData: FormData = {
        symptoms_categories: symptomsAnalysisResult.value?.matched_categories || [],
        symptoms: allRecognizedText.value || '',
        profile_name_first_kana: patientInfo.value.profile_name_first_kana || '',
        profile_name_last_kana: patientInfo.value.profile_name_last_kana || '',
        profile_gender: analysisResult.value?.personalInfo?.gender || '',
        profile_birthday_year: analysisResult.value?.personalInfo?.birthDate ? new Date(analysisResult.value.personalInfo.birthDate).getFullYear() : 0,
        profile_birthday_month: analysisResult.value?.personalInfo?.birthDate ? new Date(analysisResult.value.personalInfo.birthDate).getMonth() + 1 : 0,
        profile_birthday_day: analysisResult.value?.personalInfo?.birthDate ? new Date(analysisResult.value.personalInfo.birthDate).getDate() : 0,
        profile_phone: patientInfo.value.profile_phone || '',
        profile_location_zip: '',
        profile_location_prefecture: '',
        profile_location_municipality: '',
        profile_location_town: '',
        profile_location_house_number: '',
        profile_location_building_and_room_number: '',
        base64_image_insurance_card: '',
        base64_image_medication_notebook: '',
        base64_image_credentials_information: ''
      }

      localStorage.setItem('formData', JSON.stringify(currentFormData))
      console.log('FormData saved to localStorage:', currentFormData)
    } catch (error) {
      console.error('Error saving FormData to localStorage:', error)
    }
  }

  const loadFormDataFromLocalStorage = (): FormData | null => {
    try {
      const stored = localStorage.getItem('formData')
      if (stored) {
        const parsedData = JSON.parse(stored) as FormData
        console.log('FormData loaded from localStorage:', parsedData)
        return parsedData
      }
    } catch (error) {
      console.error('Error loading FormData from localStorage:', error)
    }
    return null
  }

  const clearFormDataFromLocalStorage = () => {
    try {
      localStorage.removeItem('formData')
      console.log('FormData cleared from localStorage')
    } catch (error) {
      console.error('Error clearing FormData from localStorage:', error)
    }
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
    patientInfo,
    formData,
    taskList,

    // Computed
    hasAnalysisResult,
    hasSymptomsResult,
    taskProgress,

    // Methods
    updateCameraStatus,
    setAnalysisResult,
    clearAnalysisResult,
    updateVoiceStatus,
    updateTranscript,
    setSymptomsAnalysisResult,
    clearSymptomsResult,
    resetVoiceData,

    // Patient Info Methods
    updatePatientInfo,
    clearPatientInfo,

    // Task List Methods
    initializeTasks,
    updateTaskStatus,
    markTaskCompleted,
    resetTasks,

    // LocalStorage Methods
    saveFormDataToLocalStorage,
    loadFormDataFromLocalStorage,
    clearFormDataFromLocalStorage
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
