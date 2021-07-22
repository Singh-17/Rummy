/* global Card */
/* exported Deck */

var Deck = {
  getCard: function(deck, suit, rank) {
    for (var i = 0; i < deck.cards.length; i++) {
      if (deck.cards[i].suit === suit && deck.cards[i].rank === rank) {
        return deck.cards[i];
      }
    }
  },

  shuffle: function(deck) {
    deck.cards = Deck.shuffleArray(deck.cards);
  },

  shuffleArray: function (toShuffle) {
    // Make a copy of the array that we can pull items from
    var arrayCopy = toShuffle.slice(0);

    // Create the target array
    var newArray = new Array(arrayCopy.length);

    /* This function will attempt to place a value at the given index
       If that index is already taken it will try the next spot,
      wrapping to the beginning of the array if necessary */
    var placeAt = function(index, value) {
      if (newArray[index] === undefined) {
        newArray[index] = value;
      }
      else {
        if (index + 1 === newArray.length) {
          placeAt(0, value);
        }
        else {
          placeAt(index + 1, value);
        }
      }
    };

    // Pull a random element from the array and insert it into 
    // a random place in the new array
    for (var i = 0; i < newArray.length; i++) {
      // Choose a random element to work with
      var index = Math.floor((Math.random() * arrayCopy.length));
      placeAt(Math.floor(Math.random() * arrayCopy.length), arrayCopy[index]);

      // Remove that element from the old array
      arrayCopy.splice(index, 1);
    }

    return newArray;
  },

  createDeck: function() {
    var result = {
      cards: []
    };

    for (var suit = 0; suit <= 3; suit++) {
      var suitValue;
      switch (suit) {
        case 0:
          suitValue = 'club';
          break;
        case 1:
          suitValue = 'spade';
          break;
        case 2:
          suitValue = 'heart';
          break;
        case 3:
          suitValue = 'diamond';
          break;
      }
      result.cards.push(Card.createCard(suitValue, 'A'));
      result.cards.push(Card.createCard(suitValue, '2'));
      result.cards.push(Card.createCard(suitValue, '3'));
      result.cards.push(Card.createCard(suitValue, '4'));
      result.cards.push(Card.createCard(suitValue, '5'));
      result.cards.push(Card.createCard(suitValue, '6'));
      result.cards.push(Card.createCard(suitValue, '7'));
      result.cards.push(Card.createCard(suitValue, '8'));
      result.cards.push(Card.createCard(suitValue, '9'));
      result.cards.push(Card.createCard(suitValue, '10'));
      result.cards.push(Card.createCard(suitValue, 'J'));
      result.cards.push(Card.createCard(suitValue, 'Q'));
      result.cards.push(Card.createCard(suitValue, 'K'));
    }

    Deck.shuffle(result);

    return result;
  }
};
