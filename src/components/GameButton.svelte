<script>
import { afterUpdate } from "svelte";


    export let label;
    export let onPress;
    export let disableButtons;
    export let correctAns;

</script>

<div class={disableButtons ? "" : "hover"} on:click={ disableButtons ? "" : onPress} data-value={label} >
    {#if !disableButtons}
        <i class="fas fa-dharmachakra" data-value={label} ></i>
    {:else}
        {#if correctAns}
            <i class="fas fa-check-circle correct"></i>
        {:else}
            <i class="fas fa-times incorrect"></i>
        
        {/if}
    {/if}
     <span data-value={label}>{label}</span>
</div>

<style>
    i{
        font-size: 40px;
        color: rgb(92, 53, 53);
        padding-right: 5px;
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

    div.hover{
        cursor:pointer;
    }

    div.hover:hover span{
        color:green;
    }

    div.hover:hover i{
        color: black;
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
