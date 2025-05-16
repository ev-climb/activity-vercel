<template>
  <div class="login">
    <Logo style="width: 50%" />
    <template v-if="!regMode">
      <input
        v-model="email"
        class="input"
        type="text"
        placeholder="Email"
        :disabled="isLoading"
        :class="{ error: error }"
      />
      <div class="password">
        <input
          v-model="password"
          class="input"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Password"
          :disabled="isLoading"
          :class="{ error: error }"
        />
        <EyeIcon
          @click.prevent="showPassword = !showPassword"
          class="eye"
          :style="!showPassword && 'opacity: 50%'"
        />
      </div>
      <button @click="submit">
        <BtnLoader v-if="isLoading" />
        <span v-else>Войти</span>
      </button>
      <p @click="regMode = true">регистрация</p>
    </template>
    <template v-else>
      <input
        v-model="email"
        class="input"
        type="text"
        placeholder="Email"
        :disabled="isLoading"
        :class="{ error: error }"
      />
      <div class="password">
        <input
          v-model="password"
          class="input"
          :type="showPassword ? 'text' : 'password'"
          placeholder="Password"
          :disabled="isLoading"
          :class="{ error: error }"
        />
        <EyeIcon
          @click="showPassword = !showPassword"
          class="eye"
          :style="!showPassword && 'opacity: 50%'"
        />
      </div>
      <button @click="submit">
        <BtnLoader v-if="isLoading" />
        <span v-else>Зарегистрироваться</span>
      </button>
      <p @click="regMode = false">вход</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { login, register } from "@/stores/auth";
import EyeIcon from "./icons/EyeIcon.vue";
import Logo from "./icons/Logo.vue";
import BtnLoader from "./BtnLoader.vue";

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const isLoading = ref(false);
const error = ref<string | null | any>(null);
const regMode = ref(false);

const submit = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    if (regMode.value) {
      await register(email.value, password.value);
    } else {
      await login(email.value, password.value);
    }
  } catch (err) {
    error.value = err;
    console.log(err);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100dvh;
  background: linear-gradient(to bottom right, #0099ff, #ffffff);
  gap: 1rem;
}

.input {
  width: 70%;
  max-width: 300px;
  padding: 0.8rem 1rem;
  border: none;
  border-radius: 12px;
  background: #f0f4f8;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 1rem;
  transition: all 0.2s;
}

.input:focus {
  outline: none;
  background: #e2efff;
  box-shadow: 0 0 0 2px #0099ff66;
}

button {
  width: 70%;
  max-width: 300px;
  padding: 0.9rem 1rem;
  border: none;
  border-radius: 12px;
  background-color: #0099ff;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 153, 255, 0.3);
  transition: background 0.2s;
}

button:hover {
  background-color: #007fd6;
}

p {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #444;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

p:hover {
  color: #007fd6;
}

.error {
  border: 1px solid red;
}

.password {
  position: relative;
  width: 70%;
  max-width: 300px;
  margin-right: 30px;

  input {
    width: 100%;
  }
}

.eye {
  position: absolute;
  top: 5%;
  right: -10px;
  cursor: pointer;
  width: 16px;
  outline: none;
}
</style>
