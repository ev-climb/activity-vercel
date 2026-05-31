<script setup lang="ts">
</script>

<template>
  <div class="rotate-overlay">
    <div class="rotate-message">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="4" y="2" width="10" height="16" rx="2"/>
        <path d="M17 8l3 3-3 3"/>
        <path d="M20 11H14"/>
      </svg>
      <p>Поверните телефон</p>
    </div>
  </div>
  <div class="desktop-scene">
    <div class="phone-shell">
      <div class="phone-screen">
        <RouterView />
      </div>
      <div class="phone-home-bar"></div>
    </div>
  </div>
</template>

<style scoped>
.rotate-overlay {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #0099ff;
  align-items: center;
  justify-content: center;
}

.rotate-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #fff;

  svg {
    width: 64px;
    height: 64px;
    animation: rotate-hint 2s ease-in-out infinite;
  }

  p {
    font-size: 20px;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
  }
}

@keyframes rotate-hint {
  0%, 100% { transform: rotate(0deg); }
  40%       { transform: rotate(90deg); }
  60%       { transform: rotate(90deg); }
}

.desktop-scene {
  width: 100%;
  height: 100%;
}

.phone-shell {
  width: 100%;
  height: 100%;
}

.phone-screen {
  width: 100%;
  height: 100%;
}

.phone-home-bar {
  display: none;
}

/* Mobile landscape only */
@media screen and (orientation: landscape) and (max-width: 1023px) {
  .rotate-overlay {
    display: flex;
  }
}

/* Desktop: phone frame */
@media (min-width: 1024px) {
  .desktop-scene {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background:
      radial-gradient(circle at 35% 40%, rgba(0, 120, 255, 0.14) 0%, transparent 55%),
      radial-gradient(circle at 68% 62%, rgba(0, 210, 245, 0.09) 0%, transparent 50%),
      #060d18;
  }

  .phone-shell {
    position: relative;
    width: 390px;
    height: min(844px, 92vh);
    border-radius: 44px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #000;
    box-shadow:
      0 0 0 2px #1e1e1e,
      0 0 0 10px #0e0e0e,
      0 0 0 12px #2c2c2c,
      0 40px 100px rgba(0, 0, 0, 0.85),
      0 8px 30px rgba(0, 140, 255, 0.12);
  }

  .phone-screen {
    flex: 1;
    overflow: hidden;
    position: relative;
  }

  .phone-home-bar {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 30px;
    flex-shrink: 0;
    background: #000;
  }

  .phone-home-bar::after {
    content: '';
    width: 110px;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
  }
}
</style>
