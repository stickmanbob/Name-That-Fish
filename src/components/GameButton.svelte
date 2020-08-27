<script>
import { afterUpdate } from "svelte";


    export let label;
    export let onPress;
    export let disableButtons;
    export let correctAns;

</script>

<div>
    {#if !disableButtons}
        <i class="fas fa-dharmachakra" on:click={onPress} data-value={label}></i>
    {:else}
        {#if correctAns}
            <i class="fas fa-check-circle correct"></i>
        {:else}
            <i class="fas fa-times incorrect"></i>
        
        {/if}
    {/if}
     <span>{label}</span>
</div>

<style>
    i{
        font-size: 40px;
        color: rgb(92, 53, 53);
        padding-right: 5px;
    }

    i.fa-dharmachakra:hover{
        color: black;
        cursor: pointer;
    }

    i.correct{
        font-size: 34px;
        color: green;
    }

    i.incorrect{
        font-size: 36px;
        color:red;
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

    @media(max-width: 450px){
        i{
            font-size: 28px;

        }

         i.correct{
            font-size: 30px;
        }

        i.incorrect{
            font-size: 32px;
        }

        span{
            font-size: 16px;
            line-height: 34px;
        }

        div{
            padding: 5px 0px;
        }
    }
</style>
