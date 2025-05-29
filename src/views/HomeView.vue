<template>
  <main class="main" :class="{ 'red-bg': countdown === 0 }">
    <GlobalLoader v-if="globalLoading" />
    <LogIn v-else-if="!currentUser?.uid" />
    <template v-else>
      <section v-if="showPhrase" class="phrase-container">
        <QuestionIcon
          v-if="isPaused && phrase"
          class="round-icon question"
          @mousedown="showHint = true"
          @mouseup="showHint = false"
          @mouseleave="showHint = false"
          @touchstart.prevent="showHint = true"
          @touchend.prevent="showHint = false"
        />
        <StopIcon
          v-if="isPaused && phrase"
          class="round-icon stop"
          @click.stop="stopGame"
        />

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
            :class="{ 'fill-animation': phraseFilled }"
            @click="togglePause"
          >
            <div v-if="loading" class="loader-container">
              <span class="loader">Load&nbsp;ng</span>
            </div>
            <template v-else>
              <div class="wave-container">
                <div class="wave-below fill"></div>
              </div>
              <p v-if="showPhraseText" class="phrase">{{ phrase }}</p>
              <p v-else-if="!isPaused && showTimer" class="phrase timer">{{ timer }}</p>

              <PauseIcon v-else class="pause" />
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
import { savePhrase } from "@/stores/phrases";
import { loadSettings, saveUserSettings } from "@/stores/settings";

import GlobalLoader from "@/components/GlobalLoader.vue";
import LogIn from "@/components/LogIn.vue";

import Logo from "@/components/icons/Logo.vue";
import Draw from "@/components/icons/Draw.vue";
import Show from "@/components/icons/Show.vue";
import Speak from "@/components/icons/Speak.vue";
import LogOutIcon from "@/components/icons/LogOutIcon.vue";
import SettingsIcon from "@/components/icons/SettingsIcon.vue";
import PlayIcon from "@/components/icons/PlayIcon.vue";
import StopIcon from "@/components/icons/StopIcon.vue";
import PauseIcon from "@/components/icons/PauseIcon.vue";
import QuestionIcon from "@/components/icons/QuestionIcon.vue";
import RotateIcon from "@/components/icons/RotateIcon.vue";

const startSound = new Audio("/sounds/drums.wav");
const endSound = new Audio("/sounds/finish.wav");

const phrase = ref("");
const error = ref(null);
const globalLoading = ref(true);
const loading = ref(false);
const accessToken = ref(null);

const timer = ref("02:00");
const countdown = ref(120);
const showTimer = ref(false);
const isPaused = ref(false);
const isPreparing = ref(false);

const isSettings = ref(false);
const preparationTime = ref(20);
const explanationTime = ref(120);

let intervalId = null;

const showPhrase = ref(false);
const phraseFilled = ref(false);
const showHint = ref(false);

const API_BASE_URL = import.meta.env.VITE_API_URL;

async function generatePhrase(mode) {
  loading.value = true;
  error.value = null;
  phrase.value = null;
  showPhrase.value = true;
  phraseFilled.value = false;

  try {
    const response = await axios.post(`${API_BASE_URL}/generatePhrase`, {
      mode,
      uid: currentUser.value.uid,
    });

    phrase.value = response?.data?.phrase;
    if (!phrase.value) throw new Error("Фраза не найдена");

    setTimeout(() => {
      phraseFilled.value = true;
    }, 1000);

    savePhrase(phrase.value);
  } catch (err) {
    console.error("Ошибка при генерации фразы:", err);
    error.value =
      err.response?.data?.error || "Не удалось сгенерировать фразу";
  } finally {
    loading.value = false;
  }
}


function startCountdown() {
  showTimer.value = true;
  updateTimerDisplay();

  intervalId = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
      updateTimerDisplay();
    } else {
      clearInterval(intervalId);
      showTimer.value = false;
      showPhraseText.value = true;
    }
  }, 1000);
}

function updateTimerDisplay() {
  const minutes = String(Math.floor(countdown.value / 60)).padStart(2, "0");
  const seconds = String(countdown.value % 60).padStart(2, "0");
  timer.value = `${minutes}:${seconds}`;
}

function togglePause() {
  if (countdown.value === 0) {
    stopGame();
    return;
  }
  isPaused.value = !isPaused.value;

  const wave = document.querySelector(".wave-below");

  if (isPaused.value && wave) {
    clearInterval(intervalId);

    if (isPreparing.value) {
      if (preparationTimeoutId) {
        clearTimeout(preparationTimeoutId);
        preparationTimeoutId = null;
      }

      wave.classList.remove("fill");
      isPreparing.value = false;
      showPhraseText.value = false;
      showTimer.value = true;
      countdown.value = explanationTime.value;
    } else {
      wave.style.animationPlayState = "paused";
    }
  } else {
    if (!isPreparing.value && countdown.value < explanationTime.value) {
      wave.style.animationPlayState = "running";
      startCountdown();
    } else {
      wave.classList.add("drain");
      wave.style.animationPlayState = "running";
      showTimer.value = true;
      countdown.value = explanationTime.value;
      startCountdown();
    }
  }
}

function stopGame() {
  clearInterval(intervalId);
  showTimer.value = false;
  showPhrase.value = false;
  phrase.value = null;
  countdown.value = 120;
  timer.value = "02:00";
  isPaused.value = false;
  error.value = null;

  const wave = document.querySelector(".wave-below");
  if (wave) {
    wave.classList.remove("fill");
    wave.classList.add("drain");
    wave.style.animationPlayState = "running";
  }

  const phraseEl = document.querySelector(".phrase");
  if (phraseEl) {
    phraseEl.style.display = "block";
  }
}

let preparationTimeoutId = null;
const showPhraseText = ref(false);

watch(loading, (newVal, oldVal) => {
  if (oldVal === true && newVal === false && phrase.value) {
    isSettings.value = false;
    phraseFilled.value = true;
    isPreparing.value = true;
    showPhraseText.value = true;
    countdown.value = explanationTime.value;
    saveUserSettings({
      preparationTime: preparationTime.value,
      explanationTime: explanationTime.value,
    });

    document.documentElement.style.setProperty(
      "--prep-time",
      `${preparationTime.value}s`
    );
    document.documentElement.style.setProperty(
      "--explain-time",
      `${explanationTime.value}s`
    );

    nextTick(() => {
      const wave = document.querySelector(".wave-below");

      if (wave) {
        wave.classList.remove("drain");
        wave.classList.add("fill");
        wave.style.animationPlayState = "running";

        preparationTimeoutId = setTimeout(() => {
          if (isPaused.value) return;

          isPreparing.value = false;
          showPhraseText.value = false;

          wave.classList.remove("fill");
          wave.classList.add("drain");
          wave.style.animationPlayState = "running";

          startCountdown();
        }, preparationTime.value * 1000);
      }
    });
  }
});

watch(countdown, (value) => {
  if (value === 0) {
    showTimer.value = false;
    isPaused.value = false;
    isPreparing.value = false;
    showPhraseText.value = true;
  }
  if (value === 119) {
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
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
  position: relative;
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
    overflow-y: scroll;
    scroll-snap-type: y mandatory;

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
}

.circle {
  position: relative;
  padding: 15px;
  border-radius: 50%;
  width: 60vw;
  height: 60vw;
  max-width: 300px;
  max-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  box-shadow: 0 0 10px #f8f8f8ec;
  transition: transform 0.1s ease, filter 0.1s ease;

  &:active {
    transform: scale(0.95);
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
}

.phrase.timer {
  font-size: 48px;
}

.wave-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.wave-below {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #0099ff;
  z-index: -1;
}

.wave-below.fill {
  clip-path: polygon(0% 100%, 0% 100%, 100% 100%, 100% 0%);
  animation: fill-below calc(var(--prep-time, 20s)) linear forwards;
}

.wave-below.drain {
  clip-path: polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%);
  animation: drain-below calc(var(--explain-time, 120s)) linear forwards;
}

@keyframes drain-below {
  0% {
    clip-path: inset(0 0 0 0);
  }
  100% {
    clip-path: inset(100% 0 0 0);
  }
}

@keyframes fill-below {
  0% {
    clip-path: inset(100% 0 0 0); /* Весь блок скрыт снизу */
  }
  100% {
    clip-path: inset(0 0 0 0); /* Полностью видим */
  }
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

.loader {
  color: #fff;
  position: relative;
  display: inline-block;
  margin-top: 10px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 48px;
  letter-spacing: 4px;
  box-sizing: border-box;
}
.loader::before {
  content: "";
  position: absolute;
  right: 70px;
  bottom: 10px;
  height: 28px;
  width: 5.15px;
  background: currentColor;
  box-sizing: border-box;
  animation: animloader1 1s linear infinite alternate;
}
.loader::after {
  content: "";
  width: 10px;
  height: 10px;
  position: absolute;
  left: 125px;
  top: 2px;
  border-radius: 50%;
  background: #0099ff;
  box-sizing: border-box;
  animation: animloader 1s linear infinite alternate;
}

@keyframes animloader {
  0% {
    transform: translate(0px, 0px) scaleX(1);
  }
  14% {
    transform: translate(-12px, -16px) scaleX(1.05);
  }
  28% {
    transform: translate(-27px, -28px) scaleX(1.07);
  }
  42% {
    transform: translate(-46px, -35px) scaleX(1.1);
  }
  57% {
    transform: translate(-70px, -37px) scaleX(1.1);
  }
  71% {
    transform: translate(-94px, -32px) scaleX(1.07);
  }
  85% {
    transform: translate(-111px, -22px) scaleX(1.05);
  }
  100% {
    transform: translate(-125px, -9px) scaleX(1);
  }
}

@keyframes animloader1 {
  0% {
    box-shadow: 0 -6px, -122.9px -8px;
  }
  25%,
  75% {
    box-shadow: 0 0px, -122.9px -8px;
  }
  100% {
    box-shadow: 0 0px, -122.9px -16px;
  }
}

.pause {
  width: 30px;
  height: 30px;
  color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  svg {
    width: 90%;
    height: 90%;
    filter: drop-shadow(0 0 15px #f8f8f8ec);
    color: #fff;
  }
}

.red-bg {
  background: linear-gradient(to bottom, #ff1100 0%, #fff 100%);
}
.round-icon {
  color: #fff;
  filter: drop-shadow(0 0 10px #e40808ec);
  position: absolute;
  width: 30px;
  height: 30px;
}
.question {
  top: 20%;
}
.stop {
  top: 24%;
  left: 20%;
  transition: transform 0.1s ease, filter 0.1s ease;

  &:active {
    transform: scale(0.95);
    filter: brightness(0.9);
  }
}
.hint {
  position: absolute;
  top: 12%;
  color: #fff;
  font-size: 26px;
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
