<template>
  <div class="App">
    <!-- スタートページ -->
    <div v-if="!started" class="start-wrapper">
      <div class="start-circle" @click="started = true">
        START
      </div>
    </div>

    <!-- 3ステップ構成 -->
    <div v-else-if="step <= 3" class="wizard">
      <Stepper :current-step="step" />
      <div class="card">
        <!-- ステップ1: 症状チェック -->
        <div v-if="step === 1">
          <SymptomsCheck />
        </div>
        
        <!-- ステップ2: カメラ分析1 -->
        <div v-else-if="step === 2">
          <CameraAnalysis />
        </div>
        
        <!-- ステップ3: カメラ分析2 -->
        <div v-else-if="step === 3">
          <CameraAnalysis />
        </div>
      </div>
      
      <!-- ナビゲーションボタン -->
      <div class="btn-group">
        <button 
          @click="prev" 
          :disabled="step === 1"
          class="back-btn"
        >
          戻る
        </button>
        <button 
          v-if="step < 3"
          @click="next" 
          :disabled="step === 3"
          class="next-btn"
        >
          次へ
        </button>
        <button 
          v-if="step === 3"
          @click="showConfirmation" 
          class="next-btn"
        >
          確認
        </button>
      </div>
    </div>

    <!-- 確認ページ -->
    <div v-else class="card confirm-wrapper">
      <Confirmation @reset="reset" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { onMounted } from 'vue'
import { provideAppStore } from './stores/appStore'
import CameraAnalysis from './components/CameraAnalysis.vue'
import SymptomsCheck from './components/SymptomsCheck.vue'
import { ref } from 'vue';
import Stepper       from './components/Stepper.vue';
import Confirmation  from './components/ConfirmationPage.vue';

// ストアを提供（これが重要！）
provideAppStore()

const started = ref(false);
const step    = ref(1); // 1〜3: 入力, 4: 確認

const next = () => {
  step.value = Math.min(step.value + 1, 4);
};

const prev = () => {
  step.value = Math.max(step.value - 1, 1);
};

const showConfirmation = () => {
  step.value = 4;
};

const reset = () => {
  started.value = false;
  step.value = 1;
};
</script>


<style>
/* ===== 画面全体 ===== */
html, body, #root {
  height: 100%;
  margin: 0;
}

.App {
  display: flex;
  justify-content: center;   /* 上下中央 */
  align-items: center;       /* 左右中央 */
  min-height: 100vh;
  background: #f7f5f3;
  font-family: 'Noto Sans JP', sans-serif;
}

/* ===== 開始ページ ===== */
.start-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: #f7f5f3;
}

.start-circle {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: #164a9b;
  color: #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.25rem;
  font-weight: 700;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease;
}

.start-circle:hover {
  transform: scale(1.05);
}

/* ===== ウィザード・ラッパー ===== */
.wizard {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;              /* これで親の App 幅いっぱいに固定 */
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ===== カード（白背景） ===== */
.card {
  width: calc(100% - 40px);   /* 左右 20px の余白を確保 */
  max-width: 1200px;
  min-height: 600px;
  margin: 0 20px;
  background: #ffffff;
  padding: 2.5rem 3rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
  width: calc(100% - 40px); /* 画面左右 20px の余白を必ず確保 */
  max-width: 1200px;        /* これ以上は広がらない */
  min-height: 600px;
  margin: 0 20px;
  /* 以下は既存の装飾プロパティ */
}


/* 次へボタン */
.next-btn {
  padding: 12px 32px;
  background: #164a9b;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(22, 74, 155, 0.3);
}

.next-btn:hover:not(:disabled) {
  background: #0d3a7a;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 74, 155, 0.4);
}

.next-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* ===== ステッパー ===== */
.stepper {
  display: flex;
  align-items: center;
  gap: 80px;
  margin-bottom: 32px;
}

.step {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 20px;
  left: calc(100% + 4px);
  width: 72px;
  height: 2px;
  background: #164a9b;
}

.circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #164a9b;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  color: #164a9b;
  background: #ffffff;
}

.step.active .circle,
.step.completed .circle {
  background: #164a9b;
  color: #ffffff;
}

.step-label {
  margin-top: 8px;
  font-size: 0.875rem;
  white-space: nowrap;
}

/* ===== ボタン配置 ===== */
.btn-group {
  margin-top: 32px;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 0 20px;
}

/* 戻るボタン */
.back-btn {
  padding: 12px 32px;
  background: #6c757d;
  border: none;
  border-radius: 6px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.3);
}

.back-btn:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.4);
}

.back-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

</style>