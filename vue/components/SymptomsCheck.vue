<template>
  <div class="voice-chat-section">
    <h2>🩺 症状チェックコーナー</h2>
    <div class="voice-intro">
      <p class="intro-message">はじめまして！「症状を聞かせる」ボタンを押した後、症状を教えてください！</p>
      <br />
      <p class="example-message">例）12/04頃から発熱。頭も少し痛い。</p>
    </div>
    <div class="voice-controls">
      <button
        @click="startVoiceRecognition"
        :disabled="!isWebSpeechSupported || store.voiceStatus.value.isProcessing || store.voiceStatus.value.isRecording"
        class="btn voice-btn"
      >
        症状を聞かせる
      </button>
      <div
        v-if="!isWebSpeechSupported"
        class="error-message"
      >
        お使いのブラウザは音声認識をサポートしていません
      </div>
      <div
        v-if="store.voiceStatus.value.error"
        class="error-message"
      >
        {{ store.voiceStatus.value.error }}
      </div>
    </div>
    <div class="voice-display">
      <div class="transcript-area">
        <h3>📝 お伺い内容</h3>
        <div
          class="transcript-content"
          :class="{ 'listening': store.voiceStatus.value.isRecording }"
        >
          <div v-if="store.voiceStatus.value.isRecording && !store.currentTranscript.value" class="listening-indicator">
            🎤 症状を聞かせてください...<br>
            <small>（「以上です」や「おわります」と発言すると終了できます）</small><br>
            <small>（「やり直し」や「リセット」と発言すると文章がリセットされます）</small>
          </div>
          <div v-if="store.currentTranscript.value" class="current-transcript">
            {{ store.currentTranscript.value }}
          </div>
          <div v-if="!store.voiceStatus.value.isRecording && !store.finalTranscript.value && !store.allRecognizedText.value" class="waiting-voice">
            音声認識待機中
          </div>
          <div v-if="store.allRecognizedText.value" class="final-transcript">
            <strong>最終認識結果:</strong><br>
            {{ store.allRecognizedText.value }}
          </div>
          <div v-if="store.voiceStatus.value.isProcessing" class="processing-indicator">
            🔍 症状を分析中...
          </div>
        </div>
      </div>
    </div>

    <!-- 症状分析結果表示 -->
    <div
      v-if="store.hasSymptomsResult.value"
      class="symptoms-analysis-results"
      :key="store.symptomsAnalysisTimestamp.value"
    >
      <h3>🩺 症状分析結果</h3>

      <!-- 緊急度表示 -->
      <div
        :class="['emergency-indicator', store.symptomsAnalysisResult.value!.is_emergency ? 'emergency' : 'normal']"
      >
        <span class="emergency-icon">
          {{ store.symptomsAnalysisResult.value!.is_emergency ? '🚨' : '✅' }}
        </span>
        <span class="emergency-text">
          {{ store.symptomsAnalysisResult.value!.is_emergency ? '緊急対応が必要な可能性があります' : '通常の症状です' }}
        </span>
      </div>

      <!-- 緊急理由 -->
      <div v-if="store.symptomsAnalysisResult.value!.is_emergency && store.symptomsAnalysisResult.value!.emergency_reasons.length > 0" class="emergency-reasons">
        <h4>⚠️ 緊急対応が必要な理由：</h4>
        <ul>
          <li v-for="reason in store.symptomsAnalysisResult.value!.emergency_reasons" :key="reason">
            {{ reason }}
          </li>
        </ul>
      </div>

      <!-- 緊急時の案内 -->
      <div v-if="store.symptomsAnalysisResult.value!.emergency_guidance" class="emergency-advice">
        <strong>{{ store.symptomsAnalysisResult.value!.emergency_guidance }}</strong>
      </div>

      <!-- 該当する症状カテゴリ -->
      <div class="matched-categories">
        <h4>📋 該当する症状カテゴリ：</h4>
        <div class="category-tags">
          <span
            v-for="category in store.symptomsAnalysisResult.value!.matched_categories"
            :key="category"
            class="category-tag"
          >
            {{ category }}
          </span>
        </div>
      </div>

      <!-- デバッグ情報 -->
      <div class="debug-info">
        <details>
          <summary style="cursor: pointer; font-weight: bold; margin-bottom: 10px;">🔧 症状分析デバッグ情報（開発者用）</summary>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px; overflow-x: auto;">{{ JSON.stringify(store.symptomsAnalysisResult.value, null, 2) }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore, type SymptomsAnalysisResult } from '../stores/appStore'

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

// Use store
const store = useAppStore()

// Voice recognition related refs
const recognition = ref<SpeechRecognition | null>(null)

// Web Speech API support check
const isWebSpeechSupported = computed(() => {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
})

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

const checkForStopKeywords = async (text: string): Promise<void> => {
  const stopKeywords = ['以上です', 'おわります', 'ありがとう', '終わり']
  const lowerText = text.toLowerCase()

  for (const keyword of stopKeywords) {
    if (lowerText.includes(keyword)) {
      console.log(`終了キーワード "${keyword}" を検出しました`)
      stopVoiceRecognition()

      // 症状をバックエンドに送信
      if (store.allRecognizedText.value.trim()) {
        await speakMessage('お聞かせいただきありがとうございます。')
        await analyzeSymptomsWithBackend(store.allRecognizedText.value)
      }

      return
    }
  }
}

const checkForResetKeywords = (text: string): void => {
  const resetKeywords = ['やり直し', 'リセット']
  const lowerText = text.toLowerCase()

  for (const keyword of resetKeywords) {
    if (lowerText.includes(keyword)) {
      console.log(`リセットキーワード "${keyword}" を検出しました`)
      // 文章を初期化
      store.updateTranscript('', '', '')
      // 音声認識を継続（停止しない）
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
      store.updateVoiceStatus({
        isRecording: true,
        error: null
      })
      store.updateTranscript('', '', store.allRecognizedText.value)
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
      }      store.updateTranscript(interim, final, store.allRecognizedText.value)

      if (final) {
        // リセットキーワードをチェック（最終結果に追加する前に）
        checkForResetKeywords(final)

        // リセットされていない場合のみ結果を蓄積
        if (store.allRecognizedText.value !== '' || !['やり直し', 'リセット'].some(keyword => final.toLowerCase().includes(keyword))) {
          const newAllText = store.allRecognizedText.value + final
          store.updateTranscript(interim, final, newAllText)
        }

        console.log('最終認識結果:', store.allRecognizedText.value)

        // 終了キーワードをチェック（最終結果のみ）
        checkForStopKeywords(final)
      }

      // リアルタイムではリセットキーワードのみチェック
      if (interim) {
        checkForResetKeywords(interim)
      }
    }

    recognition.value.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('音声認識エラー:', event.error)
      store.updateVoiceStatus({
        error: `音声認識エラー: ${event.error}`,
        isRecording: false
      })
    }

    recognition.value.onend = () => {
      console.log('音声認識終了')
      store.updateVoiceStatus({
        isRecording: false
      })
    }
  }
}

const startVoiceRecognition = async (): Promise<void> => {
  if (store.voiceStatus.value.isProcessing || store.voiceStatus.value.isRecording) {
    return // 既に処理中または録音中の場合は何もしない
  }

  store.updateVoiceStatus({
    isProcessing: true
  })

  if (!recognition.value) {
    initSpeechRecognition()
  }

  // 新しい認識を開始する際に前の結果をクリア
  store.resetVoiceData()

  try {
    // 音声案内を再生
    await speakMessage('症状を教えてください！')

    if (recognition.value) {
      try {
        recognition.value.start()
      } catch (error) {
        console.error('音声認識開始エラー:', error)
        store.updateVoiceStatus({
          error: '音声認識を開始できませんでした'
        })
      }
    }
  } finally {
    store.updateVoiceStatus({
      isProcessing: false
    })
  }
}

const stopVoiceRecognition = (): void => {
  if (recognition.value) {
    recognition.value.stop()
  }
}

// Symptoms analysis method
const analyzeSymptomsWithBackend = async (symptomsText: string): Promise<void> => {
  if (store.voiceStatus.value.isProcessing) return

  console.log('Sending symptoms to backend:', symptomsText)
  store.updateVoiceStatus({
    isProcessing: true,
    error: null
  })

  // Clear previous result
  store.clearSymptomsResult()

  try {
    const response = await fetch('/api/analyze-symptoms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symptoms: symptomsText })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: SymptomsAnalysisResult = await response.json()
    console.log('Symptoms analysis response received:', result)

    store.setSymptomsAnalysisResult(result)

  } catch (error) {
    console.error('Error analyzing symptoms:', error)

    if (error instanceof Error) {
      const errorMessage = error.message;

      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
        store.updateVoiceStatus({
          error: `APIの利用制限に達しました。24時間後に再度お試しください。（1日50回まで）`
        })
      } else if (errorMessage.includes('400')) {
        store.updateVoiceStatus({
          error: `症状データが無効です。再度お試しください。`
        })
      } else if (errorMessage.includes('500')) {
        store.updateVoiceStatus({
          error: `サーバーエラーが発生しました。しばらく待ってから再度お試しください。`
        })
      } else {
        store.updateVoiceStatus({
          error: `症状分析中にエラーが発生しました: ${errorMessage}`
        })
      }
    } else {
      store.updateVoiceStatus({
        error: '不明なエラーが発生しました'
      })
    }
  } finally {
    store.updateVoiceStatus({
      isProcessing: false
    })
  }
}

onMounted(() => {
  initSpeechRecognition()
})
</script>

<style scoped>
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

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 15px;
  border-radius: 8px;
  margin: 10px 0;
  border: 1px solid #f5c6cb;
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

/* 症状分析結果のスタイル */
.symptoms-analysis-results {
  margin-top: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 20px;
  border-left: 5px solid #28a745;
}

.symptoms-analysis-results h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.2em;
  text-align: center;
}

.symptoms-analysis-results h4 {
  color: #333;
  margin-bottom: 10px;
  margin-top: 15px;
  font-size: 1em;
}

.emergency-indicator {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 15px;
  font-weight: bold;
  font-size: 1.1em;
}

.emergency-indicator.emergency {
  background: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
  animation: emergencyPulse 2s infinite;
}

.emergency-indicator.normal {
  background: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

@keyframes emergencyPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(220, 53, 69, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
  }
}

.emergency-icon {
  margin-right: 10px;
  font-size: 1.3em;
}

.emergency-reasons {
  background: #f8d7da;
  border: 2px solid #dc3545;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.emergency-reasons h4 {
  color: #721c24;
  margin-top: 0;
}

.emergency-reasons ul {
  margin: 10px 0;
  padding-left: 20px;
}

.emergency-reasons li {
  color: #721c24;
  margin-bottom: 5px;
}

.emergency-advice {
  background: #721c24;
  color: white;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  margin-top: 10px;
}

.matched-categories {
  margin-bottom: 15px;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.category-tag {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.9em;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.processing-indicator {
  text-align: center;
  color: #667eea;
  font-style: italic;
  padding: 20px;
  animation: processingBlink 1.5s infinite;
}

@keyframes processingBlink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.6; }
}

.debug-info {
  margin-top: 15px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
}

h2 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}
</style>
