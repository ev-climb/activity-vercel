<template>
  <span class="loader"></span>
</template>
<style scoped>
.loader {
  width: 13px;
  height: 13px;
  border: 3px solid #ffffff77;
  border-radius: 50%;
  display: inline-block;
  position: relative;
  box-sizing: border-box;
  animation: rotation 0.5s linear infinite;
} 
.loader::after {
  content: '';  
  box-sizing: border-box;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-bottom-color: #e79d1f;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
} 
</style>