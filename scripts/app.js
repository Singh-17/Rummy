/* global Card, Game, states, Player, FastClick, Modernizr, domMap */
 
var app = {
  computerGoesFirst: false,
  game: Game.createGame(),
  handsCenteredOn: 0.5,
  cardWidth: 142,
  cardHeight: 199,
  screenWidth: null,
  screenHeight: null,
  stockY: null,
  playerY: null,
  opponentY: null,
  opponentScore: null,
  animationTime: 600,
  stockHintX: null,
  stockHintY: null,
  discardHintX: null,
  discardHintY: null,
  players: [
    Player.createPlayer(false),
    Player.createPlayer(true)
  ],
  orientationWarningShowing: false
};

var App = {
  warnAboutOldBrowser: function() {
    // Check for necessities
    if (!Modernizr.backgroundsize || !Modernizr.csstransforms || !Modernizr.csstransforms3d) {
      window.alert('You will need a newer browser to play this game.  Try Chrome of Firefox.');
    }

    // Check for optional
    if (!Modernizr.csstransitions || !Modernizr.fontface || !Modernizr.generatedcontent || !Modernizr.localstorage) {
      window.alert('Because you have an older browser, the game may not work as intended.  Try Chrome or Firefox.');
    }
  },
  showOrientationWarning: function() {
    document.querySelectorAll('.orientationWarning')[0].style.display = 'block';
    document.querySelectorAll('.orientationWarning')[0].style['z-index'] = '20000';
    app.orientationWarningShowing = true;
  },
  hideOrientationWarning: function() {
    document.querySelectorAll('.orientationWarning')[0].style.display = 'none';
    app.orientationWarningShowing = false;
  },
  restartGame: function() {
    App.hideWinnerModal();
    Player.startFresh(app.players[0], false);
    Player.startFresh(app.players[1], true);
    app.game = Game.createGame();
    Game.deal(app.game);
    App.updateScoreDOM();
  },
  updateLayoutVariables: function() {
    app.screenWidth = window.innerWidth;
    app.screenHeight = document.documentElement.clientHeight;

    if (app.screenHeight > app.screenWidth && !app.orientationWarningShowing) {
      App.showOrientationWarning();
    }
    else if (app.orientationWarningShowing) {
      App.hideOrientationWarning();
    }

    // Set PlayerY
    app.playerY = app.screenHeight - app.cardHeight - 35;

    // Set OpponentY
    if (app.screenHeight < 506) {
      app.opponentY = -175;
    }
    else if (app.screenHeight >= 506 && app.screenHeight < 578) {
      app.opponentY = -150;
    }
    else {
      app.opponentY = -100;
    }

    // Opponent Score
    domMap.computerScore.style.top = (app.opponentY + app.cardHeight + 10) + 'px';
    
    // Set StockY
    if (app.screenHeight < 506) {
      app.stockY = 50;
    }
    else if (app.screenHeight >= 506 && app.screenHeight < 578) {
      app.stockY = 85;
    }
    else if (app.screenHeight >= 578 && app.screenHeight < 625) {
      app.stockY = 135;
    }
    else if (app.screenHeight >= 625 && app.screenHeight < 680) {
      app.stockY = 170;
    }
    else if (app.screenHeight >= 680 && app.screenHeight < 750) {
      app.stockY = 210;
    }
    else {
      app.stockY = 250;
    }

    window.scroll(0, 500);
  },
  removePreload: function() {
    var elements = document.querySelectorAll('.preload');
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.remove('preload');
    }
  },
  init: function() {
    // Check to make sure browser meets requirements.
    App.warnAboutOldBrowser();

    // The preload class will prevent css transitions while the page is being loaded
    // Once the page is loaded we need to remove it to re-enable the transitions
    App.removePreload();

    // When the browser resizes we need to update our layout
    window.addEventListener('resize:end', function() {
      App.updateLayoutVariables();
      Game.layout(app.game);
    }, false);

    document.querySelectorAll('.arrow.stock')[0].addEventListener('click', function() {
      if (app.game.stock.length > 0) {
        Card.click(app.game.stock[app.game.stock.length - 1]);
      }
    });

    document.querySelectorAll('.arrow.discard')[0].addEventListener('click', function() {
      if (app.game.discards.length > 0) {
        Card.click(app.game.discards[app.game.discards.length - 1]);
      }
    });

    document.addEventListener('cardClicked', function(e) {
      // Nothing should happend unless it is the players turn
      if (!app.game.computerTurn) {
        // Depending on what we are waiting for, react appropriately
        switch (app.game.state) {
          case states.DRAW:
            Player.draw(app.players[0], e.card);
            break;
          case states.DISCARD:
            Player.discard(app.players[0], e.card);
            Game.layout(app.game);
            break;
        }
      }
    });

    var continueButton = document.querySelectorAll('#continueModal > .button')[0];
    continueButton.addEventListener('click', function() {
      App.hideContinueModal();
      Game.nextHand(app.game);
    });

    var playAgainButton = document.querySelectorAll('#winnerModal > .button')[0];
    playAgainButton.addEventListener('click', function() {
      App.restartGame();
    });

    var restartButton = document.querySelectorAll('#restartButton')[0];
    restartButton.addEventListener('click', function() {
      App.restartGame();
    });

    var helpButton = document.querySelectorAll('#helpButton')[0];
    helpButton.addEventListener('click', function() {
      App.showInstructionModal();
    });

    var doneWithInstructionsButton = document.querySelectorAll('#instructionModal > .button')[0];
    doneWithInstructionsButton.addEventListener('click', function() {
      App.hideInstructionModal();
    });

    // Set up fastclick for mobile devices
    window.addEventListener('load', function() {
      FastClick.attach(document.body);
      document.ontouchmove = function(e){
        e.preventDefault();
      };
    }, false);

    // Load previously save state
    var resuming = App.retrieveState();

    App.updateLayoutVariables();

    if (resuming) {
      Game.layout(app.game);
      App.updateScoreDOM();
      Game.updateHintArrows(app.game);
      if (app.players[0].hand.cards.length === 0 || app.players[1].hand.cards.length === 0) {
        Game.nextHand(app.game);
      }
    }
    else {
      Game.deal(app.game);
    }
  },

  updateScoreDOM: function() {
    document.querySelectorAll('.playerScore > .scoreValue')[0].textContent = app.players[0].score;
    document.querySelectorAll('.computerScore > .scoreValue')[0].textContent = app.players[1].score;
  },

  showModal: function(id) {
    var modal = document.querySelectorAll('#' + id)[0];
    modal.style[Modernizr.prefixed('transform')] = 'translateX(-50%) translateZ(2px)';
  },

  hideModal: function(id) {
    var modal = document.querySelectorAll('#' + id)[0];
    modal.style[Modernizr.prefixed('transform')] = 'translateX(-201%) translateZ(2px)';
  },

  showInstructionModal: function() {
    // Inject the correct email address onto the page at runtime
    var emailLink = document.querySelectorAll('#emailAddress')[0];

    // Obfuscated to avoid spam
    emailLink.href = 'mailto:ce' + 'cese.rummy@gmail.com';
    emailLink.textContent = 'ceces' + 'e.rummy@gmail.com';

    App.showModal('instructionModal');
  },

  hideInstructionModal: function() {
    App.hideModal('instructionModal');
  },

  showContinueModal: function() {
    document.querySelectorAll('#continueYourScore')[0].textContent = app.players[0].score;
    document.querySelectorAll('#continueOpponentScore')[0].textContent = app.players[1].score;

    var bestScore = App.getBestScore();
    var bestScoreElement = document.querySelectorAll('#bestScore')[0];
    if (bestScore === 0) {
      bestScoreElement.classList.add('hide');
    }
    else {
      bestScoreElement.classList.remove('hide');

      var scoreValueElement = document.querySelectorAll('#bestScore #scoreValue')[0];
      scoreValueElement.textContent = bestScore;
    }

    App.showModal('continueModal');
  },

  hideContinueModal: function() {
    App.hideModal('continueModal');
  },

  showWinnerModal: function() {
    if (app.players[0].score < app.players[1].score) {
      document.querySelectorAll('#winnerModal .gameResult')[0].textContent = 'You Won!';
    }
    else if (app.players[0].score === app.players[1].score) {
      document.querySelectorAll('#winnerModal .gameResult')[0].textContent = 'It\'s a Tie!';
    }
    else {
      document.querySelectorAll('#winnerModal .gameResult')[0].textContent = 'You Lost!';
    }

    document.querySelectorAll('#winnerYourScore')[0].textContent = app.players[0].score;
    document.querySelectorAll('#winnerOpponentScore')[0].textContent = app.players[1].score;

    var bestScore = App.getBestScore();
    var scoreValueElement = document.querySelectorAll('#winnerBestScore #winnerScoreValue')[0];
    scoreValueElement.textContent = bestScore;

    App.showModal('winnerModal');
  },

  hideWinnerModal: function() {
    App.hideModal('winnerModal');
  },

  saveState: function() {
    localStorage.setItem('state', JSON.stringify(app));
  },

  retrieveState: function() {
    var state = localStorage.getItem('state');
    if (state !== null) {
      app = JSON.parse(state);

      // removed cached position values from cards
      Card.cleanCardsCache(app.game.deck.cards);
      Card.cleanCardsCache(app.players[0].hand.cards);
      Card.cleanCardsCache(app.players[1].hand.cards);
      Card.cleanCardsCache(app.game.discards);
      Card.cleanCardsCache(app.game.stock);
      for (var j = 0; j < app.game.melds.length; j++) {
        Card.cleanCardsCache(app.game.melds[j]);
      }

      app.game.stockArrowX = 0;
      app.game.stockArrowY = 0;
      app.game.discardArrowX = 0;
      app.game.discardArrowY = 0;
      app.game.computerTurn = false;

      app.handsCenteredOn = 0;

      return true;
    }
    else {
      return false;
    }
  },

  getBestScore: function() {
    var score = localStorage.getItem('bestScore');
    if (score === null) {
      score = 0;
    }

    return score;
  },
  setBestScore: function(value) {
    localStorage.setItem('bestScore', value);
  }
};

var readyStateCheckInterval = setInterval(function() {
  if (document.readyState === 'complete') {
    clearInterval(readyStateCheckInterval);
    App.init();
  }
}, 20);