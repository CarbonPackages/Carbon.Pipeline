<template>
    <div>
        <input type="text" v-model="name"/>
        <h1>Hello {{ name }}!</h1>
    </div>
</template>


<script>
    export default {
        data() {
            return {
                name: 'Carbon.Pipeline'
            }
        }
    }
</script>

<style scoped>
    h1 {
        color:green;
    }
</style>
