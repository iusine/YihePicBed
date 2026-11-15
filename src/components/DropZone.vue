<template>
  <div
    class="dropzone"
    :class="{ focus }"
    @click="pick"
    @dragover.prevent="focus = true"
    @dragleave.prevent="focus = false"
    @drop.prevent="onDrop"
  >
    <input ref="input" type="file" :accept="accept" :multiple="multiple" style="display: none" @change="onInputChange">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'DropZone',
  props: {
    accept: { type: String, default: 'image/*' },
    multiple: { type: Boolean, default: true }
  },
  emits: ['files'],
  data() {
    return { focus: false }
  },
  methods: {
    pick() {
      this.$refs.input.value = ''
      this.$refs.input.click()
    },
    onInputChange(e) {
      const files = Array.from(e.target.files || [])
      if (files.length) this.$emit('files', files)
    },
    onDrop(e) {
      this.focus = false
      const files = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'))
      if (files.length) this.$emit('files', files)
    }
  }
}
</script>
