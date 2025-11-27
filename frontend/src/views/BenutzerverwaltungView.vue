<template>
  <MainLayout>
    <div class="page-container">
      <h1>Benutzerverwaltung</h1>
      <p>Diese Seite wird noch entwickelt...</p>
    </div>
  </MainLayout>
</template>

<script setup lang="ts">
import MainLayout from '../layouts/MainLayout.vue'
</script>

<style scoped>
.page-container {
  padding: 2rem;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%);
}

h1 {
  color: #ff006e;
  background: linear-gradient(135deg, #ff006e 0%, #8338ec 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
  font-size: 1.75rem;
  font-weight: 700;
}

p {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
}
</style>
