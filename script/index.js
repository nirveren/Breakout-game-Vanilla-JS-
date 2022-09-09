const eLink = document.querySelector("#easy");
const nLink = document.querySelector("#norm");
const hLink = document.querySelector("#hard");
let score = document.querySelector("#score");

 score.innerHTML = JSON.parse(localStorage.getItem('KEY_SCORE'))



const attrEasy = './game.html?e=Easy'
const attrNorm = './game.html?n=Normal'
const attrHard = './game.html?h=Hard'
const createEasy = eLink.setAttribute('href', attrEasy)
const createNorm = nLink.setAttribute('href', attrNorm)
const createHard = hLink.setAttribute('href', attrHard)

