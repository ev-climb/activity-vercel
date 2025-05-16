import { ref } from 'vue'
import { db, auth } from '../firebaseConfig'
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion
} from 'firebase/firestore'

export const savePhrase = async (text: string) => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Пользователь не авторизован")

  const userDocRef = doc(db, 'phrases', uid)
  const docSnap = await getDoc(userDocRef)

  if (docSnap.exists()) {
    const existing = docSnap.data().phrases || []
    
    const deduplicated = [...new Set([text, ...existing])]
    const trimmed = deduplicated.slice(0, 200)

    await setDoc(userDocRef, { phrases: trimmed })
  } else {
    await setDoc(userDocRef, { phrases: [text] })
  }
}


export const userPhrases = ref([])

export const getUserPhrases = async () => {
  userPhrases.value = [];
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Пользователь не авторизован")

  const userDocRef = doc(db, 'phrases', uid)
  const docSnap = await getDoc(userDocRef)

  console.log("📦 docSnap.data():", docSnap.data());

  if (docSnap.exists()) {
    const data = docSnap.data()
    userPhrases.value = data.phrases || []
  } 
}
