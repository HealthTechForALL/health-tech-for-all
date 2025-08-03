<template>
  <div class="start-wrapper">
    <div class="start-circle" @click="onStart">
      START
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  onStart: {
    type: Function,
    required: true
  }
});
</script>

<style scoped>
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
  margin-top: 24px;
  padding: 8px 24px;
  background: #164a9b;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
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
  margin-top: 24px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

/* 戻るボタン */
.back-btn {
  margin-top: 24px;
  padding: 8px 24px;
  background: #164a9b;
  border: none;
  border-radius: 4px;
  color: #ffffff;
  font-size: 0.9rem;
  cursor: pointer;
}

.back-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

</style>
