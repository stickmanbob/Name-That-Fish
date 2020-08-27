<script>
    export let status;
</script>

{#if status === 'correct'}
    <h1 class="right">GREAT JOB, MATEY!</h1>
{:else if status === 'incorrect'}
    <h1 class="wrong">SWAB THE DECK!</h1>
{/if}

<style>

    h1{
        font-size: 40px;
    }
    h1.right{
        color:green;
    }
    h1.wrong{
        color:red;
    }
</style>