<template>
  <div>
    this is page2 page
    <button @click="test">Request backend test</button>
  </div>  
</template>

<script setup lang="ts">
  async function test() {
    const { data } = await useFetch('/api/test');    
    window.alert(data.value.message);
  }
</script>