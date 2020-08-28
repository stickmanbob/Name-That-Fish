<script>
    export let startGame;
</script>

<section>

    <h1>
        Welcome to Name That Fish!
    </h1>

    <br>

    <button class="menu-button" on:click={startGame}>
        Start Game!
    </button>

    <button class="menu-button">
        View Instructions
    </button>

    <a class="menu-button" target="_blank" href="https://ajay-rajamani.me">
        View my Portfolio
    </a>

    <a class="menu-button" target="_blank" href="https://github.com/stickmanbob/svelteQuizGame#readme">
        View Readme on Github
    </a>

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

        box-sizing: border-box;
        height: 300px;

    }

    h1{
        font-size: 30px; 
        
        margin-bottom: 20px;
    }

    .menu-button{
        box-shadow:inset 0px 1px 0px 0px #a6827e;
        background-color:#7d5d3b;
        border-radius:3px;
        border:1px solid #54381e;
        display:block;
        cursor:pointer;
        color:#ffffff;
        text-decoration:none;
        text-shadow:0px 1px 0px #4d3534;
        font-family: inherit;
        font-size: inherit;
        margin: 0 0 0.5em 0;

        box-sizing: border-box;
        width: 237px; 
        height: 35px;

        display: flex;
        align-items: center;
        justify-content: center;
	
    }

    .menu-button:hover{
        background-color:#634b30;
    }

    .menu-button:active{
        position:relative;
	    top:1px;
    }
</style>