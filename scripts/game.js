/* global Deck, app, Hand, states, domMap, Card, App, Player */
/* exported Game */

var Game = {
  finishHand: function() {
    // update scores
    if (app.players[0].hand.cards.length === 0) {
      app.players[1].score += Hand.getScore(app.players[1].hand);
    }
    else if (app.players[1].hand.cards.length === 0) {
      app.players[0].score += Hand.getScore(app.players[0].hand);
    }
    App.updateScoreDOM();

    // Show computers hand if any cards left
    app.opponentY += 125;
    Game.layout(app.game);
    Hand.show(app.players[1].hand);
    App.saveState();

    if (app.players[0].score >= 100 || app.players[1].score >= 100) {
      var bestScore = App.getBestScore();
      if (app.players[0].score < bestScore) {
        App.setBestScore(app.players[0].score);
      }

      App.showWinnerModal();
    }
    else {
      App.showContinueModal();
    }
  },

  nextHand: function(game) {
    app.opponentY -= 125;
    app.computerGoesFirst = !app.computerGoesFirst;

    for (var cardIndex in game.deck.cards) {
      Card.removeCustomClass(game.deck.cards[cardIndex], 'meld');
      Card.hide(game.deck.cards[cardIndex]);
    }
    game.discards = [];
    game.melds = [];
    Hand.empty(app.players[0].hand);
    Hand.empty(app.players[1].hand);
    game.stock = game.deck.cards.slice(0);

    setTimeout(function() {
      App.saveState();
      Game.deal(app.game);
    }, app.animationTime);

    Game.layout(app.game);
    Deck.shuffle(game.deck);
  },

  toggleTurn: function(game) {
    setTimeout(function() {
      game.computerTurn = !game.computerTurn;

      // check for a winner
      if (app.players[0].hand.cards.length === 0 || app.players[1].hand.cards.length === 0) {
        Game.finishHand();
      }
      else {
        // Check for empty stock
        if (game.stock.length === 0) {
          game.stock = game.discards.splice(1);
          Game.layout(game);
        }

        if (game.computerTurn) {
          Player.autoPlay(app.players[1]);
        }
        else {
          game.state = states.DRAW;
          Game.updateHintArrows(game);
        }
      }
      App.saveState();
    }, app.animationTime);
  },

  // Call this to update the display
  layout: function(game) {
    if (game.melds.length > 0) {
      if (app.handsCenteredOn !== 0.53) {
        Game.centerHandsOn(0.53);
        domMap.computerScore.classList.add('recentered');
        domMap.playerScore.classList.add('recentered');
      }
    }
    else {
      if (app.handsCenteredOn !== 0.5) {
        Game.centerHandsOn(0.5);
        domMap.computerScore.classList.remove('recentered');
        domMap.playerScore.classList.remove('recentered');
      }
    }
    Game.layoutMelds(game);
    Game.layoutStock(game);
    Game.layoutDiscards(game);
    Hand.layout(app.players[0].hand);
    Hand.layout(app.players[1].hand);
    Game.layoutHintArrows(game);
  },

  // This will change where the players hands are centered around.
  centerHandsOn: function(percent) {
    app.handsCenteredOn = percent;
  },

  deal: function(game) {
    // To begin, every card from the deck is in the stock
    game.stock = game.deck.cards.slice(0);

    // Each player gets 10 cards in their hand
    app.players[0].hand = Hand.createHand(game.stock.splice(0, 10), false);
    Hand.order(app.players[0].hand);
    app.players[1].hand = Hand.createHand(game.stock.splice(0, 10), true);
    Hand.order(app.players[1].hand);

    // Update the display according to the deal
    Game.layout(game);

    // Wait for initial layout to finish
    setTimeout(function() {
      // Put the first card into the discard pile
      app.game.discards.push(app.game.stock.pop());

      // Just render the discards
      Game.layoutDiscards(app.game);

      // Wait for the card to be moved onto the discard pile
      setTimeout(function() {
        // Turn over the card
        Card.show(app.game.discards[0]);

        App.saveState();

        // Start the game
        Game.start(app.game);
      }, app.animationTime + 50);
    }, app.animationTime + 50);
  },

  start: function(game) {
    if (app.computerGoesFirst) {
      game.computerTurn = true;
      Player.autoPlay(app.players[1]);
    }
    else {
      game.computerTurn = false;
      game.state = states.DRAW;
      Game.updateHintArrows(game);
    }
  },

  layoutStock: function(game) {
    var zIndex = 10;
    for (var stockIndex = 0; stockIndex < game.stock.length; stockIndex++) {
      Card.updateLayout(
        game.stock[stockIndex],
        (app.screenWidth * app.handsCenteredOn) - 100 - (app.cardWidth / 2),
        app.stockY,
        0
      );
      Card.setZ(app.game.stock[stockIndex], zIndex++);
      Card.hide(game.stock[stockIndex]);
    }
  },

  layoutHintArrows: function(game) {
    // Stock hint arrow
    var newX = (app.screenWidth * app.handsCenteredOn) - 95;
    var newY = app.stockY + 220;

    if (game.stockArrowX !== newX) {
      domMap.stockArrow.style.left = newX  + 'px';
      game.stockArrowX = newX;
    }

    if (game.stockArrowY !== newY) {
      domMap.stockArrow.style.top = newY + 'px';
      game.stockArrowY = newY;
    }

    // Discard hint arrow
    newX = (app.screenWidth * app.handsCenteredOn) + 90 - (app.cardWidth / 3);

    if (game.discardArrowX !== newX) {
      domMap.discardArrow.style.left = newX + 'px';
      game.discardArrowX = newX;
    }

    if (game.discardArrowY !== newY) {
      domMap.discardArrow.style.top = newY + 'px';
      game.discardArrowY = newY;
    }
  },

  updateHintArrows: function(game) {
    if (game.state === states.DRAW) {
      domMap.stockArrow.style.opacity = '1';
      domMap.discardArrow.style.opacity = '1';
      domMap.discardArrow.classList.remove('rotated');
    }
    else if (game.state === states.DISCARD) {
      domMap.stockArrow.style.opacity = '0';
      domMap.discardArrow.style.opacity = '1';
      domMap.discardArrow.classList.add('rotated');
    }
    else {
      domMap.stockArrow.style.opacity = '0';
      domMap.discardArrow.style.opacity = '0';
      domMap.discardArrow.classList.remove('rotated');
    }
  },

  layoutDiscards: function(game) {
    var zIndex = 10;
    for (var i = 0; i < game.discards.length; i++) {
      Card.updateLayout(
        app.game.discards[i],
        (app.screenWidth * app.handsCenteredOn) + 100 - (app.cardWidth / 2),
        app.stockY,
        0
      );
      Card.setZ(game.discards[i], zIndex++);
      Card.show(game.discards[i]);
    }
  },

  layoutMelds: function(game) {
    var yDistance = (app.screenHeight - 30) / game.melds.length;
    var currentMeldY = 15;
    var zIndex = 10;
    var cardScale;
    var cardOffset;
    if (game.melds.length < 4) {
      cardScale = 0.9;
      cardOffset = 10;
    }
    else if (game.melds.length < 5) {
      cardScale = 0.7;
      cardOffset = 40;
    }
    else if (game.melds.length < 6) {
      cardScale = 0.6;
      cardOffset = 53;
    }
    else {
      cardScale = 0.5;
      cardOffset = 60;
    }

    for (var meldIndex in game.melds) {
      var currentCardX = 40;
      for(var cardIndex in game.melds[meldIndex]) {
        Card.updateLayout(game.melds[meldIndex][cardIndex], currentCardX, currentMeldY, 0, cardScale);
        Card.setZ(game.melds[meldIndex][cardIndex], zIndex++);
        Card.removeCustomClass(game.melds[meldIndex][cardIndex], 'computerHand');
        Card.removeCustomClass(game.melds[meldIndex][cardIndex], 'playerHand');
        Card.addCustomClass(game.melds[meldIndex][cardIndex], 'meld');
        Card.show(game.melds[meldIndex][cardIndex]);
        currentCardX += 23;
      }

      if (yDistance > app.cardHeight - cardOffset) {
        currentMeldY += app.cardHeight - cardOffset;
      }
      else {
        currentMeldY += yDistance;
      }
    }
  },

  createGame: function() {
    var result = {
      deck: Deck.createDeck(),
      discards: [],
      stock: [],
      melds: [],
      computerTurn: false,
      state: states.DRAW,
      stockArrowX: 0,
      stockArrowY: 0,
      discardArrowX: 0,
      discardArrowY: 0
    };

    return result;
  }
};