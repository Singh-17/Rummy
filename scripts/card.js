/* global Modernizr, app, domMap, Deck */
/* exported Card */

var Card = {
  equals: function(card1, card2) {
    return card1.rank === card2.rank && card1.suit === card2.suit;
  },

  findNumericRank: function(card) {
    switch (card.rank) {
      case 'A':
        return 1;
      case 'J':
        return 11;
      case 'Q':
        return 12;
      case 'K':
        return 13;
      default:
        return parseInt(card.rank);
    }
  },

  updateLayout: function(card, x, y, rotation, scale) {
    if (x !== card.x || y !== card.y || rotation !== card.rotation || scale !== card.scale) {
      card.x = x;
      card.y = y;
      card.rotation = rotation;
      card.scale = scale;

      var transformDefinition = 'translateX(' + x + 'px) translateY(' + y + 'px) translateZ(1px)';
      if (rotation !== undefined && rotation !== 0) {
        transformDefinition += ' rotateZ(' + rotation + 'deg)';
      }
      if (scale !== undefined && scale !== 1) {
        transformDefinition += ' scale(' + scale + ')';
      }
      domMap[card.rank + '_' + card.suit].style[Modernizr.prefixed('transform')] = transformDefinition;
    }
  },

  setZ: function(card, z) {
    if (z !== card.z) {
      card.z = z;
      domMap[card.rank + '_' + card.suit].style[Modernizr.prefixed('zIndex')] = z;
    }
  },

  show: function(card) {
    Card.removeCustomClass(card, 'hidden');
  },

  hide: function(card) {
    Card.addCustomClass(card, 'hidden');
  },

  setPlayerHand: function(card) {
    Card.addCustomClass(card, 'playerHand');
    Card.removeCustomClass(card, 'computerHand');
  },

  setComputerHand: function(card) {
    Card.addCustomClass(card, 'computerHand');
    Card.removeCustomClass(card, 'playerHand');
  },

  click: function(card) {
    domMap[card.rank + '_' + card.suit].click();
  },

  addCustomClass: function(card, theClass) {
    domMap[card.rank + '_' + card.suit].classList.add(theClass);
  },

  removeCustomClass: function(card, theClass) {
    domMap[card.rank + '_' + card.suit].classList.remove(theClass);
  },

  addClickListener: function(card) {
    domMap[card.rank + '_' + card.suit].addEventListener('click', function() {
      var cardClickedEvent = document.createEvent('UIEvents');
      cardClickedEvent.initEvent('cardClicked', true, true);
      var suit, rank;
      var classArray = this.className.split(' ');
      for (var i = 0; i < classArray.length; i++) {
        if (
          classArray[i] === 'heart' ||
          classArray[i] === 'club' ||
          classArray[i] === 'diamond' ||
          classArray[i] === 'spade'
        ) {
          suit = classArray[i];
        } else if (classArray[i].charAt(0) === '_') {
          rank = classArray[i].substr(1);
        }
      }
      cardClickedEvent.card = Deck.getCard(app.game.deck, suit, rank);
      document.dispatchEvent(cardClickedEvent);
    });
  },

  createCard: function(newSuit, newValue) {
    var result = {
      rank: newValue,
      suit: newSuit,
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      z: 1,
      numericRank: 0
    };

    result.numericRank = Card.findNumericRank(result);

    Card.addClickListener(result);
    Card.hide(result);
    Card.removeCustomClass(result, 'meld');

    return result;
  },

  cleanCardsCache: function(cards) {
    for (var i = 0; i < cards.length; i++) {
      cards[i].x = 0;
      cards[i].y = 0;
      cards[i].z = 0;
      cards[i].scale = 0;
      cards[i].rotation = 0;
    }
  }
};