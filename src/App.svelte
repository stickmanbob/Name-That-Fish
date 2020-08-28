<script>

	//Components
	import Header from "./components/Header.svelte";
	import Game from "./components/Game.svelte";
	import Footer from "./components/Footer.svelte";
import Menu from "./components/Menu.svelte";

	var mainComponent = "menu"

	function startGame(e){
		e.preventDefault(); 
		mainComponent = "game"
	}

</script>

<main>
	<Header/>

	{#if mainComponent === "menu"}
		<Menu startGame={startGame}/>
	{:else if mainComponent === "game"}
		<Game/>
	{/if}
	

	<Footer/>
</main>

<style>
	main {
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		background-image: url("../assets/background.jpg");
		background-size: cover;
		min-height: 100vh;
		position: relative;
	}


	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

</style>
