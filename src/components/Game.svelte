<script>

    import { getRandomIndex, shuffleArray } from "../util/util";
    import fishURLs from "../fish.json";
    import GameButton from "./GameButton.svelte";
    import CorrectMSG from "./CorrectMsg.svelte";
    import GameOver from "./GameOver.svelte";
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

    //Process the answer and update game state
    function handleAnswer(e){
        e.preventDefault();
        
        if (e.target.dataset.value === currFish){
            correct = "correct";
            score +=1;
        } else{
            correct = "incorrect"
            numAttempts -=1;
            if (numAttempts === 0){
                youLose();
            }
        }

        disableButtons = true;
    }

    // Load the next question
    function nextQuestion(){
        correct = null;
        disableButtons = false; 
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
        didWin = true;
    }

    function youLose(){
        gameOver = true;
        didWin = false; 
    }

    //Reset Game State
    function resetGame(){
        
        allFishNames = Object.keys(fishURLs);
        newFishNames = Array.from(allFishNames);
        currFish = getNewFishName();
        fishURL = fishURLs[currFish];
        answers = getAnswers(currFish);
        gameOver = false;
        correct = null;
        disableButtons = false;
        score = 0;
        numAttempts = 3;
        didWin = false; 
    }

    //Initialize game state

    var currFish = getNewFishName();
    var fishURL = fishURLs[currFish];
    var answers = getAnswers(currFish);
    var gameOver = false;
    var correct = null;
    var disableButtons = false;
    var score = 0;
    var numAttempts = 3;
    var didWin = false; 
</script>

<!-- Main Component -->

{#if !gameOver}

    <section>
        <img class="fish" src={fishURL} alt="A fish!">
        
        {#if correct}
            <CorrectMsg status={correct}/>
            <button on:click={nextQuestion}>Next Fish!</button>
        {/if}

        <div class="answer-box">
            <img src="./assets/answerBox.png" alt="Answer box">
            <div class="answers">
                {#each answers as answer}
                    <GameButton label={answer} onPress={handleAnswer} disableButtons ={disableButtons}/>
                {/each} 
            </div>
        </div>
        

    </section>
    
{:else}
    
        <GameOver reset={resetGame} didWin={didWin}/>
    
{/if}


<style>
    section{
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 40px;
    }

    .answer-box{
        position: relative;
        margin-top: 50px;
    }


    .answers{
        position: absolute;
        top: 10%;
        left: 30%; 
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;

    }

    

    img.fish{
        height:400px; 
        max-width: 100%;
    }
</style>