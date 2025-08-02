<template>
  <div class="app">
    <div class="container">
      <h1>📋 健康保険証・おくすり手帳 判定システム</h1>

      <div class="main-content">
        <!-- Camera Section -->
        <div class="camera-section">
          <h2>📷 カメラ</h2>
          <div class="camera-container">
            <video
              ref="videoRef"
              autoplay
              muted
              playsinline
              class="video"
            ></video>
            <canvas
              ref="canvasRef"
              style="display: none;"
            ></canvas>
          </div>
          <div class="camera-controls">
            <button
              @click="startCamera"
              :disabled="cameraStatus.isStarted"
              class="btn"
            >
              カメラ開始
            </button>
            <button
              @click="stopCamera"
              :disabled="!cameraStatus.isStarted"
              class="btn"
            >
              カメラ停止
            </button>
            <button
              @click="captureAndAnalyze"
              :disabled="!cameraStatus.isStarted || cameraStatus.isAnalyzing"
              class="btn"
            >
              {{ cameraStatus.isAnalyzing ? '分析中...' : '撮影・判定' }}
            </button>
          </div>
          <div
            v-if="cameraStatus.error"
            class="error-message"
          >
            {{ cameraStatus.error }}
          </div>
        </div>

        <!-- Results Section -->
        <div class="results-section">
          <h2>🔍 判定結果</h2>
          <div class="analysis-results">
            <div
              v-if="!hasResult"
              class="waiting-state"
            >
              判定結果を待機中...
            </div>
            <div
              v-else
              class="analysis-result"
              :key="analysisResultKey"
            >
              <!-- Health Insurance Status -->
              <div
                :class="['status-indicator', getStatusClass(analysisResult!.isHealthInsuranceCard)]"
              >
                <span class="status-icon">🏥</span>
                <span>{{ healthInsuranceMessage }}</span>
                <span class="debug-value">isHealthInsuranceCard: {{ analysisResult!.isHealthInsuranceCard }}</span>
              </div>

              <!-- Medicine Notebook Status -->
              <div
                :class="['status-indicator', getStatusClass(analysisResult!.isMedicineNotebook)]"
              >
                <span class="status-icon">💊</span>
                <span>{{ medicineNotebookMessage }}</span>
                <span class="debug-value">isMedicineNotebook: {{ analysisResult!.isMedicineNotebook }}</span>
              </div>

              <!-- Content Visibility Status -->
              <div
                :class="['status-indicator', getStatusClass(analysisResult!.isContentVisible)]"
              >
                <span class="status-icon">👁️</span>
                <span>{{ contentVisibilityMessage }}</span>
                <span class="debug-value">isContentVisible: {{ analysisResult!.isContentVisible }}</span>
              </div>

              <!-- Health Insurance Card Orientation Status -->
              <div
                v-if="analysisResult!.isHealthInsuranceCard"
                :class="['status-indicator', getStatusClass(analysisResult!.isHealthInsuranceCardStraight)]"
              >
                <span class="status-icon">📐</span>
                <span>{{ healthInsuranceOrientationMessage }}</span>
                <span class="debug-value">isHealthInsuranceCardStraight: {{ analysisResult!.isHealthInsuranceCardStraight }}</span>
              </div>

              <!-- Medicine Notebook Orientation Status -->
              <div
                v-if="analysisResult!.isMedicineNotebook"
                :class="['status-indicator', getStatusClass(analysisResult!.isMedicineNotebookStraight)]"
              >
                <span class="status-icon">📐</span>
                <span>{{ medicineNotebookOrientationMessage }}</span>
                <span class="debug-value">isMedicineNotebookStraight: {{ analysisResult!.isMedicineNotebookStraight }}</span>
              </div>

              <!-- Health Insurance Card Obstruction Status -->
              <div
                v-if="analysisResult!.isHealthInsuranceCard"
                :class="['status-indicator', getStatusClass(!analysisResult!.isHealthInsuranceCardObstructed)]"
              >
                <span class="status-icon">🤚</span>
                <span>{{ healthInsuranceObstructionMessage }}</span>
                <span class="debug-value">isHealthInsuranceCardObstructed: {{ analysisResult!.isHealthInsuranceCardObstructed }}</span>
              </div>

              <!-- Medicine Notebook Obstruction Status -->
              <div
                v-if="analysisResult!.isMedicineNotebook"
                :class="['status-indicator', getStatusClass(!analysisResult!.isMedicineNotebookObstructed)]"
              >
                <span class="status-icon">🤚</span>
                <span>{{ medicineNotebookObstructionMessage }}</span>
                <span class="debug-value">isMedicineNotebookObstructed: {{ analysisResult!.isMedicineNotebookObstructed }}</span>
              </div>

              <!-- Personal Information Reading Status -->
              <div
                v-if="analysisResult!.isHealthInsuranceCard"
                :class="['status-indicator', getStatusClass(analysisResult!.canReadPersonalInfo)]"
              >
                <span class="status-icon">📋</span>
                <span>{{ personalInfoMessage }}</span>
                <span class="debug-value">canReadPersonalInfo: {{ analysisResult!.canReadPersonalInfo }}</span>
              </div>

              <!-- Personal Information Details -->
              <div
                v-if="analysisResult!.canReadPersonalInfo && hasPersonalInfo"
                class="personal-info-details"
              >
                <h3>📝 読み取った個人情報</h3>
                <div class="personal-info-item" v-if="analysisResult!.personalInfo.name">
                  <span class="info-label">氏名:</span>
                  <span class="info-value">{{ analysisResult!.personalInfo.name }}</span>
                </div>
                <div class="personal-info-item" v-if="analysisResult!.personalInfo.birthDate">
                  <span class="info-label">生年月日:</span>
                  <span class="info-value">{{ analysisResult!.personalInfo.birthDate }}</span>
                </div>
                <div class="personal-info-item" v-if="analysisResult!.personalInfo.gender">
                  <span class="info-label">性別:</span>
                  <span class="info-value">{{ analysisResult!.personalInfo.gender }}</span>
                </div>
              </div>

              <!-- Analysis Text -->
              <div
                v-if="analysisResult!.analysis"
                class="analysis-text"
              >
                {{ analysisResult!.analysis }}
              </div>

              <!-- Suggestions -->
              <div
                v-if="analysisResult!.suggestions"
                class="suggestions"
              >
                <strong>改善提案:</strong><br>
                {{ analysisResult!.suggestions }}
              </div>

              <!-- Debug: Raw API Response -->
              <div class="debug-info">
                <details>
                  <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">🔧 デバッグ情報（開発者用）</summary>
                  <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">{{ JSON.stringify(analysisResult, null, 2) }}</pre>
                </details>
              </div>
            </div>
          </div>
        </div>

        <!-- 症状チェックコーナー -->
        <div class="voice-chat-section">
          <h2>🩺 症状チェックコーナー</h2>
          <div class="voice-intro">
            <p class="intro-message">はじめまして！「症状を聞かせる」ボタンを押した後、症状を教えてください！</p>
            <br />
            <p class="example-message">例）12/04頃から発熱。頭も少し痛い。</p>
          </div>
          <div class="voice-controls">
            <button
              @click="toggleVoiceChat"
              :disabled="!isWebSpeechSupported || voiceStatus.isProcessing"
              class="btn voice-btn"
              :class="{ 'recording': voiceStatus.isRecording }"
            >
              {{ voiceStatus.isRecording ? '以上です（症状を喋り終わったらここ押してください）' : '症状を聞かせる' }}
            </button>
            <div
              v-if="!isWebSpeechSupported"
              class="error-message"
            >
              お使いのブラウザは音声認識をサポートしていません
            </div>
            <div
              v-if="voiceStatus.error"
              class="error-message"
            >
              {{ voiceStatus.error }}
            </div>
          </div>
          <div class="voice-display">
            <div class="transcript-area">
              <h3>📝 認識中の音声</h3>
              <div
                class="transcript-content"
                :class="{ 'listening': voiceStatus.isRecording }"
              >
                <div v-if="voiceStatus.isRecording && !currentTranscript" class="listening-indicator">
                  🎤 症状を聞かせてください...<br>
                  <small>（「以上です」や「おわります」と発言すると終了できます）</small>
                </div>
                <div v-if="currentTranscript" class="current-transcript">
                  {{ currentTranscript }}
                </div>
                <div v-if="!voiceStatus.isRecording && !finalTranscript" class="waiting-voice">
                  音声認識待機中
                </div>
                <div v-if="allRecognizedText" class="final-transcript">
                  <strong>最終認識結果:</strong><br>
                  {{ allRecognizedText }}
                </div>
              </div>
            </div>
          </div>

          <!-- 音声認識結果の表示 -->
          <div v-if="allRecognizedText" class="voice-result-section">
            <h3>🎯 認識した症状</h3>
            <div class="voice-result-content">
              <div class="recognized-text">
                {{ allRecognizedText }}
              </div>
              <div class="result-actions">
                <p class="result-instruction">
                  内容が正しければそのまま、違う場合は「症状を聞かせる」ボタンを押して再度お話しください。
                </p>
                <button
                  @click="startVoiceRecognition"
                  :disabled="voiceStatus.isRecording || voiceStatus.isProcessing"
                  class="btn retry-btn"
                >
                  症状を聞かせ直す
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Web Speech API type definitions
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

// Type definitions
interface PersonalInfo {
  birthDate: string;
  name: string;
  gender: string;
}

interface AnalysisResult {
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

interface CameraStatus {
  isStarted: boolean;
  isAnalyzing: boolean;
  error: string | null;
}

interface VoiceStatus {
  isRecording: boolean;
  isProcessing: boolean;
  error: string | null;
}

// Refs
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()

// Reactive State - すべてのstateを一箇所で管理
const cameraStatus = ref<CameraStatus>({
  isStarted: false,
  isAnalyzing: false,
  error: null
})

const voiceStatus = ref<VoiceStatus>({
  isRecording: false,
  isProcessing: false,
  error: null
})

const analysisResult = ref<AnalysisResult | null>(null)
const analysisTimestamp = ref<number>(0)

// Voice recognition related refs
const currentTranscript = ref<string>('')
const finalTranscript = ref<string>('')
const allRecognizedText = ref<string>('')  // 全ての認識結果を蓄積
const recognition = ref<SpeechRecognition | null>(null)

// Computed
const hasResult = computed(() => {
  const result = analysisResult.value !== null
  console.log('hasResult computed:', result, analysisResult.value)
  return result
})

// Web Speech API support check
const isWebSpeechSupported = computed(() => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
})

// Key to force re-render when analysis result changes
const analysisResultKey = computed(() => {
  return analysisTimestamp.value
})

const healthInsuranceMessage = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.isHealthInsuranceCard
    ? '✅ 健康保険証を検出しました'
    : '❌ 健康保険証は検出されませんでした'
})

const medicineNotebookMessage = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.isMedicineNotebook
    ? '✅ おくすり手帳を検出しました'
    : '❌ おくすり手帳は検出されませんでした'
})

const contentVisibilityMessage = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.isContentVisible
    ? '✅ 内容がしっかり見えています'
    : '❌ 内容が見えにくい状態です'
})

const healthInsuranceOrientationMessage = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.isHealthInsuranceCardStraight
    ? '✅ 健康保険証が真っ直ぐ撮影されています'
    : '❌ 健康保険証が傾いて撮影されています'
})

const medicineNotebookOrientationMessage = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.isMedicineNotebookStraight
    ? '✅ おくすり手帳が真っ直ぐ撮影されています'
    : '❌ おくすり手帳が傾いて撮影されています'
})

const healthInsuranceObstructionMessage = computed(() => {
  if (!analysisResult.value) return ''
  return !analysisResult.value.isHealthInsuranceCardObstructed
    ? '✅ 健康保険証の内容が隠れていません'
    : '❌ 健康保険証の内容が指や反射で隠れています'
})

const medicineNotebookObstructionMessage = computed(() => {
  if (!analysisResult.value) return ''
  return !analysisResult.value.isMedicineNotebookObstructed
    ? '✅ おくすり手帳の内容が隠れていません'
    : '❌ おくすり手帳の内容が指や反射で隠れています'
})

const personalInfoMessage = computed(() => {
  if (!analysisResult.value) return ''
  return analysisResult.value.canReadPersonalInfo
    ? '✅ 個人情報が読み取れます'
    : '❌ 個人情報が読み取れません'
})

const hasPersonalInfo = computed(() => {
  if (!analysisResult.value?.personalInfo) return false
  const info = analysisResult.value.personalInfo
  return !!(info.name || info.birthDate || info.gender)
})

// Watch for changes (for debugging)
watch(analysisResult, (newValue, oldValue) => {
  console.log('App: analysisResult changed from', oldValue, 'to', newValue)
}, { deep: true, immediate: true })

watch(cameraStatus, (newValue) => {
  console.log('App: cameraStatus changed to', newValue)
}, { deep: true })

// Camera Methods
const startCamera = async (): Promise<void> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'environment'
      }
    })

    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }

    cameraStatus.value.isStarted = true
    cameraStatus.value.error = null

    console.log('Camera started successfully')
  } catch (error) {
    console.error('Error accessing camera:', error)
    cameraStatus.value.error = `カメラにアクセスできませんでした: ${error instanceof Error ? error.message : 'Unknown error'}`
  }
}

const stopCamera = (): void => {
  if (videoRef.value?.srcObject) {
    const tracks = (videoRef.value.srcObject as MediaStream).getTracks()
    tracks.forEach(track => track.stop())
    videoRef.value.srcObject = null
  }

  cameraStatus.value.isStarted = false
  cameraStatus.value.isAnalyzing = false
  cameraStatus.value.error = null

  console.log('Camera stopped')
}

const captureImage = (): string | null => {
  const video = videoRef.value
  const canvas = canvasRef.value

  if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
    cameraStatus.value.error = 'ビデオが準備できていません'
    return null
  }

  // Set canvas dimensions to match video
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  // Draw video frame to canvas
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  // Get image data as base64
  return canvas.toDataURL('image/jpeg', 0.8)
}

const captureAndAnalyze = async (): Promise<void> => {
  if (cameraStatus.value.isAnalyzing) return

  const imageData = captureImage()
  if (!imageData) return

  console.log('Starting analysis...')
  cameraStatus.value.isAnalyzing = true
  cameraStatus.value.error = null

  // Clear previous result to ensure UI updates
  analysisResult.value = null
  analysisTimestamp.value = 0

  try {
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: AnalysisResult = await response.json()
    console.log('API response received:', result)
    console.log('isHealthInsuranceCard value:', result.isHealthInsuranceCard, typeof result.isHealthInsuranceCard)
    console.log('isMedicineNotebook value:', result.isMedicineNotebook, typeof result.isMedicineNotebook)
    console.log('isContentVisible value:', result.isContentVisible, typeof result.isContentVisible)
    console.log('isHealthInsuranceCardStraight value:', result.isHealthInsuranceCardStraight, typeof result.isHealthInsuranceCardStraight)
    console.log('isMedicineNotebookStraight value:', result.isMedicineNotebookStraight, typeof result.isMedicineNotebookStraight)
    console.log('isHealthInsuranceCardObstructed value:', result.isHealthInsuranceCardObstructed, typeof result.isHealthInsuranceCardObstructed)
    console.log('isMedicineNotebookObstructed value:', result.isMedicineNotebookObstructed, typeof result.isMedicineNotebookObstructed)
    console.log('canReadPersonalInfo value:', result.canReadPersonalInfo, typeof result.canReadPersonalInfo)
    console.log('personalInfo value:', result.personalInfo)

    // Force reactivity by creating a completely new object
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

    // Update timestamp to force re-render
    analysisTimestamp.value = Date.now()

    console.log('analysisResult updated:', analysisResult.value)

  } catch (error) {
    console.error('Error analyzing image:', error)

    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Check for rate limit errors
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
        cameraStatus.value.error = `APIの利用制限に達しました。24時間後に再度お試しください。（1日50回まで）`
      } else if (errorMessage.includes('400')) {
        cameraStatus.value.error = `画像データが無効です。再度撮影してください。`
      } else if (errorMessage.includes('500')) {
        cameraStatus.value.error = `サーバーエラーが発生しました。しばらく待ってから再度お試しください。`
      } else {
        cameraStatus.value.error = `画像分析中にエラーが発生しました: ${errorMessage}`
      }
    } else {
      cameraStatus.value.error = '不明なエラーが発生しました'
    }
  } finally {
    cameraStatus.value.isAnalyzing = false
  }
}

// Results Methods
const getStatusClass = (isPositive: boolean): string => {
  return isPositive ? 'positive' : 'negative'
}

// Voice Recognition Methods
const speakMessage = (text: string): Promise<void> => {
  return new Promise((resolve) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ja-JP'
      utterance.rate = 1.0
      utterance.pitch = 1.0
      utterance.volume = 1.0

      utterance.onend = () => {
        resolve()
      }

      utterance.onerror = () => {
        console.error('音声合成エラー')
        resolve() // エラーでも処理を続行
      }

      speechSynthesis.speak(utterance)
    } else {
      console.warn('音声合成はサポートされていません')
      resolve()
    }
  })
}

const checkForStopKeywords = (text: string): void => {
  const stopKeywords = ['以上です', 'おわります', 'ありがとう', '終わり']
  const lowerText = text.toLowerCase()

  for (const keyword of stopKeywords) {
    if (lowerText.includes(keyword)) {
      console.log(`終了キーワード "${keyword}" を検出しました`)
      stopVoiceRecognition()
      return
    }
  }
}

const initSpeechRecognition = (): void => {
  if (!isWebSpeechSupported.value) return

  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
  recognition.value = new SpeechRecognitionClass()

  if (recognition.value) {
    recognition.value.continuous = true
    recognition.value.interimResults = true
    recognition.value.lang = 'ja-JP'

    recognition.value.onstart = () => {
      console.log('音声認識開始')
      voiceStatus.value.isRecording = true
      voiceStatus.value.error = null
      currentTranscript.value = ''
    }

    recognition.value.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }

      currentTranscript.value = interim
      if (final) {
        // 最終結果を allRecognizedText に蓄積
        allRecognizedText.value += final
        finalTranscript.value = final
        console.log('最終認識結果:', allRecognizedText.value)

        // 終了キーワードをチェック
        checkForStopKeywords(final)
      }

      // リアルタイムでも終了キーワードをチェック
      if (interim) {
        checkForStopKeywords(interim)
      }
    }

    recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('音声認識エラー:', event.error)
      voiceStatus.value.error = `音声認識エラー: ${event.error}`
      voiceStatus.value.isRecording = false
    }

    recognition.value.onend = () => {
      console.log('音声認識終了')
      voiceStatus.value.isRecording = false
    }
  }
}

const startVoiceRecognition = async (): Promise<void> => {
  if (voiceStatus.value.isProcessing || voiceStatus.value.isRecording) {
    return // 既に処理中または録音中の場合は何もしない
  }

  voiceStatus.value.isProcessing = true

  if (!recognition.value) {
    initSpeechRecognition()
  }

  // 新しい認識を開始する際に前の結果をクリア
  finalTranscript.value = ''
  currentTranscript.value = ''
  allRecognizedText.value = ''  // 蓄積された結果もクリア

  try {
    // 音声案内を再生
    await speakMessage('症状を教えてください！')

    if (recognition.value) {
      try {
        recognition.value.start()
      } catch (error) {
        console.error('音声認識開始エラー:', error)
        voiceStatus.value.error = '音声認識を開始できませんでした'
      }
    }
  } finally {
    voiceStatus.value.isProcessing = false
  }
}

const stopVoiceRecognition = (): void => {
  if (recognition.value) {
    recognition.value.stop()
  }
}

const toggleVoiceChat = async (): Promise<void> => {
  if (voiceStatus.value.isProcessing) {
    return // 処理中の場合は何もしない
  }

  if (voiceStatus.value.isRecording) {
    stopVoiceRecognition()
  } else {
    await startVoiceRecognition()
  }
}

// Cleanup on unmount
onMounted(() => {
  return () => {
    stopCamera()
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: #333;
}

.app {
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  text-align: center;
  color: white;
  margin-bottom: 30px;
  font-size: 2.5em;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 30px;
  align-items: start;
}

.camera-section {
  grid-column: 1;
  grid-row: 1;
}

.results-section {
  grid-column: 2;
  grid-row: 1;
}

.voice-chat-section {
  grid-column: 1 / -1;
  grid-row: 2;
}

/* Camera Section Styles */
.camera-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.camera-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
}

.video {
  width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.camera-controls {
  margin-top: 20px;
  text-align: center;
}

.btn {
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  margin: 0 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin: 10px 0;
  border: 1px solid #f5c6cb;
}

/* Results Section Styles */
.results-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.analysis-results {
  min-height: 200px;
}

.waiting-state {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1em;
}

.analysis-result {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  border-left: 5px solid #667eea;
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 8px;
  font-weight: bold;
  flex-wrap: wrap;
}

.status-indicator.positive {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-indicator.negative {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.debug-value {
  font-size: 0.8em;
  font-weight: normal;
  color: #666;
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 10px;
  font-family: 'Monaco', 'Courier New', monospace;
}

.status-icon {
  margin-right: 10px;
  font-size: 1.2em;
}

.analysis-text {
  margin-top: 15px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  line-height: 1.6;
}

.suggestions {
  margin-top: 15px;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 8px;
  border-left: 4px solid #2196f3;
}

h2 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.debug-info {
  margin-top: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
}

/* Personal Information Styles */
.personal-info-details {
  margin-top: 15px;
  padding: 15px;
  background: #fff3cd;
  border-radius: 8px;
  border-left: 4px solid #ffc107;
}

.personal-info-details h3 {
  margin-bottom: 10px;
  color: #856404;
  font-size: 1.1em;
}

.personal-info-item {
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.info-label {
  font-weight: bold;
  color: #856404;
  min-width: 80px;
  margin-right: 10px;
}

.info-value {
  color: #333;
  background: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #ffc107;
}

/* Voice Chat Section Styles */
.voice-chat-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.voice-intro {
  text-align: center;
  margin-bottom: 20px;
}

.intro-message {
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  color: #1976d2;
  padding: 15px 20px;
  border-radius: 25px;
  font-size: 16px;
  font-weight: 500;
  border: 2px solid #bbdefb;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.1);
  display: inline-block;
  margin-bottom: 10px;
}

.example-message {
  background: linear-gradient(135deg, #f3e5f5 0%, #fce4ec 100%);
  color: #7b1fa2;
  padding: 12px 18px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 400;
  border: 2px solid #e1bee7;
  box-shadow: 0 2px 6px rgba(123, 31, 162, 0.1);
  display: inline-block;
  font-style: italic;
}

.voice-controls {
  text-align: center;
  margin-bottom: 20px;
}

.voice-btn {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
}

.voice-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.voice-btn.recording {
  background: linear-gradient(45deg, #f44336, #d32f2f);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(244, 67, 54, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(244, 67, 54, 0);
  }
}

.voice-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  animation: none;
}

.voice-display {
  margin-top: 20px;
}

.transcript-area {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  border-left: 5px solid #4CAF50;
}

.transcript-area h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.1em;
}

.transcript-content {
  min-height: 100px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  transition: border-color 0.3s ease;
}

.transcript-content.listening {
  border-color: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.listening-indicator {
  color: #4CAF50;
  font-style: italic;
  text-align: center;
  padding: 20px;
  animation: blink 1.5s infinite;
}

.listening-indicator small {
  color: #666;
  font-size: 0.85em;
  font-weight: normal;
  margin-top: 5px;
  display: block;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
}

.current-transcript {
  color: #666;
  font-style: italic;
  line-height: 1.6;
  min-height: 20px;
}

.final-transcript {
  color: #333;
  font-weight: bold;
  line-height: 1.6;
  padding: 10px;
  background: #e8f5e8;
  border-radius: 6px;
  border-left: 4px solid #4CAF50;
}

.waiting-voice {
  color: #999;
  text-align: center;
  padding: 30px;
  font-style: italic;
}

/* Voice Result Section Styles */
.voice-result-section {
  margin-top: 30px;
  background: #f0f8ff;
  border-radius: 15px;
  padding: 25px;
  border: 2px solid #4CAF50;
  box-shadow: 0 5px 15px rgba(76, 175, 80, 0.2);
}

.voice-result-section h3 {
  color: #2e7d32;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.3em;
}

.voice-result-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recognized-text {
  background: white;
  padding: 20px;
  border-radius: 10px;
  border-left: 4px solid #4CAF50;
  font-size: 16px;
  line-height: 1.6;
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.result-actions {
  text-align: center;
}

.result-instruction {
  background: #e8f5e8;
  color: #2e7d32;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-size: 14px;
  line-height: 1.5;
  border: 1px solid #c8e6c9;
}

.retry-btn {
  background: linear-gradient(45deg, #FF9800, #F57C00);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 152, 0, 0.3);
}

.retry-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
}

.retry-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: 20px;
  }

  .camera-section {
    grid-column: 1;
    grid-row: 1;
  }

  .results-section {
    grid-column: 1;
    grid-row: 2;
  }

  .voice-chat-section {
    grid-column: 1;
    grid-row: 3;
  }

  h1 {
    font-size: 2em;
  }

  .btn {
    margin: 5px;
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
