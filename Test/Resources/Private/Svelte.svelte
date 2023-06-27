<script>
    let name = 'Carbon.Pipeline';
    import './_Svelte.css';
</script>

<div class="container">
    <input type="text" bind:value={name}>
    <h1>Hello {name}!</h1>
    <h2>Hello {name}!</h2>
</div>

<style>
    h1 {
        color:green;
    }
    :global(h2) {
        color:red;
    }
</style>
