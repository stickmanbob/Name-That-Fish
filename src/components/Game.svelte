<script>

    import { getRandomIndex, shuffleArray } from "../util/util";
    import fishURLs from "../fish.json";
    import GameButton from "./GameButton.svelte";
    import CorrectMSG from "./CorrectMsg.svelte";
    import GameOver from "./GameOver.svelte";
    import CorrectMsg from "./CorrectMsg.svelte";
    import Counter from "./Counter.svelte";

    //Initialize game state
    let allFishNames = Object.keys(fishURLs);

    let newFishNames = Array.from(allFishNames);
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
        newFishNames = Array.from(allFishNames);
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

    <section>
        <img class="fish" src={fishURL} alt="A fish!">
        
        {#if correct}
            <div class="result">
                <CorrectMsg status={correct}/>
                <button on:click={nextQuestion}>Next Fish!</button>
            </div>
        {/if}

        <Counter numAttempts={numAttempts} questionNumber={questionNumber} questionsLeft={questionsLeft} />

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
        <section>
        <GameOver reset={resetGame} didWin={didWin}/>
        </section>
    
{/if}


<style>
    section{
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 40px;
        height: 100vh;
    }

    .answer-box{
        position: relative;
        margin-top: 10px;
    }

    .answer-box img{
        box-sizing: border-box;
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

    .result{
        margin-top: 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    img.fish{
        height:400px; 
        max-width: 600px;
        object-fit: contain;
        border: 8px solid black;
        border-radius: 6px;
        background-color: gray;
    }

    @media (max-width: 450px){
        section{
            margin-top: 10px;
        }
        .answer-box img{
            width: 360px;
            height: 300px;
        }

        img.fish{
            width: 360px;
            box-sizing: border-box;
            height: initial;
        }

        .answers{
            left:20%;
        }
    }

    @media (max-width: 321px){
        .answer-box img{
            width: 320px;
            height: 300px;
        }

        img.fish{
            width: 320px; 
            height: initial;
        }
    }
</style>