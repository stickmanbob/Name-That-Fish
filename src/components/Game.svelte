<script>

    export let returnToMenu; 

    import { getRandomIndex, shuffleArray, sample } from "../util/util";
    import fishURLs from "../fish.json";
    import GameButton from "./GameButton.svelte";
    import CorrectMSG from "./CorrectMsg.svelte";
    import GameOver from "./GameOver.svelte";
    import CorrectMsg from "./CorrectMsg.svelte";
    import Counter from "./Counter.svelte";
    import { fade, fly } from 'svelte/transition';

    //Initialize game state
    let allFishNames = Object.keys(fishURLs);
    let gameLength = 10
    let newFishNames = getFishSet(gameLength);
    var questionsLeft = newFishNames.length;
    var questionNumber = 0;
    var currFish = getNewFishName();
    var fishURL = fishURLs[currFish];
    var answers = getAnswers(currFish);
    var gameOver = false;
    var correct = null;
    var disableButtons = false;
    var score = 0;
    var numAttempts = 3;
    var didWin = false;

    //Returns a sample of <size> fish as an array
    function getFishSet(size){
        return sample(allFishNames, size);
    }
    
    
    // Returns a new fish that we have not seen before
    // Used to select the next fish for guessing
    function getNewFishName(){
        
        let newFishIdx = getRandomIndex(newFishNames)
        let newFish = newFishNames[newFishIdx];
        newFishNames.splice(newFishIdx,1);
        
        questionNumber ++; 
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
        newFishNames = getFishSet(10);
        questionsLeft = newFishNames.length; 
        questionNumber = 0;
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

     
</script>

<!-- Main Component -->

{#if !gameOver}

    <section transition:fade>
        <img  class="fish" src={fishURL} alt="A fish!">
        
        <Counter numAttempts={numAttempts} questionNumber={questionNumber} questionsLeft={questionsLeft} />

        {#if correct}
            <div in:fade class="result">
                <CorrectMsg status={correct}/>
                <button on:click={nextQuestion}>Next Fish!</button>
            </div>
        {/if}

        

        <div class="answer-box">
            <img src="./assets/answerBox.png" alt="Answer box">
            <div class="answers">
                {#each answers as answer}
                    <GameButton label={answer} onPress={handleAnswer} correctAns={currFish === answer} disableButtons ={disableButtons}/>
                {/each} 
            </div>
        </div>
        

    </section>
    
{:else}
        <section in:fly={{ y: 200, duration: 2000 }} out:fade>
        <GameOver reset={resetGame} 
            didWin={didWin}
            returnToMenu={returnToMenu}
            correctFish={score}
            totalFish={gameLength}
        />
        </section>
    
{/if}


<style>
    section{
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 20px;
        height: 100vh;
    }

    .answer-box{
        position: relative;
        margin-top: 10px;
    }

    .answer-box img{
        box-sizing: border-box;

        width: 680px;
        height: 200px;
    }


    .answers{
        position: absolute;
        top: 15%;
        left: 8%; 
        /* display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center; */
        column-count: 2;
        column-gap: 20px;
        column-width: 280px;
        width: fit-content;
    }

    .result{
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .result button{
        margin-bottom: 0px;
    }

    img.fish{
        max-height:400px; 
        max-width: 650px;
        object-fit: contain;
        border: 8px solid black;
        border-radius: 6px;
        background-color: gray;
    }

    @media (max-width: 450px){
        section{
            margin-top: 10px;
            min-height: 720px;
        }
        .answer-box img{
            width: 360px;
            height: 225px;
        }

        img.fish{
            width: 360px;
            box-sizing: border-box;
            height: initial;
        }

        .answers{
            display: flex;
            flex-direction: column;
            align-items:flex-start ;
            left:10%;
            top: 10%;
        }
    }

    @media (max-width: 321px){
        .answer-box img{
            width: 320px;
            height: 225px;
        }

        img.fish{
            width: 320px; 
            height: initial;
        }
    }
</style>