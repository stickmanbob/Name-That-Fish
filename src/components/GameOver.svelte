<script>
    export let didWin;
    export let reset; 
    
</script>

<div>
    {#if didWin}
        <h1>Congrats Matey, you win!</h1>
        <iframe src="https://giphy.com/embed/Jev4iU72S9RYc" width="480" height="198" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/johnny-depp-pirates-of-the-caribbean-jack-sparrow-Jev4iU72S9RYc">via GIPHY</a></p>
    {:else}
        <h1>Shiver Me Timbers, yer fish knowledge needs some haulin'!</h1>
        <iframe src="https://giphy.com/embed/1vz0yLYFTJEVG" width="480" height="195" frameBorder="0" class="giphy-embed" allowFullScreen></iframe><p><a href="https://giphy.com/gifs/pirates-of-the-caribbean-will-turner-davy-jones-1vz0yLYFTJEVG">via GIPHY</a></p>
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
    padding:20px;
    background-color: #d4d2ab;

   }

    h1{
        font-size: 36px;
        color:black; 
        font-weight: 600;
    }

</style>