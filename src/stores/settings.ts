import { ref, watch } from 'vue'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from '@/firebaseConfig'

export const preparationTime = ref(20)
export const explanationTime = ref(120)

export const loadSettings = async () => {
  const uid = auth.currentUser?.uid
  if (!uid) return

  const refDoc = doc(db, 'settings', uid)
  const snap = await getDoc(refDoc)
  console.log("📦 settings:", snap.data());


  if (snap.exists()) {
    const data = snap.data()
    preparationTime.value = data.preparationTime ?? 20
    explanationTime.value = data.explanationTime ?? 120
  } else {
    await setDoc(refDoc, {
      preparationTime: preparationTime.value,
      explanationTime: explanationTime.value,
    })
  }
}

export const saveUserSettings = async (settings: {
  preparationTime: number;
  explanationTime: number;
}) => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Не авторизован");

  const ref = doc(db, "settings", uid);
  await setDoc(ref, settings);
};

watch([preparationTime, explanationTime], async ([prep, expl]) => {
  const uid = auth.currentUser?.uid
  if (!uid) return

  await setDoc(doc(db, 'settings', uid), {
    preparationTime: prep,
    explanationTime: expl,
  })
})
