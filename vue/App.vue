<template>
  <div class="app">
    <div class="container">
      <h1>📋 オンライン診療初回登録対話&画像認識型サポートAIシステム</h1>

      <div class="main-content">
        <!-- Symptoms Check Section -->
        <SymptomsCheck />

        <!-- Camera and Analysis Section -->
        <CameraAnalysis />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { provideAppStore } from './stores/appStore'
import CameraAnalysis from './components/CameraAnalysis.vue'
import SymptomsCheck from './components/SymptomsCheck.vue'

// Provide store to all child components
const store = provideAppStore()

onMounted(() => {
  console.log('App mounted with store:', store)
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
  display: flex;
  flex-direction: column;
  gap: 30px;
}

@media (max-width: 768px) {
  h1 {
    font-size: 2em;
  }

  .container {
    padding: 15px;
  }

  .main-content {
    gap: 20px;
  }
}
</style>
