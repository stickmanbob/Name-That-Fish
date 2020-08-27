<script>
    export let label;
    export let onPress;
</script>

<div>
    <!-- <button value={label} on:click={onPress}> </button>  -->
    <i class="fas fa-dharmachakra" on:click={onPress} data-value={label}></i>
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

    button{
        background-color: transparent;
        border: none;
    }

    div{
        display: flex;
        align-items: center;
        padding: 10px 0px;
    }

    span{
        font-size: 20px;
        font-weight: 600;
    }
</style>
