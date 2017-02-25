$( document ).ready(function(){
/********************************************KEY VARIABLES**************************************************/
    var boardInDOM = document.getElementById("board");
    var gameStatus = document.getElementById("game-notifications");

/********************************************BOARD STATE**************************************************/
    var Board = function() {
        this.cols = 7;
        this.rows = 6;
        this.state = [];
        this.available_cells = {};
        this.pieces_played = {};
        
        this.current_player = "red";
        this.game_over = false;
    };

/********************************************BOARD METHODS**************************************************/

    Board.prototype.cellToRowCol = function(id) {
        var row = Math.floor(id/this.cols);
        var col = id % this.cols;
        return { row: row, col: col }
    }
    
    Board.prototype.update = function(boardColumnSelected) {
        var idOfCellContainingPlacedPiece = this.available_cells[boardColumnSelected]; 
        //update state
        var rowOfPlacedPiece = this.cellToRowCol(idOfCellContainingPlacedPiece).row;
        var colOfPlacedPiece = this.cellToRowCol(idOfCellContainingPlacedPiece).col;
        this.state[rowOfPlacedPiece][colOfPlacedPiece] = this.current_player;

        //update pieces_played
        this.pieces_played[this.current_player]++;

        //update available_cells
        if(idOfCellContainingPlacedPiece && idOfCellContainingPlacedPiece - this.cols >= 0) {
            this.available_cells[boardColumnSelected] = idOfCellContainingPlacedPiece - this.cols;
        }
        else {
            this.available_cells[boardColumnSelected] = null;
        }
    }

    Board.prototype.handleUserPlay = function(selectedCell, selectedCol) {        
        //id location of cell on which piece will be dropped
        var selectedRow = this.cellToRowCol(this.available_cells[selectedCol]).row;
        var selectedCol = this.cellToRowCol(this.available_cells[selectedCol]).col;

        //drop piece and update board
        dropPlayerPiece(this, selectedCell, selectedCol);
        
        //if there is a winner, game over, return
        if(this.hasWinner(selectedRow, selectedCol, this.current_player)) {
            //update game status and return
            return this.gameOver("Game over. You win!");
        } 

        //check if there is a stalemate, game over, return
        if(this.hasStalemate()) {
            //update game status and return;
            return this.gameOver("Game over. Stalemate!");
        }

        //otherwise let computer play
        else {
            //switch player
            this.current_player = "black";
            //change display message
            displayStateOfGame("It's the computer's turn");
            //play as computer
            this.handleComputerPlay();
        }   
    }

    Board.prototype.handleComputerPlay = function() {
        //select random id for computer to place piece
        var board = this;

        var availableCells = Object.keys(this.available_cells).
            filter(function(key){
                return board.available_cells[key] !== null;
            }).
            map(function(key){
                return board.available_cells[key];
            })

        var randomIndex = Math.floor(Math.random() * availableCells.length);
        var randomCellId = availableCells[randomIndex];
        var randomCellRow = this.cellToRowCol(randomCellId).row;
        var randomCellCol = this.cellToRowCol(randomCellId).col;

        //place computer piece on a delay
        var computerPiece = createPiece("black", board)
        var cellSelectedByComputer = document.getElementById(randomCellId);
        
        setTimeout(function() {
            //append computer's piece to the board
            cellSelectedByComputer.append(computerPiece);
            
            //update board
            board.update(randomCellCol);

            //if winner, game over, return
            if(board.hasWinner(randomCellRow, randomCellCol, board.current_player)) {
                return board.gameOver("Game over. Computer wins.");
            }

            //if stalemate, game over, return
            else if(board.hasStalemate()) {
                //update game status and return;
                return board.gameOver("Game over. Stalemate!");
            }

            //else let player play
            else {

                //switch player
                board.current_player = "red";
                //change display message
                displayStateOfGame("It's your turn");
                //append new piece for player;
                var newPlayerPiece = createPiece("red", board);
                var headerCell = document.getElementById("header-cell-0")
                headerCell.appendChild(newPlayerPiece);
            } 
        }, 2500);
    }

    Board.prototype.hasWinner = function(startRow, startCol, currPlayer) {
        if(this.hasDiagonalWinner(startRow, startCol, currPlayer) || 
           this.hasHorizontalWinner(startRow, startCol, currPlayer) || 
           this.hasVerticalWinner(startRow, startCol, currPlayer)) {
            return true;
        } else {
            return false;
        }
    }

    Board.prototype.hasDiagonalWinner = function(startRow, startCol, currPlayer) {
        if(this.checkDirection(currPlayer, startRow, startCol, -1, 1, 1, -1) ||
           this.checkDirection(currPlayer, startRow, startCol, -1, -1, 1, 1)
        ) {
            return true
        }

        return false;
    }

    Board.prototype.hasHorizontalWinner = function(startRow, startCol, currPlayer) {
        if(this.checkDirection(currPlayer, startRow, startCol, 0, 1, 0, -1)) {
            return true;
        }

        return false;
    }

    Board.prototype.hasVerticalWinner = function(startRow, startCol, currPlayer) {
        if(this.checkDirection(currPlayer, startRow, startCol, -1, 0, 1, 0)) {
            return true;
        }

        return false;
    }

    Board.prototype.checkDirection = function(currPlayer, startRow, startCol, rowDir, colDir, rowDirRev, colDirRev) {
        var count = 0; 
        var prevRow = null;
        var prevCol = null;
        var currRow = startRow; 
        var currCol = startCol;

        //move pointer as far as you can in one direction
        while(this.isValid(currRow, currCol, this.cols, this.rows) &&
              this.state[currRow][currCol] !== null && 
              this.state[currRow][currCol] === currPlayer) {
     
            prevRow = currRow;
            prevCol = currCol;
            currRow = currRow + rowDir;
            currCol = currCol + colDir;
        }

        currRow = prevRow;
        currCol = prevCol;

        //back track and count
        while(this.isValid(currRow, currCol, this.cols, this.rows) &&
              this.state[currRow][currCol] !== null && 
              this.state[currRow][currCol] === currPlayer) {

            count++;
            
            if(count === 4) return true; 
    
            currRow = currRow + rowDirRev;
            currCol = currCol + colDirRev;
        }

        return false;
    }

    Board.prototype.isValid = function(row, col, maxCol, maxRow) {
        if(row < 0 || row >= maxRow || col >= maxCol || col < 0) {
            return false;
        }

        return true;
    }

    Board.prototype.hasStalemate = function() {
        for(var colId in this.available_cells) {
            if(this.available_cells[colId] !== null) {
                return false;
            }
        }

        return true;
    }

    Board.prototype.gameOver = function(message) {
        this.game_over = true;
        displayStateOfGame(message);
    }

/********************************************HELPER FUNCTIONS************************************************/
    //display state of game
    function displayStateOfGame(message) {
        gameStatus.innerHTML = message;  
    };

    //populate header row
    function populateHeader(board) {
        var currHeaderRow = document.getElementById("board-header-row");
        currHeaderRow.innerHTML = "";

        for(var id = 0; id < board.cols; id++) {
            var headerCell = document.createElement("td");
            headerCell.setAttribute("id", "header-cell-" + id)
            headerCell.setAttribute("class", "board-column-" + id + " " + "header-cell");
            headerCell.addEventListener("dragover", function(event) { allowDrop(event); });
            headerCell.addEventListener("drop", function(event) { drop(event, board); } );
            currHeaderRow.appendChild(headerCell);
        }
    }

    //set initial position of player piece
    function setPlayerPieceInInitialPosition(board) {
        var startCellOfPlayerPiece = document.getElementById("header-cell-0")
        var playerPiece = createPiece("red", board);
        startCellOfPlayerPiece.append(playerPiece);
    }

    //create player/computer piece
    function createPiece(playerColor, board) {
        var piece = document.createElement("img");
        var pieceId = parseInt(board.pieces_played[playerColor]) + 1;
        piece.setAttribute("src", "./images/" + playerColor + ".png");
        piece.setAttribute("class", "board-piece");

        //build up piece for player
        if(playerColor === "red") {
            piece.setAttribute("id", "player-piece-" + pieceId);
            piece.addEventListener("dragstart", function(event){ drag(event); });
        } 
        //build up piece for computer
        else {
            piece.setAttribute("id", "computer-piece-" + pieceId);
        }

        return piece;
    }

    //init board
    function initBoard() {
        //init new board
        var board = new Board();

        //set pieces piecesPlayed
        board.pieces_played["red"] = 0;
        board.pieces_played["black"] = 0;

        //track num of cells on board
        var currentCellId = 0;

        //build board in dom and set its initial state
        //invisibile header row
        var headerRow = document.createElement("tr");
        headerRow.setAttribute("id", "board-header-row");
        boardInDOM.appendChild(headerRow);
        populateHeader(board);
        setPlayerPieceInInitialPosition(board);

        //actual visible board
        for (var j = 0; j < board.rows; j++) {
            var newRow = [];
            var newRowInDOM = document.createElement("tr");

            //add cells to each row
            for (var k = 0; k < board.cols; k++) {
                //on state
                newRow[k] = null;

                //on dom
                var newCell = document.createElement("td");
                newCell.setAttribute("class", "board-cell");
                newCell.setAttribute("class", "board-column-" + k);
                newCell.setAttribute("id", currentCellId);
                newRowInDOM.appendChild(newCell);

                //set initial available_cells
                if(j === board.rows - 1) {
                    board.available_cells[k] = currentCellId;
                }

                //increment currentCellId
                currentCellId++;
            }
            //on state
            board.state.push(newRow);
            //on dom
            boardInDOM.append(newRowInDOM);
        }

        //set currPlayer
        board.current_player = "red";

        //set game status
        board.game_over = false;

        //return board;
        return board;
    }

    function initGame() {
        initBoard();
        displayStateOfGame("Welcome to connect four! To play, use the mouse to drag your piece over the column where you would like to play and then    release");
    }

    function resetBoard() {
        window.location.reload();
    }

/********************************************UI EVENTS**************************************************/

    function allowDrop(ev) {
        ev.preventDefault();
    }

    function drag(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
    }

    function drop(ev, board) {
        ev.preventDefault();
        //header cell data
        var data = ev.dataTransfer.getData("text");
        var headerCellSelected = ev.target;
        var idOfSelectedHeaderCell = ev.target.id;
        var headerCellColClass = ev.target.className.split(" ")[0];
        var colIndexPosition = headerCellColClass.lastIndexOf("-") + 1;
        var boardColumnSelected = parseInt(headerCellColClass.slice(colIndexPosition));

        //if no available cells in selected column, then return
        if(!board.available_cells[boardColumnSelected]) {
            return;
        }

        //otherwise...append piece to selected cell in header and handle user play
        var playerPiece = document.getElementById(data);
        playerPiece.setAttribute("draggable", false);
        headerCellSelected.appendChild(playerPiece);

        board.handleUserPlay(idOfSelectedHeaderCell, boardColumnSelected);
    }

    function dropPlayerPiece(board, idOfSelectedHeaderCell, boardColumnSelected) {
        //...and then drop to appropriate spot in board
        var $old = $("#" + idOfSelectedHeaderCell);
        var oldOffset = $old.offset();
        
        var idOfNewCell = board.available_cells[boardColumnSelected];
        var $new = $old.clone().appendTo("#" + idOfNewCell);
        var newOffset = $new.offset();

        var $temp = $old.clone().appendTo('body');

        $temp
            .css('position', 'absolute')
            .css('left', oldOffset.left)
            .css('top', oldOffset.top)
            .css('zIndex', -5000);
        
        $new.hide();
        $old.hide();

        //animate the $temp to the position of the new img
        $temp.animate( {'top': newOffset.top, 'left':newOffset.left }, 1200, function(){
            //callback function, we remove $old and $temp and show $new
            $new.show();
            $old.remove();
            $temp.remove();
        });

        populateHeader(board);
        board.update(boardColumnSelected);
    }

    //reset board
    $("#reset-button").click(resetBoard);

/********************************************INIT GAME**************************************************/

initGame();

});