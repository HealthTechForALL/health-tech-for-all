<template>
  <div class="camera-analysis-container">
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
          :disabled="store.cameraStatus.value.isStarted"
          class="btn"
        >
          カメラ開始
        </button>
        <button
          @click="stopCamera"
          :disabled="!store.cameraStatus.value.isStarted"
          class="btn"
        >
          カメラ停止
        </button>
        <button
          @click="captureAndAnalyze"
          :disabled="!store.cameraStatus.value.isStarted || store.cameraStatus.value.isAnalyzing"
          class="btn"
        >
          {{ store.cameraStatus.value.isAnalyzing ? '分析中...' : '撮影・判定' }}
        </button>
      </div>
      <div
        v-if="store.cameraStatus.value.error"
        class="error-message"
      >
        {{ store.cameraStatus.value.error }}
      </div>
    </div>

    <!-- Results Section -->
    <div class="results-section">
      <h2>🔍 判定結果</h2>
      <div class="analysis-results">
        <div
          v-if="!store.hasAnalysisResult.value"
          class="waiting-state"
        >
          判定結果を待機中...
        </div>
        <div
          v-else
          class="analysis-result"
          :key="store.analysisTimestamp.value"
        >
          <!-- Health Insurance Status -->
          <div
            :class="['status-indicator', getStatusClass(store.analysisResult.value!.isHealthInsuranceCard)]"
          >
            <span class="status-icon">🏥</span>
            <span>{{ healthInsuranceMessage }}</span>
            <span class="debug-value">isHealthInsuranceCard: {{ store.analysisResult.value!.isHealthInsuranceCard }}</span>
          </div>

          <!-- Medicine Notebook Status -->
          <div
            :class="['status-indicator', getStatusClass(store.analysisResult.value!.isMedicineNotebook)]"
          >
            <span class="status-icon">💊</span>
            <span>{{ medicineNotebookMessage }}</span>
            <span class="debug-value">isMedicineNotebook: {{ store.analysisResult.value!.isMedicineNotebook }}</span>
          </div>

          <!-- Content Visibility Status -->
          <div
            :class="['status-indicator', getStatusClass(store.analysisResult.value!.isContentVisible)]"
          >
            <span class="status-icon">👁️</span>
            <span>{{ contentVisibilityMessage }}</span>
            <span class="debug-value">isContentVisible: {{ store.analysisResult.value!.isContentVisible }}</span>
          </div>

          <!-- Health Insurance Card Orientation Status -->
          <div
            v-if="store.analysisResult.value!.isHealthInsuranceCard"
            :class="['status-indicator', getStatusClass(store.analysisResult.value!.isHealthInsuranceCardStraight)]"
          >
            <span class="status-icon">📐</span>
            <span>{{ healthInsuranceOrientationMessage }}</span>
            <span class="debug-value">isHealthInsuranceCardStraight: {{ store.analysisResult.value!.isHealthInsuranceCardStraight }}</span>
          </div>

          <!-- Medicine Notebook Orientation Status -->
          <div
            v-if="store.analysisResult.value!.isMedicineNotebook"
            :class="['status-indicator', getStatusClass(store.analysisResult.value!.isMedicineNotebookStraight)]"
          >
            <span class="status-icon">📐</span>
            <span>{{ medicineNotebookOrientationMessage }}</span>
            <span class="debug-value">isMedicineNotebookStraight: {{ store.analysisResult.value!.isMedicineNotebookStraight }}</span>
          </div>

          <!-- Health Insurance Card Obstruction Status -->
          <div
            v-if="store.analysisResult.value!.isHealthInsuranceCard"
            :class="['status-indicator', getStatusClass(!store.analysisResult.value!.isHealthInsuranceCardObstructed)]"
          >
            <span class="status-icon">🤚</span>
            <span>{{ healthInsuranceObstructionMessage }}</span>
            <span class="debug-value">isHealthInsuranceCardObstructed: {{ store.analysisResult.value!.isHealthInsuranceCardObstructed }}</span>
          </div>

          <!-- Medicine Notebook Obstruction Status -->
          <div
            v-if="store.analysisResult.value!.isMedicineNotebook"
            :class="['status-indicator', getStatusClass(!store.analysisResult.value!.isMedicineNotebookObstructed)]"
          >
            <span class="status-icon">🤚</span>
            <span>{{ medicineNotebookObstructionMessage }}</span>
            <span class="debug-value">isMedicineNotebookObstructed: {{ store.analysisResult.value!.isMedicineNotebookObstructed }}</span>
          </div>

          <!-- Personal Information Reading Status -->
          <div
            v-if="store.analysisResult.value!.isHealthInsuranceCard"
            :class="['status-indicator', getStatusClass(store.analysisResult.value!.canReadPersonalInfo)]"
          >
            <span class="status-icon">📋</span>
            <span>{{ personalInfoMessage }}</span>
            <span class="debug-value">canReadPersonalInfo: {{ store.analysisResult.value!.canReadPersonalInfo }}</span>
          </div>

          <!-- Personal Information Details -->
          <div
            v-if="store.analysisResult.value!.canReadPersonalInfo && hasPersonalInfo"
            class="personal-info-details"
          >
            <h3>📝 読み取った個人情報</h3>
            <div class="personal-info-item" v-if="store.analysisResult.value!.personalInfo.name">
              <span class="info-label">氏名:</span>
              <span class="info-value">{{ store.analysisResult.value!.personalInfo.name }}</span>
            </div>
            <div class="personal-info-item" v-if="store.analysisResult.value!.personalInfo.birthDate">
              <span class="info-label">生年月日:</span>
              <span class="info-value">{{ store.analysisResult.value!.personalInfo.birthDate }}</span>
            </div>
            <div class="personal-info-item" v-if="store.analysisResult.value!.personalInfo.gender">
              <span class="info-label">性別:</span>
              <span class="info-value">{{ store.analysisResult.value!.personalInfo.gender }}</span>
            </div>
          </div>

          <!-- Analysis Text -->
          <div
            v-if="store.analysisResult.value!.analysis"
            class="analysis-text"
          >
            {{ store.analysisResult.value!.analysis }}
          </div>

          <!-- Debug: Raw API Response -->
          <div class="debug-info">
            <details>
              <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">🔧 デバッグ情報（開発者用）</summary>
              <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">{{ JSON.stringify(store.analysisResult.value, null, 2) }}</pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useAppStore, type AnalysisResult } from '../stores/appStore'

// Use store
const store = useAppStore()

// Refs
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()

// Computed messages
const healthInsuranceMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return store.analysisResult.value.isHealthInsuranceCard
    ? '✅ 健康保険証を検出しました'
    : '❌ 健康保険証は検出されませんでした'
})

const medicineNotebookMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return store.analysisResult.value.isMedicineNotebook
    ? '✅ おくすり手帳を検出しました'
    : '❌ おくすり手帳は検出されませんでした'
})

const contentVisibilityMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return store.analysisResult.value.isContentVisible
    ? '✅ 内容がしっかり見えています'
    : '❌ 内容が見えにくい状態です'
})

const healthInsuranceOrientationMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return store.analysisResult.value.isHealthInsuranceCardStraight
    ? '✅ 健康保険証が真っ直ぐ撮影されています'
    : '❌ 健康保険証が傾いて撮影されています'
})

const medicineNotebookOrientationMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return store.analysisResult.value.isMedicineNotebookStraight
    ? '✅ おくすり手帳が真っ直ぐ撮影されています'
    : '❌ おくすり手帳が傾いて撮影されています'
})

const healthInsuranceObstructionMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return !store.analysisResult.value.isHealthInsuranceCardObstructed
    ? '✅ 健康保険証の内容が隠れていません'
    : '❌ 健康保険証の内容が指や反射で隠れています'
})

const medicineNotebookObstructionMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return !store.analysisResult.value.isMedicineNotebookObstructed
    ? '✅ おくすり手帳の内容が隠れていません'
    : '❌ おくすり手帳の内容が指や反射で隠れています'
})

const personalInfoMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return store.analysisResult.value.canReadPersonalInfo
    ? '✅ 個人情報が読み取れます'
    : '❌ 個人情報が読み取れません'
})

const hasPersonalInfo = computed(() => {
  if (!store.analysisResult.value?.personalInfo) return false
  const info = store.analysisResult.value.personalInfo
  return !!(info.name || info.birthDate || info.gender)
})

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

    store.updateCameraStatus({
      isStarted: true,
      error: null
    })

    console.log('Camera started successfully')
  } catch (error) {
    console.error('Error accessing camera:', error)
    store.updateCameraStatus({
      error: `カメラにアクセスできませんでした: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }
}

const stopCamera = (): void => {
  if (videoRef.value?.srcObject) {
    const tracks = (videoRef.value.srcObject as MediaStream).getTracks()
    tracks.forEach(track => track.stop())
    videoRef.value.srcObject = null
  }

  store.updateCameraStatus({
    isStarted: false,
    isAnalyzing: false,
    error: null
  })

  console.log('Camera stopped')
}

const captureImage = (): string | null => {
  const video = videoRef.value
  const canvas = canvasRef.value

  if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
    store.updateCameraStatus({
      error: 'ビデオが準備できていません'
    })
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
  if (store.cameraStatus.value.isAnalyzing) return

  const imageData = captureImage()
  if (!imageData) return

  console.log('Starting analysis...')
  store.updateCameraStatus({
    isAnalyzing: true,
    error: null
  })

  // Clear previous result
  store.clearAnalysisResult()

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

    store.setAnalysisResult(result)

  } catch (error) {
    console.error('Error analyzing image:', error)

    // Handle specific error types
    if (error instanceof Error) {
      const errorMessage = error.message;

      // Check for rate limit errors
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
        store.updateCameraStatus({
          error: `APIの利用制限に達しました。24時間後に再度お試しください。（1日50回まで）`
        })
      } else if (errorMessage.includes('400')) {
        store.updateCameraStatus({
          error: `画像データが無効です。再度撮影してください。`
        })
      } else if (errorMessage.includes('500')) {
        store.updateCameraStatus({
          error: `サーバーエラーが発生しました。しばらく待ってから再度お試しください。`
        })
      } else {
        store.updateCameraStatus({
          error: `画像分析中にエラーが発生しました: ${errorMessage}`
        })
      }
    } else {
      store.updateCameraStatus({
        error: '不明なエラーが発生しました'
      })
    }
  } finally {
    store.updateCameraStatus({
      isAnalyzing: false
    })
  }
}

// Results Methods
const getStatusClass = (isPositive: boolean): string => {
  return isPositive ? 'positive' : 'negative'
}

// Cleanup on unmount
onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
.camera-analysis-container {
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
  border: 1px solid #000;
}

.camera-controls {
  margin-top: 20px;
  text-align: center;
}

.btn {
  background: linear-gradient(45deg, #667eea, #667eea);
  color: white;
  border: none;
  padding: 12px 25px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  margin: 0 10px;
  transition: all 0.3s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-2px);
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

@media (max-width: 768px) {
  .camera-analysis-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .btn {
    margin: 5px;
    padding: 10px 20px;
    font-size: 14px;
  }
}
</style>
