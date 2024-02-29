<script setup lang="ts">
const router= useRouter();

function gotoPage2(){
  console.log(router)
  router.push('page2')
}
</script>

<template>
  <div>
    <button @click="gotoPage2">this is common button,click goto page2</button>
  </div>
</template>