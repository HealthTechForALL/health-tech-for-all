/* =========================================
   formDataStoreBrowser.js  (localStorage 版)
   ========================================= */

   const KEY = 'formData';   // localStorage のキー名

   /* ----- テンプレート JSON ----- */
   const TEMPLATE = {
     symptoms_categories: [],
     symptoms: "",
     profile_name_first_kana: "",
     profile_name_last_kana: "",
     profile_gender: "",
     profile_birthday_year: 0,
     profile_birthday_month: 0,
     profile_birthday_day: 0,
     profile_phone: "",
     profile_location_zip: "",
     profile_location_prefecture: "",
     profile_location_municipality: "",
     profile_location_town: "",
     profile_location_house_number: "",
     profile_location_building_and_room_number: "",
     base64_image_insurance_card: "",
     base64_image_medication_notebook: "",
     base64_image_credentials_information: ""
   };
   
   let cache = null;
   
   /* 初期ロード */
   function init() {
     if (cache) return;
     const text = localStorage.getItem(KEY);
     cache = text ? JSON.parse(text) : structuredClone(TEMPLATE);
   }
   
   /* 保存 */
   function save() {
     localStorage.setItem(KEY, JSON.stringify(cache));
   }
   
   /* フィールド更新 */
   export function setField(path, value) {
     init();
   
     const keys = path.split('.');
     let ref = cache;
   
     for (let i = 0; i < keys.length - 1; i++) {
       const k = keys[i];
       if (!(k in ref)) throw new Error(`キーが存在しません: ${k}`);
       ref = ref[k];
     }
   
     const lastKey = keys.at(-1);
     if (!(lastKey in ref)) throw new Error(`キーが存在しません: ${lastKey}`);
   
     if (Array.isArray(ref[lastKey]) && !Array.isArray(value)) {
       ref[lastKey].push(value);
     } else {
       ref[lastKey] = value;
     }
   
     save();
   }
   
   /* JSON 全体取得 */
   export function getData() {
     init();
     return structuredClone(cache);
   }
   