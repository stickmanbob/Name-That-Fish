<script>
    export let didWin;
    export let reset; 
    
</script>

<div>
    {#if didWin}
        <h1>Congrats Matey, you win!</h1>
        <img src="./assets/win.gif" alt="">
    {:else}
        <h1>Shiver Me Timbers, yer fish knowledge needs some haulin'!</h1>
        <img src="./assets/lose.gif" alt="">
    {/if}
    <button on:click={reset}>Play Again!</button>
</div>

<style>
   div{
    display: flex;
    flex-direction: column;
    align-items: center;

    border: 2px solid black;
    border-radius: 6px;
    padding: 10px 20px;
    background-color: #d4d2ab;

   }

   img{
       margin-top: 20px;
   }

    h1{
        font-size: 36px;
        color:black; 
        font-weight: 600;
    }

    button{
        margin-top: 10px;
    }
    @media (max-width: 450px){

        div{
            padding: 5px;
            width: 90%;
            box-sizing: border-box;
        }

        img{
            max-width:300px
        }

        h1{
            font-size:28px;
        }
    }

    /* @media (max-width: 320px){
        img{
            max-width: 320px;
        }
    } */
</style>