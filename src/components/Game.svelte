<script>

    import { getRandomIndex, shuffleArray } from "../util/util";
    import fishURLs from "../fish.json";
    import GameButton from "./GameButton.svelte";
    import CorrectMSG from "./CorrectMsg.svelte";
import CorrectMsg from "./CorrectMsg.svelte";

    let allFishNames = Object.keys(fishURLs);

    let newFishNames = Array.from(allFishNames);

    
    // Returns a new fish that we have not seen before
    // Used to select the next fish for guessing
    
    function getNewFishName(){
        
        let newFishIdx = getRandomIndex(newFishNames)
        let newFish = newFishNames[newFishIdx];
        newFishNames.splice(newFishIdx,1);
        
        return newFish;
    }

    //return an array of 4 unique fish names, one of which is passed in
    // used to populate the answer choices
    function getAnswers(correctFish){
        let answers = [correctFish];
        let tempFishNames = allFishNames.filter((fishName) => fishName !== correctFish)

        while (answers.length < 4){
            let idx = getRandomIndex(tempFishNames);
            let fish = tempFishNames[idx];
            
            answers.push(fish);
            tempFishNames.splice(idx,1);
        }
        return shuffleArray(answers); 
    }

    function handleAnswer(e){
        e.preventDefault();
        
        if (e.target.dataset.value === currFish){
            correct = "correct";
        } else{
            correct = "incorrect"
        }

        nextQuestion();
    }

    function nextQuestion(){

        if(newFishNames.length > 0){
            currFish = getNewFishName();
            fishURL = fishURLs[currFish];
            answers = getAnswers(currFish);
        } else{
            youWin(); 
        }
         
    }

    function youWin(){
        gameOver = true;
    }

    //Game Loop

    var currFish = getNewFishName();
    var fishURL = fishURLs[currFish];
    var answers = getAnswers(currFish);
    var gameOver = false;
    var correct = null;


</script>

<!-- Main Component -->

{#if !gameOver}

    <section>
        <img class="fish" src={fishURL} alt="A fish!">
        <CorrectMsg status={correct}/>

        <div class="answers">
            {#each answers as answer}
                <GameButton label={answer} onPress={handleAnswer}/>
            {/each}
            
        </div>
    </section>
    
{:else}
    <h1>YOU WIN!!!</h1>
{/if}


<style>
    section{
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .answers{
        width: 520px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 50px;
        background:transparent url(https://img2.annthegran.com/PrintArt/XLarge/Great_Notions/pg52403.jpg);
        background-size: cover;
        padding: 10px 30px; 
    }

    img.fish{
        height:400px; 
    }
</style>