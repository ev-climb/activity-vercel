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
  <RouterView />
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

@media screen and (orientation: landscape) {
  .rotate-overlay {
    display: flex;
  }
}
</style>
