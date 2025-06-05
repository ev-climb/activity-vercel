import { ref } from 'vue'
import { db, auth } from '../firebaseConfig'
import {
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore'

export const saveCurrentPhrase = async (text: string) => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Пользователь не авторизован")

  const userDocRef = doc(db, 'phrases', uid)
  const docSnap = await getDoc(userDocRef)

  if (docSnap.exists()) {
    const existing = docSnap.data().phrases || []

    const deduplicated = [...new Set([text, ...existing])]
    const trimmed = deduplicated.slice(0, 300)

    await setDoc(userDocRef, { phrases: trimmed })
  } else {
    await setDoc(userDocRef, { phrases: [text] })
  }
}

export const saveNewPhrases = async (phrases: string[]) => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Пользователь не авторизован")

  const userDocRef = doc(db, 'new_phrases', uid)
  const docSnap = await getDoc(userDocRef)

  const existing = docSnap.exists() ? docSnap.data().phrases || [] : []

  const merged = [...new Set([...existing, ...phrases])]
  const trimmed = merged.slice(0, 200)

  await setDoc(userDocRef, { phrases: trimmed })
}

export const userPhrases = ref<string[]>([])

export const getUserPhrases = async () => {
  userPhrases.value = []
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Пользователь не авторизован")

  const userDocRef = doc(db, 'phrases', uid)
  const docSnap = await getDoc(userDocRef)

  if (docSnap.exists()) {
    const data = docSnap.data()
    userPhrases.value = data.phrases || []
  }
}

export const newPhrases = ref<string[]>([])

export const getNewPhrases = async () => {
  newPhrases.value = []
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Пользователь не авторизован")

  const userDocRef = doc(db, 'new_phrases', uid)
  const docSnap = await getDoc(userDocRef)

  if (docSnap.exists()) {
    const data = docSnap.data()
    newPhrases.value = data.phrases || []
  }
}

export const removeUsedNewPhrase = async (text: string) => {
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error("Пользователь не авторизован")

  const userDocRef = doc(db, 'new_phrases', uid)
  const docSnap = await getDoc(userDocRef)

  if (!docSnap.exists()) return

  const existing = docSnap.data().phrases || []
  const updated = existing.filter((item: string) => item !== text)
  await setDoc(userDocRef, { phrases: updated })
}
