/* global app, Card */
/* exported Hand */

var Hand = {
  createHand: function(cards, computer) {
    var result = {
      cards: cards,
      isComputer: computer,
      isPretend: false // When testing for valid melds, we create some pretend hands
    };

    return result;
  },

  getScore: function(hand) {
    var score = 0;
    for (var cardIndex in hand.cards) {
      if (hand.cards[cardIndex].numericRank > 9) {
        score += 10;
      }
      else {
        score += hand.cards[cardIndex].numericRank;
      }
    }

    return score;
  },

  order: function(hand) {
    // order by rank
    if (Array.isArray(hand.cards)) {
      hand.cards.sort(function(a, b) {
        if (a.numericRank > b.numericRank) {
          return 1;
        }
        else if (a.numericRank === b.numericRank) {
          return a.suit < b.suit;
        }
        else {
          return -1;
        }
      });
    }
  },

  layout: function(hand) {
    var isOdd = (hand.cards.length & 1) === 1;
    var ANGLE_BETWEEN_CARDS = 3;
    var cardsOnEachSide;
    var xValue;
    var yValue;
    var angle;
    var curZindex = 10;

    if (isOdd) {
      cardsOnEachSide = (hand.cards.length - 1) / 2;

      if (hand.isComputer) {
        angle = ANGLE_BETWEEN_CARDS * cardsOnEachSide;
      }
      else {
        angle = -ANGLE_BETWEEN_CARDS * cardsOnEachSide;
      }
    }
    else {
      cardsOnEachSide = (hand.cards.length) / 2;

      if (hand.isComputer) {
        angle = ANGLE_BETWEEN_CARDS * cardsOnEachSide - (ANGLE_BETWEEN_CARDS / 2);
      }
      else {
        angle = -ANGLE_BETWEEN_CARDS * cardsOnEachSide + (ANGLE_BETWEEN_CARDS / 2);
      }
    }

    xValue = (app.screenWidth * app.handsCenteredOn)  - (app.cardWidth / 2); // Find starting point

    if (hand.isComputer) {
      yValue = app.opponentY;
    }
    else {
      yValue = app.playerY;
    }

    for (var i = 0; i < hand.cards.length; i++) {
      Card.updateLayout(hand.cards[i], xValue, yValue, angle);

      if (hand.isComputer) {
        angle -= ANGLE_BETWEEN_CARDS;
        Card.hide(hand.cards[i]);
        Card.setComputerHand(hand.cards[i]);
      }
      else {
        angle += ANGLE_BETWEEN_CARDS;
        Card.show(hand.cards[i]);
        Card.setPlayerHand(hand.cards[i]);
      }

      Card.setZ(hand.cards[i], curZindex++);
    }
  },

  layDownMelds: function(hand) {
    var setLayedDown = Hand.layDownSets(hand);
    var runLayedDown = Hand.layDownRuns(hand);
    var additions = false;
    while (Hand.layDownAdditions(hand)) {
      additions = true;
    }

    return setLayedDown || runLayedDown || additions;
  },

  layDownAdditions: function(hand) {
    var result = false;

    var isSetMeld = function(meld) {
      return meld[0].numericRank === meld[1].numericRank;
    };

    for (var cardIndex = 0; cardIndex < hand.cards.length; cardIndex++) {
      for (var meldIndex in app.game.melds) {
        var card = hand.cards[cardIndex];
        var meld = app.game.melds[meldIndex];
        var removed = false;

        if (isSetMeld(meld)) {
          if (card.numericRank === meld[0].numericRank) {
            removed = true;
            if (!hand.isPretend) {
              meld.push(card);
            }
          }
        }
        else {
          if (meld[0].suit === card.suit) {
            if (meld[0].numericRank - 1 === card.numericRank) {
              removed = true;
              meld.unshift(card);
            }
            else if (meld[meld.length - 1].numericRank + 1 === card.numericRank) {
              removed = true;
              if (!hand.isPretend) {
                meld.push(card);
              }
            }
          }
        }

        if (removed) {
          hand.cards.splice(cardIndex, 1);
          cardIndex--;
          result = true;
          break;
        }
      }
    }

    return result;
  },

  getSetLength: function(hand, startIndex) {
    var length = 1;
    var currentIndex = startIndex + 1;
    while (currentIndex < hand.cards.length && hand.cards[currentIndex].rank === hand.cards[startIndex].rank) {
      length++;
      currentIndex++;
    }

    return length;
  },

  indexOf: function(hand, suit, numericRank) {
    for (var i = 0; i < hand.cards.length; i++) {
      if (hand.cards[i].suit === suit && hand.cards[i].numericRank === numericRank) {
        return i;
      }
    }

    return -1;
  },

  cardIsPartOfRun: function(hand, index) {
    var result = [];

    var offset = 1;
    var theCard = hand.cards[index];

    var place = index;

    do {
      result.push(place);
      place = Hand.indexOf(hand, theCard.suit, theCard.numericRank + offset);
      offset++;
    } while (place >= 0);

    return result;
  },

  getPotentialRuns: function(hand, index) {
    var result = [index];
    var theCard = hand.cards[index];

    var downward = Hand.indexOf(hand, theCard.suit, theCard.numericRank - 1);
    var upward = Hand.indexOf(hand, theCard.suit, theCard.numericRank + 1);
    if (downward >= 0) {
      result.unshift(downward);
    }
    if (upward >= 0) {
      result.push(upward);
    }

    return result;
  },

  getPotentialSets: function(hand, index) {
    var result = [];
    var theCard = hand.cards[index];

    for (var i = 0; i < hand.cards.length; i++) {
      if (hand.cards[i].numericRank === theCard.numericRank) {
        result.push(i);
      }
    }

    return result;
  },

  getPotentialNonContRuns: function(hand, index) {
    var result = [index];
    var theCard = hand.cards[index];

    var downward = Hand.indexOf(hand, theCard.suit, theCard.numericRank - 2);
    var upward = Hand.indexOf(hand, theCard.suit, theCard.numericRank + 2);
    if (downward >= 0) {
      result.unshift(downward);
    }
    if (upward >= 0) {
      result.push(upward);
    }

    return result;
  },

  layDownSets: function(hand) {
    var result = false;

    // look at each card
    for (var i = 0; i < hand.cards.length; i++) {
      var length = Hand.getSetLength(hand, i);
      if (length > 2) {
        var removed = hand.cards.splice(i, length);
        Hand.layDownMeld(hand, removed);
        result = true;
      }
    }

    return result;
  },

  layDownRuns: function(hand) {
    var result = false;

    // look at each card
    for (var i = 0; i < hand.cards.length; i++) {
      var run = Hand.cardIsPartOfRun(hand, i);

      if (run.length > 2) {
        var removed = [];
        for (var runCardIndex = run.length - 1; runCardIndex >= 0; runCardIndex--) {
          var card = hand.cards.splice(run[runCardIndex], 1)[0];
          removed.unshift(card);
        }
        Hand.layDownMeld(hand, removed);
        result = true;
      }
    }

    return result;
  },

  layDownMeld: function(hand, cardsToLayDown) {
    if (!hand.isPretend) {
      app.game.melds.push(cardsToLayDown);
    }
  },

  addCard: function(hand, card) {
    hand.cards.push(card);
    Hand.order(hand);
  },

  hasThisNumberCard: function(hand, card) {
    return Hand.indexOf(hand, 'heart', card.numericRank) >= 0 ||
      Hand.indexOf(hand, 'diamond', card.numericRank) >= 0 ||
      Hand.indexOf(hand, 'club', card.numericRank) >= 0 ||
      Hand.indexOf(hand, 'spade', card.numericRank) >= 0;
  },

  hasCardNearThis: function(hand, card) {
    return Hand.indexOf(hand, card.suit, card.numericRank - 1) >= 0 ||
      Hand.indexOf(hand, card.suit, card.numericRank + 1) >= 0;
  },

  wouldResultInMeld: function(hand, card) {
    // Make new fake hand with the card added
    var fakeHand = Hand.createHand(hand.cards.concat([card]));
    fakeHand.isPretend = true;
    Hand.order(fakeHand);
    var result = Hand.layDownMelds(fakeHand);
    fakeHand = null;
    return result;
  },

  getWorth: function(hand, index) {
    var lookingFor = [];
    var worth = 0;
    var candidates = 0;
    var theCard = hand.cards[index];

    var updateCandidateBasedOnUsed = function(candidates, cardsLookingFor) {
      var newCandidates = candidates;
      var lookingIndex;
      var discardCard, meldCard;

      // Look for unavailable cards of same numericRank
      for (var discardIndex in app.game.discards) {
        discardCard = app.game.discards[discardIndex];
        for (lookingIndex in cardsLookingFor) {
          if (
            discardCard.numericRank === cardsLookingFor[lookingIndex].numericRank &&
            discardCard.suit === cardsLookingFor[lookingIndex].suit
          ) {
            newCandidates--;
          }
        }
      }

      // Look for unavailable cards of same numericRank
      for (var meldIndex in app.game.melds) {
        for (var cardIndex in app.game.melds[meldIndex]) {
          meldCard = app.game.melds[meldIndex][cardIndex];
          for (lookingIndex in cardsLookingFor) {
            if (
              meldCard.numericRank === cardsLookingFor[lookingIndex].numericRank &&
              meldCard.suit === cardsLookingFor[lookingIndex].suit
            ) {
              newCandidates--;
            }
          }
        }
      }

      return newCandidates;
    };

    var setCards = Hand.getPotentialSets(hand, index);
    var runCards = Hand.getPotentialRuns(hand, index);
    var ncRunCards = Hand.getPotentialNonContRuns(hand, index);

    if (setCards.length > 1) {
      candidates += 2;

      // Look for unavailable cards of same numericRank
      lookingFor.concat([
        {suit: 'heart', numericRank: theCard.numericRank},
        {suit: 'diamond', numericRank: theCard.numericRank},
        {suit: 'spade', numericRank: theCard.numericRank},
        {suit: 'club', numericRank: theCard.numericRank}
      ]);
    }
    if (runCards.length > 1) {
      candidates += 2;

      // Look for unavailable cards at either end of run
      lookingFor.concat([
        {
          suit: hand.cards[runCards[0]].suit,
          numericRank: hand.cards[runCards[0]].numericRank - 1
        },
        {
          suit: hand.cards[runCards[0]].suit,
          numericRank: hand.cards[runCards[runCards.length - 1]].numericRank + 1
        }
      ]);
    }
    if (ncRunCards.length > 1) {
      candidates += 1;
      lookingFor.concat([
        {
          suit: hand.cards[ncRunCards[0]].suit,
          numericRank: hand.cards[ncRunCards[0]].numericRank + 1
        }
      ]);
    }
    candidates = updateCandidateBasedOnUsed(candidates, lookingFor);
    worth = candidates / 52;

    return worth;
  },

  chooseDiscard: function(hand) {
    var lowestWorth = Number.MAX_VALUE;
    var leastValueableIndex = hand.cards.length - 1;
    for (var cardIndex = hand.cards.length - 1; cardIndex >= 0; cardIndex--) {
      var thisWorth = Hand.getWorth(hand, cardIndex);

      // short circuit on first card with a worth of 0
      if (thisWorth === 0) {
        return hand.cards[cardIndex];
      }

      // Otherwise see if there has been a card worth less
      if (thisWorth < lowestWorth) {
        lowestWorth = thisWorth;
        leastValueableIndex = cardIndex;
      }
    }

    return hand.cards[leastValueableIndex];
  },

  empty: function(hand) {
    hand.cards = [];
  },

  show: function(hand) {
    for (var cardIndex in hand.cards) {
      Card.show(hand.cards[cardIndex]);
    }
  }
};