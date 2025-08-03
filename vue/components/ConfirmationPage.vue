<template>
  <div>
    <h2>送信内容の最終確認</h2>

    <!-- 症状 -->
    <section>
      <h3>症状</h3>
      <p>症状カテゴリ：{{ formatValue(data?.symptoms_categories) }}</p>
    </section>

    <!-- 個人情報 -->
    <section>
      <h3>個人情報</h3>
      <p>お名前：{{ formatName(data?.profile_name_last_kana, data?.profile_name_first_kana) }}</p>
      <p>性別：{{ formatValue(data?.profile_gender) }}</p>
      <p>生年月日：{{ formatBirthday(data?.profile_birthday_year, data?.profile_birthday_month, data?.profile_birthday_day) }}</p>
      <p>電話番号：{{ formatPhone(data?.profile_phone) }}</p>
      <p>住所：{{ formatAddress(data) }}</p>
    </section>

    <!-- アップロード -->
    <section>
      <h3>アップロード</h3>
      <div class="upload-grid">
        <div class="upload-col">
          <p>保険証：</p>
          <img
            v-if="toSrc(data?.base64_image_insurance_card)"
            :src="toSrc(data?.base64_image_insurance_card)"
            alt="保険証画像"
          />
          <p v-else class="placeholder">未アップロード</p>
        </div>
        <div class="upload-col">
          <p>お薬手帳：</p>
          <img
            v-if="toSrc(data?.base64_image_medication_notebook)"
            :src="toSrc(data?.base64_image_medication_notebook)"
            alt="お薬手帳画像"
          />
          <p v-else class="placeholder">未アップロード</p>
        </div>
        <div class="upload-col">
          <p>身分証明書：</p>
          <img
            v-if="toSrc(data?.base64_image_credentials_information)"
            :src="toSrc(data?.base64_image_credentials_information)"
            alt="身分証明書画像"
          />
          <p v-else class="placeholder">未アップロード</p>
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
  if (v === null || v === undefined) return '未入力';
  if (Array.isArray(v)) return v.length ? v.join('、') : '未入力';
  if (typeof v === 'string' && v.trim() === '') return '未入力';
  if (typeof v === 'number' && v === 0) return '未入力';
  return v || '未入力';
};

const formatBirthday = (year, month, day) => {
  if (!year || !month || !day) return '未入力';
  return `${year}年${month}月${day}日`;
};

const formatAddress = (data) => {
  const parts = [
    data?.profile_location_zip,
    data?.profile_location_prefecture,
    data?.profile_location_municipality,
    data?.profile_location_town,
    data?.profile_location_house_number,
    data?.profile_location_building_and_room_number
  ].filter(part => part);
  
  return parts.length > 0 ? parts.join(' ') : '未入力';
};

const formatName = (lastName, firstName) => {
  const last = lastName || '';
  const first = firstName || '';
  const fullName = (last + ' ' + first).trim();
  return fullName || '未入力';
};

const formatPhone = (phone) => {
  if (!phone || phone === '0') return '未入力';
  // 電話番号を整形（例：08011110000 → 080-1111-0000）
  const cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }
  return phone;
};

onMounted(async () => {
  data.value = await getData();
  console.log('ConfirmationPage loaded data:', data.value);
  console.log('LocalStorage formData:', localStorage.getItem('formData'));
  console.log('LocalStorage formdata.json:', localStorage.getItem('formdata.json'));
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
