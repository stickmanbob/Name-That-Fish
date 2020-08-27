<script>

	//Components
	import Header from "./components/Header.svelte";
	import Game from "./components/Game.svelte";
import Footer from "./components/Footer.svelte";
</script>

<main>
	<Header/>

	<Game/>

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
		min-height: fit-content;
	}


	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

</style>
