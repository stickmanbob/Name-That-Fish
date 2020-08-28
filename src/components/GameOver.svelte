<script>
    export let didWin;
    export let reset; 
    export let returnToMenu; 
    
</script>

<div>
    {#if didWin}
        <h1 class="win">Hats off to ye Matey, you win!</h1>
        <img src="./assets/win.gif" alt="">
    {:else}
        <h1 class='lose'>Thunderin' Typhoons, yer fish knowledge needs some hoistin'!</h1>
        <img src="./assets/lose.gif" alt="">
    {/if}
    <button on:click={reset}>Play Again!</button>
    <button on:click={returnToMenu}>Back to the Bridge!</button>
</div>

<style>
   div{
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 700px;
    border: 2px solid black;
    border-radius: 6px;
    padding: 10px 20px;
    /* background-color: #d4d2ab; */
    background-image: url("../assets/header_background.jpg");

   }

   img{
       margin-top: 20px;
   }

    h1{
        font-size: 36px;
        color:black; 
        font-weight: 600;
        text-align: center;
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: black;
    }

    h1.win{
        color: green;
    }

    h1.lose{
        color:red;
    }

    button{
        margin-top: 10px;
        box-shadow:inset 0px 1px 0px 0px #a6827e;
        background-color:#7d5d3b;
        border-radius:3px;
        border:1px solid #54381e;
        display:inline-block;
        cursor:pointer;
        color:#ffffff;
        font-size:25px;
        padding:12px 28px;
        text-decoration:none;
        text-shadow:0px 1px 0px #4d3534;
    }

    button:hover{
        background-color:#634b30;
    }

    button:active{
        position:relative;
	    top:1px;
    }
    @media (max-width: 450px){

        div{
            padding: 10px 5px;
            width: 90%;
            box-sizing: border-box;
        }

        img{
            max-width:300px
        }

        h1{
            font-size:20px;
        }

        button{
            font-size: 16px;
            padding: 8px 20px;
        }
    }

    /* @media (max-width: 320px){
        img{
            max-width: 320px;
        }
    } */
</style>