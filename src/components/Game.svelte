<script>

    import { getRandomIndex } from "../util/util";

    import fishURLs from "../fish.json"

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
        return answers; 
    }

    //Game Loop

    
</script>



 
