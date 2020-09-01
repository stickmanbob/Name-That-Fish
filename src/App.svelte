<script>

	//Components
	import Header from "./components/Header.svelte";
	import Game from "./components/Game.svelte";
	import Footer from "./components/Footer.svelte";
	import Menu from "./components/Menu.svelte";
	import Instructions from "./components/Instructions.svelte";

	var mainComponent = "menu"

	//Returns a callback function that changes the value of mainComponent
	//Used to allow frontend routing via Svelte's conditional rendering
	function navigate(component){
		return (e) => {
			e.preventDefault();
			mainComponent = component;
		}
	}

</script>

<main>
	<Header/>

	{#if mainComponent === "menu"}
		<Menu startGame={navigate("game")}
			viewInstructions={navigate("instructions")}
		/>
	{:else if mainComponent === "game"}
		<Game returnToMenu={navigate("menu")}/>
	{:else if mainComponent === "instructions"}
		<Instructions returnToMenu={navigate("menu")}/>
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

	@media (max-width: 450px){
		main{
			padding-bottom: 89px;
		}
	}

</style>
