<template>
  <div class="camera-analysis-container">
    <!-- やることリスト -->
    <div ref="taskListRef" class="task-list-section">
      <h3>📋 やることリスト</h3>
      <p class="task-intro">オンライン診療を開始するために、以下の書類をご準備ください：</p>

      <div class="progress-indicator">
        <div class="progress-text">進捗: {{ store.taskProgress.value }}</div>
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(store.taskList.value.completedCount / store.taskList.value.totalCount) * 100}%` }"
          ></div>
        </div>
      </div>

      <div class="task-items">
        <div
          v-for="task in store.taskList.value.items"
          :key="task.id"
          class="task-item"
          :class="{ 'completed': task.status === 'completed' }"
        >
          <div class="task-header">
            <div class="task-status-icon">
              <span v-if="task.status === 'completed'" class="status-completed">✅</span>
              <span v-else class="status-pending">⏳</span>
            </div>
            <div class="task-title">{{ task.title }}</div>
            <div class="task-status-text">
              <span v-if="task.status === 'completed'" class="status-text completed">完了</span>
              <span v-else class="status-text pending">これから</span>
            </div>
          </div>
          <div class="task-description">
            {{ task.description }}
          </div>
          <div v-if="task.status === 'pending'" class="task-actions">
            <button
              @click="showDocument(task.id)"
              class="btn show-btn"
            >
              見せる
            </button>
          </div>
        </div>
      </div>

      <div class="task-actions-bottom">
        <button @click="resetAllTasks" class="btn reset-btn">
          リストをリセット
        </button>
      </div>
    </div>

    <!-- Camera Section -->
    <div ref="cameraSectionRef" class="camera-section">
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

          <!-- Address Document Status -->
          <div
            :class="['status-indicator', getStatusClass(store.analysisResult.value!.isAddressDocument)]"
          >
            <span class="status-icon">🏠</span>
            <span>{{ addressDocumentMessage }}</span>
            <span class="debug-value">isAddressDocument: {{ store.analysisResult.value!.isAddressDocument }}</span>
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
            <div class="personal-info-item" v-if="store.analysisResult.value!.profile_gender">
              <span class="info-label">性別:</span>
              <span class="info-value">{{ genderDisplay }}</span>
            </div>
            <div class="personal-info-item" v-if="birthdayDisplay">
              <span class="info-label">生年月日:</span>
              <span class="info-value">{{ birthdayDisplay }}</span>
            </div>
            <div class="personal-info-item" v-if="addressDisplay">
              <span class="info-label">住所:</span>
              <span class="info-value">{{ addressDisplay }}</span>
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
import { ref, computed, onUnmounted, onMounted } from 'vue'
import { useAppStore, type AnalysisResult } from '../stores/appStore'

// Use store
const store = useAppStore()

// Refs
const videoRef = ref<HTMLVideoElement>()
const canvasRef = ref<HTMLCanvasElement>()
const activeTaskId = ref<string | null>(null)
const taskListRef = ref<HTMLDivElement>()
const cameraSectionRef = ref<HTMLDivElement>()

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

const addressDocumentMessage = computed(() => {
  if (!store.analysisResult.value) return ''
  return store.analysisResult.value.isAddressDocument
    ? '✅ 住所がわかる書類を検出しました'
    : '❌ 住所がわかる書類は検出されませんでした'
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
  if (!store.analysisResult.value) return false
  const result = store.analysisResult.value
  return !!(result.profile_gender ||
           result.profile_birthday_year ||
           result.profile_birthday_month ||
           result.profile_birthday_day ||
           result.profile_location_zip ||
           result.profile_location_prefecture ||
           result.profile_location_municipality)
})

const genderDisplay = computed(() => {
  if (!store.analysisResult.value?.profile_gender) return ''
  return store.analysisResult.value.profile_gender === 'female' ? '女性' :
         store.analysisResult.value.profile_gender === 'male' ? '男性' : ''
})

const birthdayDisplay = computed(() => {
  if (!store.analysisResult.value) return ''
  const result = store.analysisResult.value
  if (!result.profile_birthday_year || !result.profile_birthday_month || !result.profile_birthday_day) return ''
  return `${result.profile_birthday_year}年${result.profile_birthday_month}月${result.profile_birthday_day}日`
})

const addressDisplay = computed(() => {
  if (!store.analysisResult.value) return ''
  const result = store.analysisResult.value
  const parts = [
    result.profile_location_prefecture,
    result.profile_location_municipality,
    result.profile_location_town,
    result.profile_location_house_number,
    result.profile_location_building_and_room_number
  ].filter(Boolean)

  if (result.profile_location_zip) {
    return `〒${result.profile_location_zip} ${parts.join('')}`
  }
  return parts.join('')
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

    // アクティブなタスクがある場合、条件をチェックして自動完了
    console.log('activeTaskId.value before check:', activeTaskId.value)
    if (activeTaskId.value) {
      checkAndCompleteTask(activeTaskId.value, result)
      // activeTaskIdのリセットはcheckAndCompleteTask内で行うため、ここでは削除
      console.log('checkAndCompleteTask finished')
    } else {
      console.log('No active task ID, skipping auto-completion')
    }

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

// Scroll Methods
const scrollToCamera = (): void => {
  if (cameraSectionRef.value) {
    cameraSectionRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
}

const scrollToTaskList = (): void => {
  if (taskListRef.value) {
    taskListRef.value.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
}

// Task Management Methods
const markTaskCompleted = (taskId: string): void => {
  store.markTaskCompleted(taskId)
}

const showDocument = async (taskId: string): Promise<void> => {
  console.log('showDocument called with taskId:', taskId)
  console.log('Previous activeTaskId:', activeTaskId.value)

  // カメラを起動
  await startCamera()

  // 現在のタスクIDを記録（撮影・判定後の自動完了のため）
  activeTaskId.value = taskId
  console.log('activeTaskId set to:', activeTaskId.value)

  // カメラセクションへスクロール
  setTimeout(() => {
    scrollToCamera()
  }, 100) // カメラ起動後に少し遅延してスクロール
}

const checkAndCompleteTask = (taskId: string, result: AnalysisResult): void => {
  const task = store.taskList.value.items.find(t => t.id === taskId)
  if (!task) return

  console.log('checkAndCompleteTask called:', { taskId, result })

  let shouldComplete = false
  let message = ''

  if (taskId === 'insurance_card') {
    // 健康保険証の場合：検出 + 内容が見える + 真っ直ぐ + 隠れていない
    shouldComplete = result.isHealthInsuranceCard &&
                    result.isContentVisible &&
                    result.isHealthInsuranceCardStraight &&
                    !result.isHealthInsuranceCardObstructed
    if (shouldComplete) {
      message = '✅ 健康保険証の確認が完了しました！'
    } else {
      message = '❌ 健康保険証をもう一度撮影してください。\n' +
                (result.isHealthInsuranceCard ? '' : '・健康保険証が検出されませんでした\n') +
                (result.isContentVisible ? '' : '・内容が見えにくい状態です\n') +
                (result.isHealthInsuranceCardStraight ? '' : '・カードが傾いています\n') +
                (result.isHealthInsuranceCardObstructed ? '・カードが指や反射で隠れています\n' : '') +
                '条件を満たすように撮影し直してください。'
    }
  } else if (taskId === 'medicine_notebook') {
    // おくすり手帳の場合：検出 + 内容が見える + 隠れていない（傾きは判定しない）
    shouldComplete = result.isMedicineNotebook &&
                    result.isContentVisible &&
                    !result.isMedicineNotebookObstructed
    if (shouldComplete) {
      message = '✅ おくすり手帳の確認が完了しました！'
    } else {
      message = '❌ おくすり手帳をもう一度撮影してください。\n' +
                (result.isMedicineNotebook ? '' : '・おくすり手帳が検出されませんでした\n') +
                (result.isContentVisible ? '' : '・内容が見えにくい状態です\n') +
                (result.isMedicineNotebookObstructed ? '・手帳が指や反射で隠れています\n' : '') +
                '条件を満たすように撮影し直してください。'
    }
  } else if (taskId === 'address_verification') {
    // 住所確認書類の場合：住所書類または健康保険証の判定を使用
    const hasAddressDocument = result.isAddressDocument || result.isHealthInsuranceCard

    if (result.isAddressDocument) {
      // 住所書類（運転免許証、郵便物など）の場合は内容が見えればOK
      shouldComplete = result.isContentVisible
    } else if (result.isHealthInsuranceCard) {
      // 健康保険証の場合は従来の条件を適用
      shouldComplete = result.isContentVisible &&
                      result.isHealthInsuranceCardStraight &&
                      !result.isHealthInsuranceCardObstructed
    } else {
      shouldComplete = false
    }

    if (shouldComplete) {
      message = '✅ 住所確認書類の確認が完了しました！'
    } else {
      message = '❌ 住所確認書類をもう一度撮影してください。\n' +
                (hasAddressDocument ? '' : '・住所がわかる書類が検出されませんでした\n') +
                (result.isContentVisible ? '' : '・内容が見えにくい状態です\n') +
                (!result.isAddressDocument && result.isHealthInsuranceCard && !result.isHealthInsuranceCardStraight ? '・書類が傾いています\n' : '') +
                (!result.isAddressDocument && result.isHealthInsuranceCard && result.isHealthInsuranceCardObstructed ? '・書類が指や反射で隠れています\n' : '') +
                '条件を満たすように撮影し直してください。'
    }
  }

  console.log('Task completion check:', {
    taskId,
    shouldComplete,
    message,
    isAddressDocument: result.isAddressDocument,
    isHealthInsuranceCard: result.isHealthInsuranceCard,
    isContentVisible: result.isContentVisible
  })

  if (shouldComplete) {
    store.markTaskCompleted(taskId)
    // Save form data with protection based on task type
    store.saveFormDataToLocalStorage(taskId)
    // 成功時のみactiveTaskIdをリセット
    activeTaskId.value = null
    alert(message)
    // アラート後にタスクリストへスクロール
    setTimeout(() => {
      scrollToTaskList()
    }, 100)
  } else {
    alert(message)
    // 失敗の場合はカメラを停止するが、activeTaskIdは保持して再撮影に備える
    stopCamera()
    // activeTaskIdはリセットしない（再撮影時に同じタスクを継続するため）
    console.log('Keeping activeTaskId for retry:', activeTaskId.value)
    // タスクリストに戻る
    setTimeout(() => {
      scrollToTaskList()
    }, 100)
  }
}

const resetAllTasks = (): void => {
  store.resetTasks()
}

// Lifecycle
onMounted(() => {
  // Initialize tasks
  store.initializeTasks()
})

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

/* Task List Section Styles */
.task-list-section {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 15px;
  padding: 25px;
  margin-bottom: 30px;
  border: 2px solid #007bff;
  grid-column: 1 / -1; /* Span full width */
}

.task-list-section h3 {
  color: #007bff;
  margin-bottom: 15px;
  text-align: center;
  font-size: 1.3em;
}

.task-intro {
  text-align: center;
  color: #495057;
  margin-bottom: 20px;
  font-weight: 500;
  padding: 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
}

.progress-indicator {
  margin-bottom: 20px;
  text-align: center;
}

.progress-text {
  color: #007bff;
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 1.1em;
}

.progress-bar {
  background: #e9ecef;
  border-radius: 10px;
  height: 20px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.progress-fill {
  background: linear-gradient(90deg, #28a745, #20c997);
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 10px;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.task-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #dee2e6;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.task-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.task-item.completed {
  background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
  border-color: #28a745;
  opacity: 0.9;
}

.task-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.task-status-icon {
  margin-right: 12px;
  font-size: 1.5em;
}

.task-title {
  flex: 1;
  font-weight: bold;
  color: #343a40;
  font-size: 1.1em;
}

.task-status-text {
  margin-left: 10px;
}

.status-text {
  padding: 4px 12px;
  border-radius: 15px;
  font-size: 0.85em;
  font-weight: bold;
}

.status-text.completed {
  background: #28a745;
  color: white;
}

.status-text.pending {
  background: #ffc107;
  color: #212529;
}

.task-description {
  color: #6c757d;
  line-height: 1.6;
  margin-bottom: 15px;
  padding: 10px;
  background: rgba(248, 249, 250, 0.8);
  border-radius: 6px;
  font-size: 0.95em;
}

.task-actions {
  text-align: right;
}

.show-btn {
  background: linear-gradient(45deg, #17a2b8, #138496);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.show-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(23, 162, 184, 0.3);
}

.complete-btn {
  background: linear-gradient(45deg, #28a745, #20c997);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.complete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(40, 167, 69, 0.3);
}

.task-actions-bottom {
  text-align: center;
  margin-top: 20px;
}

.reset-btn {
  background: linear-gradient(45deg, #6c757d, #495057);
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 25px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: 500;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(108, 117, 125, 0.3);
}

/* Camera Section Styles */
.camera-analysis-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  align-items: start;
}

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
