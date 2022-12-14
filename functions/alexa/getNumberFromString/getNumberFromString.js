//Eingabe Alexa: drei hundert zwei und vierzig milliarden neun hundert sieben und achtzig tausend drei hundert sieben und vierzig
//IN: string from summary DP
//OUT: number from string (if no number is detected: -1)

let arrWords;
let firstWord = true;
let containsNumber = false;

let mrd = false;
let mio = false;
let tsd = false;
let hun = false;

let num = 0;
let numMrd = 0;
let numMio = 0;
let numTsd = 0;
let result = 0;

arrWords = strWords.split(' ');

for(let i = 0; i < arrWords.length; i++) {

  num = 0;

  switch(arrWords[i]) {
    case 'milliarde':
    case 'milliarden':
      mrd = true; break;
    case 'million':
    case 'millionen':
      mio = true; break;
    case 'tausend':
      tsd = true; break;
    case 'hundert':
      hun = true; break;
    case 'null':
      num = 0; break;
    case 'eine':
    case 'eins':
      num = 1; break;
    case 'zwo':
    case 'zwei':
      num = 2; break;
    case 'drei':
      num = 3; break;
    case 'vier':
      num = 4; break;
    case 'fünf':
      num = 5; break;
    case 'sechs':
      num = 6; break;
    case 'sieben':
      num = 7; break;
    case 'acht':
      num = 8; break;
    case 'neun':
      num = 9; break;
    case 'zehn':
      num = 10; break;
    case 'elf':
      num = 11; break;
    case 'zwölf':
      num = 12; break;
    case 'dreizehn':
      num = 13; break;
    case 'vierzehn':
      num = 14; break;
    case 'fünfzehn':
      num = 15; break;
    case 'sechszehn':
      num = 16; break;
    case 'siebzehn':
      num = 17; break;
    case 'achtzehn':
      num = 18; break;
    case 'neunzehn':
      num = 19; break;
    case 'zwanzig':
      num = 20; break;
    case 'dreißig':
      num = 30; break;
    case 'vierzig':
      num = 40; break;
    case 'fünfzig':
      num = 50; break;
    case 'sechzig':
      num = 60; break;
    case 'siebzig':
      num = 70; break;
    case 'achtzig':
      num = 80; break;
    case 'neunzig':
      num = 90; break;
    default:
      num = -1;
  }

  //hundert als erstes Wort erkennen
  if(firstWord && arrWords[i] != 'null' && num == 0) { result = 1; firstWord = false; }

  //hunderter Block extrahieren
  if(hun) { result *= 100; hun = false; containsNumber = true; }
  else if(num > -1) { result += num; firstWord = false; containsNumber = true; }

  //Exponenten vom hunderter Block ermitteln
  if(tsd) { numTsd = result * 1000 ; result = 0; tsd = false; }
  else if (mio) { numMio = result * 1000000; result = 0; mio = false; }
  else if (mrd) { numMrd = result * 1000000000; result = 0; mrd = false; }
}

if(!containsNumber) return -1;
return numMrd + numMio + numTsd + result;
