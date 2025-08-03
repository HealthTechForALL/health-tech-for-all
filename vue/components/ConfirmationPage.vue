<template>
  <div>
    <h2>送信内容の最終確認</h2>

    <!-- 症状 -->
    <section>
      <h3>症状</h3>
      <p>症状：{{ formatValue(data?.symptom?.symptoms) }}</p>
      <p>発症日：{{ formatValue(data?.symptom?.onsetDate) }}</p>
      <p>重症度：{{ formatValue(data?.symptom?.severity) }}</p>
      <p>備考：{{ formatValue(data?.symptom?.remarks) }}</p>
    </section>

    <!-- 個人情報 -->
    <section>
      <h3>個人情報</h3>
      <p>名前：{{ formatValue(data?.profile?.name) }}</p>
      <p>年齢：{{ formatValue(data?.profile?.age) }}</p>
      <p>性別：{{ formatValue(data?.profile?.gender) }}</p>
      <p>住所：{{ formatValue(data?.profile?.address) }}</p>
    </section>

    <!-- アップロード -->
    <section>
      <h3>アップロード</h3>
      <div class="upload-grid">
        <div class="upload-col">
          <p>保険証：</p>
          <img
            v-if="toSrc(data?.upload?.insuranceCard)"
            :src="toSrc(data?.upload?.insuranceCard)"
            alt="保険証画像"
          />
          <p v-else class="placeholder"></p>
        </div>
        <div class="upload-col">
          <p>お薬手帳：</p>
          <img
            v-if="toSrc(data?.upload?.medicationNotebook)"
            :src="toSrc(data?.upload?.medicationNotebook)"
            alt="お薬手帳画像"
          />
          <p v-else class="placeholder"></p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getData } from '../formDataStoreBrowser';

const props = defineProps({
  onReset: {
    type: Function,
    required: true
  }
});

const data = ref(null);

const isDataUrl = v => typeof v === 'string' && v.startsWith('data:');

const toSrc = v => {
  if (!v) return null;
  return isDataUrl(v) ? v : `data:image/png;base64,${v}`;
};

const formatValue = v => {
  if (Array.isArray(v)) return v.length ? v.join('、') : '未入力';
  return v || '未入力';
};

onMounted(async () => {
  data.value = await getData();
});
</script>

<style scoped>
/* h3 タイトル */
section > h3 {
    margin: 16px 0 8px;
    font-size: 1.15rem;
    color: #164a9b;
  }
  
  /* 指定の <p> スタイル */
  p {
    font-size: 1.2rem;
    font-weight: bold;
    margin: 5px 0;
  }
  
  /* ボタン */
  .reset-btn {
    margin-top: 24px;
    padding: 8px 24px;
    background: #164a9b;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .upload-grid img {
    /* お好みで。幅をそろえ、高さは自動で縮むだけにします */
    max-width: 200px;   /* ← 横幅を 200px 以内に */
    height: auto;
    object-fit: contain;   /* はみ出しても画像を潰さない */
  }
</style>
