// auth.ts
import { ref } from "vue"
import { auth } from "../firebaseConfig"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "firebase/auth"

export const currentUser = ref<{} | null>(null)

export const checkAuth = (): Promise<{} | null> => {
  return new Promise(resolve => {
    onAuthStateChanged(auth, user => {
      currentUser.value = user;
      console.log(user ? "👤 Пользователь вошёл:" : "🚪 Пользователь вышел", user?.uid || "");
      resolve(user);
    });
  });
};

export const register = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const logout = () => signOut(auth)
