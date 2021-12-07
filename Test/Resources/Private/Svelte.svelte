<script>
    let name = 'Carbon.Pipeline';
</script>

<input type="text" bind:value={name}>

<h1>Hello {name}!</h1>
<h2>Hello {name}!</h2>

<style>
    h1 {
        color:green;
    }
    :global(h2) {
        color:red;
    }
</style>
