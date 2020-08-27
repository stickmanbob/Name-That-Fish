<script>
    export let label;
    export let onPress;
    export let disableButtons;
</script>

<div>
    {#if !disableButtons}
        <i class="fas fa-dharmachakra" on:click={onPress} data-value={label}></i>
    {/if}
     <span>{label}</span>
</div>

<style>
    i{
        font-size: 40px;
        color: rgb(92, 53, 53);
    }

    i:hover{
        color: black;
        cursor: pointer;
    }


    div{
        display: flex;
        align-items: center;
        padding: 10px 0px;
    }

    span{
        font-size: 20px;
        line-height: 40px;
        font-weight: 600;
        color: black;
    }
</style>
