<script>

	//Components
	import Header from "./components/Header.svelte";
	import Game from "./components/Game.svelte";
</script>

<main>
	<Header/>

	<Game/>
</main>

<style>
	main {
		max-width: 300px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
	}


	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
