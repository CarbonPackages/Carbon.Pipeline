<script>
    import './_Svelte.css';

    let name = $state('Carbon.Pipeline');
    let count = $state(0);

    function increment() {
		count ++;
	}
</script>

<div class="container">
    <input type="text" bind:value={name}>
    <h1>Hello {name}!</h1>
    <button onclick={increment}>
        count is {count}
    </button>
</div>

<style>
    h1 {
        color:green;
    }
    :global(button) {
        color:red;
    }
</style>
