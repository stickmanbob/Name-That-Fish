// Utility function for retreiving a random array member
export function getRandomValue(array) {
    let idx = Math.floor(Math.random() *(array.length));
    return array[idx];
}

// Returns a random index from and array
export function getRandomIndex(array){
    return Math.floor(Math.random() * (array.length))
}

//Shuffles an array
export function shuffleArray(array) {
    let currentIndex = array.length -1;

    // while there are elements left to shuffle:
    while(currentIndex !== 0){

        // Pick and element to shuffle
        let randomIndex = Math.floor(Math.random()*currentIndex);

        // And swap it with this one
        
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];

        currentIndex --;
    }
    return array; 
}

//Returns a random sample of size n from array
export function sample(arr, n){
    let shuffled = shuffleArray(arr);
    return shuffled.slice(0,n);
}

// console.log(shuffle([1,2,3,4,5]));
