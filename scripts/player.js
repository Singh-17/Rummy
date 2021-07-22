/* globals app, states, Card, Game, Hand, App */
/* exported Player */

var Player = {
  createPlayer: function(isComputer) {
    var result = {
      hand: null,
      isComputer: isComputer,
      score: 0
    };

    return result;
  },

  startFresh: function(player, isComputer) {
    player.hand = null;
    player.isComputer = isComputer;
    player.score = 0;
  },

  shouldChoose: function(player, cardShowing) {
    // If it will get you a meld, do it
    if (Hand.wouldResultInMeld(player.hand, cardShowing)) {
      return true;
    }
    // If you have no cards near it, don't
    else if (!Hand.hasThisNumberCard(player.hand, cardShowing) && !Hand.hasCardNearThis(player.hand, cardShowing)) {
      return false;
    }
    else {
      // Otherwise, pick randomly
      return Math.random() > 0.5;
    }
  },

  autoPlay: function(player) {
    var layedDown = Hand.layDownMelds(player.hand);
    Game.layout(app.game);

    // Check for winner
    if (player.hand.cards.length === 0) {
      app.game.state = null;
      Game.toggleTurn(app.game);
      return;
    }

    var delay = layedDown ? app.animationTime : 0;

    setTimeout(function() {
      if (Player.shouldChoose(player, app.game.discards[app.game.discards.length - 1])) {
        Player.draw(player, app.game.discards[app.game.discards.length - 1]);
      }
      else {
        Player.draw(player, app.game.stock[app.game.stock.length - 1]);
      }

      setTimeout(function() {
        if (player.hand.cards.length > 0) {
          Player.discard(player, Hand.chooseDiscard(player.hand));
        }

        Game.layout(app.game);
      }, app.animationTime);
    }, delay);
  },

  draw: function(player, card) {
    app.game.state = null;
    if (Card.equals(card, app.game.discards[app.game.discards.length - 1])) {
      Player.drawFromDiscards(player);
    }
    else if (Card.equals(card, app.game.stock[app.game.stock.length - 1])) {
      Player.drawFromStock(player);
    }
    else {
      app.game.state = states.DRAW;
      return;
    }

    Game.layout(app.game);

    setTimeout(function() {
      Hand.layDownMelds(player.hand);
      Game.layout(app.game);
      if (player.hand.cards.length === 0) {
        app.game.state = null;
        Game.toggleTurn(app.game);
      }
      else {
        app.game.state = states.DISCARD;
        App.saveState();
      }
      Game.updateHintArrows(app.game);
    }, app.animationTime);
  },

  drawFromStock: function(player) {
    if (app.game.stock.length > 0) {
      var card = app.game.stock.pop();
      Hand.addCard(player.hand, card);
    }
  },

  drawFromDiscards: function(player) {
    if (app.game.discards.length > 0) {
      var card = app.game.discards.pop();
      Hand.addCard(player.hand, card);
    }
  },

  discard: function(player, card) {
    app.game.state = null;
    var playerIndex;
    if (app.game.computerTurn) {
      playerIndex = 1;
    }
    else {
      playerIndex = 0;
    }

    var placeInHand = Hand.indexOf(player.hand, card.suit, card.numericRank);

    if (placeInHand >= 0) {
      player.hand.cards.splice(placeInHand, 1);
      app.game.discards.push(card);
      Card.show(card);
      app.game.state = null;
      Game.updateHintArrows(app.game);
      Game.toggleTurn(app.game);
    }
    else {
      app.game.state = states.DISCARD;
    }
  }
};