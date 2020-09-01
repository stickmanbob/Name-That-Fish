<script>
    export let returnToMenu
    import { fade } from 'svelte/transition';
</script>

<section in:fade>
    <h1>Instructions</h1>

    <p> Ahoy Matey! Welcome to Name That Fish, the official time wasting quiz game of Boy Scout Troop 476! Here's how to play:</p>
    <ul>
        <li>Ye'll be presented with a picture of a fish and a set of four names to choose from. Use yer seafarin' knowledge to click the correct one!</li>
        <li>Each time you answer, we'll let ye know if ye called it right ("Good Job Matey!") or if ye bungled it ("Walk the Plank!")</li>
        <li>Ye get three tries to bungle it up before ye fall off the plank! Make it to the end of the quiz without failin' and ye win!</li>
    </ul>

    <button on:click={returnToMenu}>
        Back to the Bridge!
    </button>
</section>

<style>
     section{
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 50px;

        border:2px solid black;
        border-radius: 6px;

        padding: 10px 30px;

        background-image: url("../assets/header_background.jpg");

        max-width: 500px;


    }

    h1{
        font-size: 30px; 
        
        margin-bottom: 20px;
    }

    ul{
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }

    li{
        list-style-type: disc;
        padding: 5px 0px;
    }

    p{
        margin-bottom: 10px;

    }
</style>