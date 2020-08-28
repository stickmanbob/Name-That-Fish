<script>
    export let status;
</script>

{#if status === 'correct'}
    <h1 class="right">GREAT JOB, MATEY!</h1>
{:else if status === 'incorrect'}
    <h1 class="wrong">WALK THE PLANK!</h1>
{/if}

<style>

    h1{
        font-size: 30px;
        text-align: center;
        margin-bottom: 5px;
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: black;
    }
    h1.right{
        color:green;
    }
    h1.wrong{
        color:red;
    }
</style>