<template>
  <main class="main">
    <GlobalLoader v-if="globalLoading" />
    <LogIn v-else-if="!currentUser?.uid" />
    <template v-else>
      <section v-if="showPhrase" class="phrase-container">
        <div class="game-controls">
          <HomeIcon
            v-if="(isPaused || (showPhraseText && !isPreparing)) && phrase"
            class="round-icon"
            @click.stop="stopGame"
          />
          <QuestionIcon
            v-if="!isPreparing && !showPhraseText && phrase"
            class="round-icon"
            @mousedown="showHint = true"
            @mouseup="showHint = false"
            @mouseleave="showHint = false"
            @touchstart.prevent="showHint = true"
            @touchend.prevent="showHint = false"
          />
          <ShuffleIcon
            v-if="(isPaused || (showPhraseText && !isPreparing)) && phrase"
            class="round-icon"
            @click.stop="generatePhrase('show')"
          />
        </div>

        <p v-if="isPreparing" class="prep-label">время на подготовку...</p>
        <p v-if="showHint" class="hint">{{ phrase }}</p>
        <div v-if="error" class="error" @click="stopGame()">
          <img src="@/assets/images/facepalm.png" class="facepalm" alt="icon" />
          <h2>Ошибка</h2>
          <p>{{ error }}</p>
          <RotateIcon class="rotate" @click="stopGame()" />
        </div>
        <template v-else>
          <div
            class="circle"
            @click="togglePause"
          >
            <div v-if="loading" class="loader-container">
              <div class="wave-loader">
                <span></span>
                <span></span>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
            <template v-else>
              <div class="wave-container">
                <div class="wave-below" :class="waveClass" :style="waveStyle">
                  <span v-for="i in 8" :key="i" class="bubble" :class="`bbl-${i}`"></span>
                </div>
              </div>
              <p v-if="showPhraseText" class="phrase">{{ phrase }}</p>
              <p v-else-if="showTimer && !isPaused" class="phrase timer" :class="{ 'timer-warning': countdown <= 30 }">{{ timer }}</p>

              <PauseIcon v-else-if="isPaused" class="pause" />
            </template>
          </div>
        </template>
      </section>

      <template v-else>
        <section class="first-screen">
          <div class="icon logout">
            <LogOutIcon @click="logout" />
          </div>
          <div class="icon settings">
            <SettingsIcon @click.prevent="isSettings = !isSettings" />
          </div>
          <div v-if="isSettings" class="settings-section">
            <div class="settings-row">
              <p>Подготовка:</p>
              <input type="number" min="0" v-model="preparationTime" />
            </div>
            <div class="settings-row">
              <p>Объяснение:</p>
              <input type="number" min="0" v-model="explanationTime" />
            </div>
          </div>
          <Logo class="logo" />
          <div class="scroll">
            <div class="scroll-down arrows">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </section>

        <div class="mode-buttons">
          <div class="action-btn top">
            <Draw class="action" @click="generatePhrase('draw')" />
          </div>

          <div class="action-btn middle">
            <Show class="action" @click="generatePhrase('show')" />
          </div>
          <div class="action-btn bottom">
            <Speak class="action" @click="generatePhrase('show')" />
          </div>
        </div>
      </template>
    </template>
  </main>
</template>

<script setup>
import { onMounted, ref, watch, nextTick } from "vue";
import axios from "axios";

import { logout, checkAuth, currentUser } from "@/stores/auth";
import {
  saveCurrentPhrase,
  getNewPhrases,
  newPhrases,
  removeUsedNewPhrase,
  getUserPhrases,
  saveNewPhrases,
  userPhrases,
} from "@/stores/phrases";
import { loadSettings, preparationTime, explanationTime } from "@/stores/settings";

import GlobalLoader from "@/components/GlobalLoader.vue";
import LogIn from "@/components/LogIn.vue";

import Logo from "@/components/icons/Logo.vue";
import Draw from "@/components/icons/Draw.vue";
import Show from "@/components/icons/Show.vue";
import Speak from "@/components/icons/Speak.vue";
import LogOutIcon from "@/components/icons/LogOutIcon.vue";
import SettingsIcon from "@/components/icons/SettingsIcon.vue";
import HomeIcon from "@/components/icons/HomeIcon.vue";
import ShuffleIcon from "@/components/icons/ShuffleIcon.vue";
import PauseIcon from "@/components/icons/PauseIcon.vue";
import QuestionIcon from "@/components/icons/QuestionIcon.vue";
import RotateIcon from "@/components/icons/RotateIcon.vue";

const startSound = new Audio("/sounds/drums.wav");
const endSound = new Audio("/sounds/finish.wav");

const phrase = ref("");
const error = ref(null);
const globalLoading = ref(true);
const loading = ref(false);

const timer = ref("02:00");
const countdown = ref(120);
const showTimer = ref(false);
const isPaused = ref(false);
const isPreparing = ref(false);

const isSettings = ref(false);

let intervalId = null;
let preparationTimeoutId = null;

const showPhrase = ref(false);
const showPhraseText = ref(false);
const showHint = ref(false);
const waveClass = ref('');
const waveStyle = ref({});

const API_BASE_URL = import.meta.env.VITE_API_URL;

async function generatePhrase(mode) {
  clearInterval(intervalId);
  intervalId = null;
  if (preparationTimeoutId) {
    clearTimeout(preparationTimeoutId);
    preparationTimeoutId = null;
  }
  countdown.value = explanationTime.value;
  showTimer.value = false;
  isPaused.value = false;
  isPreparing.value = false;
  showPhraseText.value = false;
  waveClass.value = '';
  waveStyle.value = {};

  loading.value = true;
  error.value = null;
  phrase.value = null;
  showPhrase.value = true;

  try {
    await getNewPhrases();

    // Use cache if we have enough phrases
    if (newPhrases.value.length >= 5) {
      const nextPhrase = newPhrases.value[Math.floor(Math.random() * newPhrases.value.length)];
      phrase.value = nextPhrase;
      await saveCurrentPhrase(nextPhrase);
      await removeUsedNewPhrase(nextPhrase);
      return;
    }

    // Cache is low — fetch 10 new phrases from API
    await getUserPhrases();

    const response = await axios.post(`${API_BASE_URL}/generatePhrase`, {
      mode,
      uid: currentUser.value.uid,
    });

    const list = response?.data?.phrases || [];
    if (!Array.isArray(list) || list.length === 0) throw new Error("Фразы не найдены");

    const normalizeWords = (s) =>
      new Set(s.toLowerCase().replace(/[.,!?"'«»]/g, "").trim().split(/\s+/));

    const unique = list.filter((p) => {
      const phraseSet = normalizeWords(p);
      return !userPhrases.value.some(e => [...phraseSet].some(w => normalizeWords(e).has(w))) &&
             !newPhrases.value.some(e => [...phraseSet].some(w => normalizeWords(e).has(w)));
    });

    if (unique.length === 0) throw new Error("Все сгенерированные фразы уже использованы");

    const nextPhrase = unique[Math.floor(Math.random() * unique.length)];
    phrase.value = nextPhrase;

    await saveNewPhrases(unique);
    await saveCurrentPhrase(nextPhrase);
    await removeUsedNewPhrase(nextPhrase);
  } catch (err) {
    console.error("Ошибка при генерации фразы:", err);
    error.value = err.response?.data?.error || "Не удалось сгенерировать фразу";
  } finally {
    loading.value = false;
  }
}

function startCountdown() {
  clearInterval(intervalId);
  showTimer.value = true;
  updateTimerDisplay();

  intervalId = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
      updateTimerDisplay();
    } else {
      clearInterval(intervalId);
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(countdown.value / 60)).padStart(2, "0");
  const seconds = String(countdown.value % 60).padStart(2, "0");
  timer.value = `${minutes}:${seconds}`;
}

function togglePause() {
  if (showPhraseText.value && !isPreparing.value) {
    stopGame();
    return;
  }

  if (isPreparing.value) {
    if (preparationTimeoutId) {
      clearTimeout(preparationTimeoutId);
      preparationTimeoutId = null;
    }
    isPreparing.value = false;
    isPaused.value = false;
    showPhraseText.value = false;
    waveClass.value = 'fill';
    startCountdown();
    return;
  }

  isPaused.value = !isPaused.value;

  if (isPaused.value) {
    clearInterval(intervalId);
    waveStyle.value = { animationPlayState: 'paused' };
  } else {
    waveStyle.value = {};
    startCountdown();
  }
}

function stopGame() {
  clearInterval(intervalId);
  if (preparationTimeoutId) {
    clearTimeout(preparationTimeoutId);
    preparationTimeoutId = null;
  }
  showTimer.value = false;
  showPhrase.value = false;
  phrase.value = null;
  countdown.value = explanationTime.value;
  updateTimerDisplay();
  isPaused.value = false;
  isPreparing.value = false;
  showPhraseText.value = false;
  waveClass.value = '';
  waveStyle.value = {};
  error.value = null;
}

watch(loading, (newVal, oldVal) => {
  if (oldVal === true && newVal === false && phrase.value) {
    isSettings.value = false;
    isPreparing.value = true;
    showPhraseText.value = true;
    countdown.value = explanationTime.value;

    document.documentElement.style.setProperty(
      "--prep-time",
      `${preparationTime.value}s`
    );
    document.documentElement.style.setProperty(
      "--explain-time",
      `${explanationTime.value}s`
    );

    nextTick(() => {
      waveClass.value = 'drain';
      waveStyle.value = {};

      preparationTimeoutId = setTimeout(() => {
        isPreparing.value = false;
        isPaused.value = false;
        showPhraseText.value = false;
        waveClass.value = 'fill';
        startCountdown();
      }, preparationTime.value * 1000);
    });
  }
});

watch(countdown, (value) => {
  if (value === 0) {
    showTimer.value = false;
    isPaused.value = false;
    isPreparing.value = false;
    showPhraseText.value = true;
    waveClass.value = '';
    waveStyle.value = {};
  }
  if (value === explanationTime.value - 1) {
    startSound.currentTime = 0;
    startSound.play();
  }
  if (value === 3) {
    endSound.currentTime = 0;
    endSound.play();
  }
});

onMounted(async () => {
  try {
    await checkAuth();
  } catch (err) {
    console.error("Ошибка авторизации:", err);
  } finally {
    globalLoading.value = false;
  }
  try {
    await loadSettings();
  } catch (err) {
    console.error("Ошибка таймеров:", err);
  } finally {
    globalLoading.value = false;
  }
});
</script>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100dvh;
  max-width: 400px;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  position: relative;

  &::-webkit-scrollbar {
    display: none;
  }
  background: linear-gradient(to bottom, #0099ff 0%, #fff 100%);

  .first-screen {
    height: 100svh;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    scroll-snap-align: start;
    position: relative;
    .icon {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #ffffff2d;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: transform 0.1s ease, background-color 0.1s ease;

      &:active {
        transform: scale(0.92);
        background-color: #ffffff40;
      }

      &.logout {
        top: 20px;
        left: 20px;
        svg {
          width: 50%;
          color: #fff;
        }
      }
      &.settings {
        left: 20px;
        top: 80px;
        svg {
          width: 50%;
          color: #fff;
        }
      }
    }
    .logo {
      width: 55%;
    }
    .scroll {
      position: absolute;
      top: 70dvh;

      .scroll-down.arrows span {
        position: absolute;
        display: inline-block;
        height: 25px;
        width: 2px;
        left: calc(50% - 1px);
        animation: animateArrows 1.25s infinite linear;
      }
      .scroll-down.arrows span:first-child {
        top: 35px;
        animation-delay: 0s;
      }
      .scroll-down.arrows span:nth-child(2) {
        top: 35px;
        animation-delay: 0.33s;
      }
      .scroll-down.arrows span:last-child {
        top: 50px;
        animation-delay: 0.66s;
      }
      .scroll-down.arrows span::before,
      .scroll-down.arrows span::after {
        position: absolute;
        content: "";
        width: 3px;
        height: 100%;
        top: 0;
        left: 0;
        background: #fff;
        border-radius: 3px;
      }
      .scroll-down.arrows span::before {
        transform-origin: bottom;
        transform: rotate(-45deg);
      }
      .scroll-down.arrows span::after {
        transform-origin: bottom;
        margin-left: -1px;
        transform: rotate(45deg);
      }
    }
  }

  .mode-buttons {
    position: absolute;
    top: 100svh;
    scroll-snap-align: start;
    margin-top: 15%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100svh;
    gap: 10px;
    .action-btn {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 160px;
      height: 160px;
      box-shadow: 0 0 10px rgb(10, 10, 10);
      border-radius: 20px;
      transition: transform 0.1s ease, filter 0.1s ease;

      &:active {
        transform: scale(0.95);
        filter: brightness(0.9);
      }
    }
    .top {
      background: #f2da2f;
    }
    .middle {
      background: #f82883;
    }
    .bottom {
      background: #01bdea;
    }
  }
  :deep(.action) {
    padding: 20px 30px;
    cursor: pointer;
    svg {
      width: 180px;
    }
    image {
      width: 100%;
    }
  }
}

@media screen and (min-width: 401px) {
  main {
    margin: 50px auto;
    border: 1px solid white;
    border-radius: 20px;
    box-shadow: 0 0 20px rgb(10, 10, 10);
    height: 90vh;
    position: relative;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    .first-screen {
      height: 90vh;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(to bottom, #0099ff 0%, #fff 100%);
      scroll-snap-align: start;
      .logo {
        width: 55%;
      }
    }
    .mode-buttons {
      position: absolute;
      top: 90vh;
      height: 90vh;
      scroll-snap-align: start;
    }
  }
}

@keyframes animateArrows {
  0%,
  40%,
  100% {
    opacity: 0;
  }
  75% {
    opacity: 1;
  }
}

.phrase-container {
  width: 100%;
  height: 100dvh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.circle {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: filter 0.1s ease;

  &:active {
    filter: brightness(0.9);
  }
}

.phrase {
  text-align: center;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  font-family: "Roboto", sans-serif;
  z-index: 100;
  opacity: 0.7;
}

.phrase.timer {
  font-size: 96px;
  transition: color 0.5s ease;
  opacity: 0.7;
}

.phrase.timer.timer-warning {
  color: #e79d1f;
}

.wave-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.wave-below {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #00d4f0 0%, #0099cc 30%, #005588 65%, #002244 100%);
  z-index: -1;
}

.wave-below::before,
.wave-below::after {
  content: '';
  position: absolute;
  left: 0;
  width: 400%;
  background-repeat: repeat-x;
  background-position: 0 bottom;
}

.wave-below::before {
  bottom: calc(100% - 40px);
  top: auto;
  height: 90px;
  background-size: 25% 90px;
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 90'><path fill='%2300d4f0' d='M0,30 C200,55 400,5 600,30 C700,42 750,18 800,30 L800,90 L0,90 Z'/></svg>");
  animation: wave-scroll-1 4s linear infinite;
}

.wave-below::after {
  bottom: calc(100% - 40px);
  top: auto;
  height: 70px;
  background-size: 25% 70px;
  background-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 70'><path fill='%2300d4f0' d='M0,25 C133,45 267,5 400,25 C533,45 667,5 800,25 L800,70 L0,70 Z'/></svg>");
  opacity: 0.7;
  animation: wave-scroll-2 6s linear infinite reverse;
}

@keyframes wave-scroll-1 {
  to { transform: translateX(-25%); }
}

@keyframes wave-scroll-2 {
  to { transform: translateX(-25%); }
}

.wave-below.fill {
  animation: fill-below calc(var(--explain-time, 120s)) linear forwards;
}

.wave-below.drain {
  animation: drain-below calc(var(--prep-time, 20s)) linear forwards;
}

@keyframes fill-below {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@keyframes drain-below {
  from { transform: translateY(0); }
  to { transform: translateY(calc(100% + 100px)); }
}

.bubble {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.5);
  z-index: 0;
  animation: bubble-rise linear infinite;
  pointer-events: none;
}

.bbl-1 { left: 10%; top: 60%; width: 7px;  height: 7px;  animation-duration: 5.0s; animation-delay: 0.0s; }
.bbl-2 { left: 25%; top: 75%; width: 4px;  height: 4px;  animation-duration: 7.2s; animation-delay: 1.5s; }
.bbl-3 { left: 42%; top: 55%; width: 9px;  height: 9px;  animation-duration: 6.0s; animation-delay: 3.1s; }
.bbl-4 { left: 58%; top: 70%; width: 5px;  height: 5px;  animation-duration: 8.5s; animation-delay: 0.7s; }
.bbl-5 { left: 72%; top: 50%; width: 6px;  height: 6px;  animation-duration: 5.8s; animation-delay: 4.2s; }
.bbl-6 { left: 85%; top: 80%; width: 4px;  height: 4px;  animation-duration: 7.0s; animation-delay: 2.4s; }
.bbl-7 { left: 18%; top: 65%; width: 5px;  height: 5px;  animation-duration: 6.5s; animation-delay: 5.5s; }
.bbl-8 { left: 63%; top: 78%; width: 8px;  height: 8px;  animation-duration: 9.0s; animation-delay: 1.0s; }

@keyframes bubble-rise {
  0%   { transform: translateY(0)     translateX(0);    opacity: 0;   }
  8%   { opacity: 0.75; }
  33%  { transform: translateY(-6vh)  translateX(-3px); }
  66%  { transform: translateY(-12vh) translateX(3px);  }
  82%  { opacity: 0.4; }
  100% { transform: translateY(-18vh) translateX(1px);  opacity: 0;   }
}

.error {
  color: red;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: "Roboto", sans-serif;
  gap: 10px;
  p {
    text-align: center;
  }
}

.wave-loader {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.wave-loader span {
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  animation: bubble-pulse 1.2s ease-in-out infinite;
}

.wave-loader span:nth-child(1) { animation-delay: 0s; }
.wave-loader span:nth-child(2) { animation-delay: 0.2s; }
.wave-loader span:nth-child(3) { animation-delay: 0.4s; }
.wave-loader span:nth-child(4) { animation-delay: 0.6s; }
.wave-loader span:nth-child(5) { animation-delay: 0.8s; }

@keyframes bubble-pulse {
  0%, 100% { transform: scale(0.5); opacity: 0.3; }
  50%       { transform: scale(1.2); opacity: 1; }
}

.pause {
  width: 18dvw;
  height: 18dvh;
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  opacity: 0.7;
  svg {
    width: 90%;
    height: 90%;
    filter: drop-shadow(0 0 15px #f8f8f8ec);
    color: #fff;
  }
}

.game-controls {
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 50px;
}

.round-icon {
  color: #fff;
  width: 36px;
  height: 36px;
  cursor: pointer;
  opacity: 0.7;
  transition: transform 0.1s ease, filter 0.1s ease;
  flex-shrink: 0;

  &:active {
    transform: scale(0.95);
    filter: brightness(0.9);
  }
}
.prep-label {
  position: absolute;
  top: 40px;
  left: 0;
  right: 0;
  text-align: center;
  color: #fff;
  font-size: 18px;
  font-family: "Roboto", sans-serif;
  z-index: 10;
  pointer-events: none;
  animation: prep-pulse 2s ease-in-out infinite;
}

@keyframes prep-pulse {
  0%, 100% { opacity: 0.2; }
  50%       { opacity: 0.8; }
}

.hint {
  position: absolute;
  bottom: 126px;
  left: 0;
  right: 0;
  color: #fff;
  font-size: 26px;
  z-index: 10;
  text-align: center;
  padding: 0 20px;
}
.facepalm {
  width: 50px;
  height: 50px;
  margin-bottom: 10px;
}
.rotate {
  width: 30px;
  height: 30px;
  margin-top: 10px;
  cursor: pointer;
}
.settings-section {
  position: absolute;
  top: 5%;
  left: 20%;
  background: #ffffff2d;
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .settings-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    p {
      color: #fff;
      font-size: 16px;
    }
    input {
      width: 50px;
      height: 30px;
      border-radius: 5px;
      border: none;
      padding-left: 5px;
      background: #ffffff2d;
      color: #fff;
    }
  }
}
</style>
