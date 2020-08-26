// Utility function for retreiving a random array member
export function getRandomValue(array) {
    let idx = Math.floor(Math.random() *(array.length));
    return array[idx];
}

export function getRandomIndex(array){
    return Math.floor(Math.random() * (array.length))
}

// console.log(getRandomValue([1,2,3,4,5]));