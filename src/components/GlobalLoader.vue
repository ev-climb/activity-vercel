<template>
  <div class="loader-container">
  <Logo class="logo" />
    <span class="loader"></span>
  </div>
</template>
<script setup lang="ts">  
import Logo from './icons/Logo.vue';
</script>
<style scoped>
.loader-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
}
.loader {
  display: block;
  position: relative;
  height: 6px;
  width: 50%;
  border: 1px solid #fff;
  border-radius: 10px;
  overflow: hidden;
}
.loader:after {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background: #ffffff;
  animation: 6s prog ease-in infinite;
}

.logo {
  width: 55%;
}

@keyframes prog {
  to {
    width: 100%;
  }
}
</style>
