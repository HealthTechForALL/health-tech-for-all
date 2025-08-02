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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

// Type definitions
interface AnalysisResult {
  isHealthInsuranceCard: boolean;
  isMedicineNotebook: boolean;
  isContentVisible: boolean;
  isHealthInsuranceCardStraight: boolean;
  isMedicineNotebookStraight: boolean;
  isHealthInsuranceCardObstructed: boolean;
  isMedicineNotebookObstructed: boolean;
  analysis: string;
  suggestions: string;
}

interface CameraStatus {
  isStarted: boolean;
  isAnalyzing: boolean;
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

const analysisResult = ref<AnalysisResult | null>(null)
const analysisTimestamp = ref<number>(0)

// Computed
const hasResult = computed(() => {
  const result = analysisResult.value !== null
  console.log('hasResult computed:', result, analysisResult.value)
  return result
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

    // Force reactivity by creating a completely new object
    analysisResult.value = {
      isHealthInsuranceCard: Boolean(result.isHealthInsuranceCard),
      isMedicineNotebook: Boolean(result.isMedicineNotebook),
      isContentVisible: Boolean(result.isContentVisible),
      isHealthInsuranceCardStraight: Boolean(result.isHealthInsuranceCardStraight),
      isMedicineNotebookStraight: Boolean(result.isMedicineNotebookStraight),
      isHealthInsuranceCardObstructed: Boolean(result.isHealthInsuranceCardObstructed),
      isMedicineNotebookObstructed: Boolean(result.isMedicineNotebookObstructed),
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
  gap: 30px;
  align-items: start;
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

@media (max-width: 768px) {
  .main-content {
    grid-template-columns: 1fr;
    gap: 20px;
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
