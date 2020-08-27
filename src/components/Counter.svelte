<script>
    export let numAttempts;
    export let questionNumber;
    export let questionsLeft;
</script>

<div>
    <span class="field">Question: <span class="questions"> {questionNumber}</span> of {questionsLeft}</span>
    <span class="field">Wrong answers left: <span class="attempts">{numAttempts}</span></span>
</div>

<style>
    div{
       
        color: black;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: 24px;
        margin-top: 5px;
        border-radius: 8px;
        padding: 5px 20px;
       
        background-image: linear-gradient(to bottom,  #c9a66f, #9a7149);
        
    }

    .attempts{
        color: red; 
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: black;
    }

    .questions{
        -webkit-text-stroke-width: 1px;
        -webkit-text-stroke-color: black;
        color: lightseagreen;
    }
    @media(max-width: 450px){
        div{
            font-size: 18px;
        }
        
    }
</style>
