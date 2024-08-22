// Initialize game variables
let currentPlayer = 1;
let player1Ships = {};
let player2Ships = {};
let player1Hits = 0;
let player2Hits = 0;
const boardSize = 10;
const shipSizes = [5, 4, 3, 3, 2]; // Carrier, Battleship, Cruiser, Submarine, Destroyer

let placingShips = false;
let currentShipIndex = 0;
let currentShipOrientation = 'horizontal';
let gameOver = false;
let isSinglePlayer = true;
let setupPlayer = 1;
let gameStarted = false;

// AI variables
let lastHit = null;
let hitStack = [];
const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
let currentDirection = 0;

// Create the game boards
function createGameBoards() {
    const player1Board = document.getElementById('player1Board');
    const player2Board = document.getElementById('player2Board');
    
    player1Board.innerHTML = '';
    player2Board.innerHTML = '';
    
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell1 = document.createElement('div');
        cell1.className = 'cell';
        cell1.id = `p1-${i}`;
        player1Board.appendChild(cell1);

        const cell2 = document.createElement('div');
        cell2.className = 'cell';
        cell2.id = `p2-${i}`;
        player2Board.appendChild(cell2);
    }
}

// Place ships randomly for computer
function placeShipsRandomly(player) {
    const ships = {};
    for (let i = 0; i < shipSizes.length; i++) {
        const size = shipSizes[i];
        let placed = false;
        while (!placed) {
            const isHorizontal = Math.random() < 0.5;
            const startRow = Math.floor(Math.random() * boardSize);
            const startCol = Math.floor(Math.random() * boardSize);
            
            if (canPlaceShip(Object.values(ships).flat(), startRow, startCol, size, isHorizontal)) {
                const newShip = placeShip(startRow, startCol, size, isHorizontal);
                ships[getShipName(size, i)] = newShip;
                placed = true;
            }
        }
    }
    return ships;
}

function canPlaceShip(existingShips, row, col, size, isHorizontal) {
    for (let i = 0; i < size; i++) {
        let checkRow = row;
        let checkCol = col;
        if (isHorizontal) {
            checkCol = col + i;
        } else {
            checkRow = row + i;
        }
        if (checkRow >= boardSize || checkCol >= boardSize || existingShips.includes(checkRow * boardSize + checkCol)) {
            return false;
        }
    }
    return true;
}

function placeShip(row, col, size, isHorizontal) {
    const shipPositions = [];
    for (let i = 0; i < size; i++) {
        if (isHorizontal) {
            shipPositions.push(row * boardSize + (col + i));
        } else {
            shipPositions.push((row + i) * boardSize + col);
        }
    }
    return shipPositions;
}

// Handle cell click event
function handleCellClick(event) {
    if (!gameStarted || gameOver) return;

    const cellId = parseInt(event.target.id.split('-')[1]);
    const targetPlayer = currentPlayer === 1 ? 2 : 1;
    const targetShips = targetPlayer === 1 ? player1Ships : player2Ships;
    let shipHit = null;

    for (const [shipName, positions] of Object.entries(targetShips)) {
        if (positions.includes(cellId)) {
            shipHit = shipName;
            targetShips[shipName] = positions.filter(pos => pos !== cellId);
            break;
        }
    }

    updateCellStatus(targetPlayer, cellId, shipHit ? 'hit' : 'miss');

    if (shipHit) {
        if (currentPlayer === 1) {
            player1Hits++;
        } else {
            player2Hits++;
        }
        if (targetShips[shipHit].length === 0) {
            updateMessage(`Player ${currentPlayer} sunk Player ${targetPlayer}'s ${shipHit}!`);
            updateShipStatus();
        } else {
            updateMessage(`Player ${currentPlayer} hit! Your turn again.`);
        }
        
        if (checkWin(currentPlayer)) {
            endGame(currentPlayer);
            return;
        }
    } else {
        updateMessage(`Player ${currentPlayer} missed. ${isSinglePlayer ? "Computer's" : `Player ${targetPlayer}'s`} turn.`);
        currentPlayer = targetPlayer;
    }

    removeAllClickListeners();
    setTimeout(() => {
        if (!gameOver) {
            if (isSinglePlayer && currentPlayer === 2) {
                computerTurn();
            } else {
                updateMessage(`Player ${currentPlayer}'s turn`);
                if (!isSinglePlayer) {
                    toggleBoardVisibility();
                }
                addClickListeners();
            }
        }
    }, 1000);
}

// Update cell status (hit or miss)
function updateCellStatus(player, cellId, status) {
    const cell = document.getElementById(`p${player}-${cellId}`);
    cell.classList.remove('ship', 'hidden-ship');
    cell.classList.add(status);
}

// Computer's turn (for single-player mode)
function computerTurn() {
    if (gameOver) return;

    let cellId;
    if (lastHit) {
        cellId = getSmartMove();
    } else {
        do {
            cellId = Math.floor(Math.random() * (boardSize * boardSize));
        } while (document.getElementById(`p1-${cellId}`).classList.contains('hit') || 
                 document.getElementById(`p1-${cellId}`).classList.contains('miss'));
    }

    let shipHit = null;
    for (const [shipName, positions] of Object.entries(player1Ships)) {
        if (positions.includes(cellId)) {
            shipHit = shipName;
            player1Ships[shipName] = positions.filter(pos => pos !== cellId);
            break;
        }
    }

    updateCellStatus(1, cellId, shipHit ? 'hit' : 'miss');

    if (shipHit) {
        player2Hits++;
        if (player1Ships[shipHit].length === 0) {
            updateMessage(`Computer sunk your ${shipHit}!`);
            updateShipStatus();
            lastHit = null;
            hitStack = [];
            currentDirection = 0;
        } else {
            updateMessage("Computer hit!");
            if (!lastHit) {
                lastHit = cellId;
            } else {
                hitStack.push(cellId);
            }
        }
        
        if (checkWin(2)) {
            endGame(2);
            return;
        }
        setTimeout(computerTurn, 1000);
    } else {
        updateMessage("Computer missed! Your turn");
        if (lastHit && hitStack.length === 0) {
            currentDirection = (currentDirection + 1) % 4;
        }
        currentPlayer = 1;
        addClickListeners();
    }
}

function getSmartMove() {
    let row, col;
    if (hitStack.length > 0) {
        const lastHitId = hitStack[hitStack.length - 1];
        row = Math.floor(lastHitId / boardSize);
        col = lastHitId % boardSize;
    } else {
        row = Math.floor(lastHit / boardSize);
        col = lastHit % boardSize;
    }

    const [dx, dy] = directions[currentDirection];
    let newRow = row + dx;
    let newCol = col + dy;
    let cellId = newRow * boardSize + newCol;

    if (newRow < 0 || newRow >= boardSize || newCol < 0 || newCol >= boardSize || 
        document.getElementById(`p1-${cellId}`).classList.contains('hit') || 
        document.getElementById(`p1-${cellId}`).classList.contains('miss')) {
        if (hitStack.length > 0) {
            hitStack.pop();
            return getSmartMove();
        } else {
            currentDirection = (currentDirection + 1) % 4;
            if (currentDirection === 0) {
                lastHit = null;
                return Math.floor(Math.random() * (boardSize * boardSize));
            }
            return getSmartMove();
        }
    }

    return cellId;
}

// Check if a player has won
function checkWin(player) {
    const enemyShips = player === 1 ? player2Ships : player1Ships;
    const totalRemainingShips = Object.values(enemyShips).flat().length;

    if (totalRemainingShips === 0) {
        return true;
    }
    return false;
}

// Update the message display
function updateMessage(message) {
    document.getElementById('message').textContent = message;
}

// Reset the game
function resetGame() {
    createGameBoards();
    player1Ships = {};
    player2Ships = {};
    player1Hits = 0;
    player2Hits = 0;
    currentPlayer = 1;
    setupPlayer = 1;
    gameOver = false;
    gameStarted = false;
    lastHit = null;
    hitStack = [];
    currentDirection = 0;

    if (isSinglePlayer) {
        player2Ships = placeShipsRandomly(2);
        startManualPlacement(1);
        document.getElementById('revealPlayer1Ships').style.display = 'none';
        document.getElementById('revealPlayer2Ships').style.display = 'none';
    } else {
        startManualPlacement(1);
        document.getElementById('revealPlayer1Ships').style.display = 'inline-block';
        document.getElementById('revealPlayer2Ships').style.display = 'inline-block';
    }
    updateShipStatus();
    document.getElementById('startGame').disabled = true;
}

// Manual ship placement functions
function startManualPlacement(player) {
    placingShips = true;
    currentShipIndex = 0;
    addManualPlacementListeners(player);
    updateMessage(`Player ${player}, place your ${getShipName(shipSizes[currentShipIndex], currentShipIndex)} (size: ${shipSizes[currentShipIndex]}). Press R to rotate.`);
}

function addManualPlacementListeners(player) {
    const playerBoard = document.getElementById(`player${player}Board`);
    const cells = playerBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('mouseover', highlightShipPlacement);
        cell.addEventListener('mouseout', removeHighlight);
        cell.addEventListener('click', placeShipManually);
    });
    document.addEventListener('keydown', rotateShip);
}

function highlightShipPlacement(event) {
    if (!placingShips) return;
    const cellId = parseInt(event.target.id.split('-')[1]);
    const row = Math.floor(cellId / boardSize);
    const col = cellId % boardSize;
    const size = shipSizes[currentShipIndex];
    
    removeHighlight();

    const shipCells = getShipCells(row, col, size, currentShipOrientation === 'horizontal');
    const currentShips = setupPlayer === 1 ? player1Ships : player2Ships;
    if (canPlaceShip(Object.values(currentShips).flat(), row, col, size, currentShipOrientation === 'horizontal')) {
        shipCells.forEach(id => {
            document.getElementById(`p${setupPlayer}-${id}`).classList.add('ship-preview');
        });
    } else {
        shipCells.forEach(id => {
            if (id < boardSize * boardSize) {
                document.getElementById(`p${setupPlayer}-${id}`).classList.add('invalid-placement');
            }
        });
    }
}

function removeHighlight() {
    document.querySelectorAll('.ship-preview, .invalid-placement').forEach(cell => {
        cell.classList.remove('ship-preview', 'invalid-placement');
    });
}

function placeShipManually(event) {
    if (!placingShips) return;
    const cellId = parseInt(event.target.id.split('-')[1]);
    const row = Math.floor(cellId / boardSize);
    const col = cellId % boardSize;
    const size = shipSizes[currentShipIndex];
    
    const currentShips = setupPlayer === 1 ? player1Ships : player2Ships;
    if (canPlaceShip(Object.values(currentShips).flat(), row, col, size, currentShipOrientation === 'horizontal')) {
        const newShip = placeShip(row, col, size, currentShipOrientation === 'horizontal');
        currentShips[getShipName(size, currentShipIndex)] = newShip;
        newShip.forEach(pos => {
            const cell = document.getElementById(`p${setupPlayer}-${pos}`);
            cell.classList.remove('ship-preview');
            cell.classList.add('ship');
        });
        
        currentShipIndex++;
        if (currentShipIndex < shipSizes.length) {
            updateMessage(`Player ${setupPlayer}, place your ${getShipName(shipSizes[currentShipIndex], currentShipIndex)} (size: ${shipSizes[currentShipIndex]}). Press R to rotate.`);
        } else {
            finishManualPlacement();
        }
    }
}

function rotateShip(event) {
    if (event.key.toLowerCase() === 'r') {
        currentShipOrientation = currentShipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        const hoveredCell = document.querySelector('.ship-preview, .invalid-placement');
        if (hoveredCell) {
            highlightShipPlacement({ target: hoveredCell });
        }
    }
}

function finishManualPlacement() {
    placingShips = false;
    removeManualPlacementListeners();
    if (!isSinglePlayer) {
        hideShips(setupPlayer);
    }
    if (!isSinglePlayer && setupPlayer === 1) {
        setupPlayer = 2;
        updateMessage("Player 2, get ready to place your ships. The board will be shown in 3 seconds.");
        setTimeout(() => {
            startManualPlacement(2);
        }, 3000);
    } else {
        startGame();
    }
    updateShipStatus();
}

function startGame() {
    gameStarted = true;
    currentPlayer = 1;
    setupPlayer = 1;
    updateMessage("All ships placed. Game starting!");
    setTimeout(() => {
        updateMessage(`Player ${currentPlayer}'s turn`);
        if (isSinglePlayer) {
            addClickListeners();
        } else {
            addClickListeners();
            toggleBoardVisibility();
        }
    }, 2000);
}

function removeManualPlacementListeners() {
    const playerBoard = document.getElementById(`player${setupPlayer}Board`);
    const cells = playerBoard.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.removeEventListener('mouseover', highlightShipPlacement);
        cell.removeEventListener('mouseout', removeHighlight);
        cell.removeEventListener('click', placeShipManually);
    });
    document.removeEventListener('keydown', rotateShip);
}

function getShipName(size, index) {
    const shipNames = {
        5: 'Carrier',
        4: 'Battleship',
        3: ['Cruiser', 'Submarine'],
        2: 'Destroyer'
    };
    return Array.isArray(shipNames[size]) ? shipNames[size][index - 2] : shipNames[size];
}

function getShipCells(row, col, size, isHorizontal) {
    const cells = [];
    for (let i = 0; i < size; i++) {
        if (isHorizontal) {
            cells.push(row * boardSize + (col + i));
        } else {
            cells.push((row + i) * boardSize + col);
        }
    }
    return cells;
}

function updateShipStatus() {
    const player1ShipStatus = document.getElementById('player1Ships');
    const player2ShipStatus = document.getElementById('player2Ships');
    
    player1ShipStatus.innerHTML = '';
    player2ShipStatus.innerHTML = '';
    
    for (const [shipName, positions] of Object.entries(player1Ships)) {
        const shipIcon = document.createElement('div');
        shipIcon.className = 'ship-icon';
        shipIcon.title = shipName;
        if (positions.length === 0) {
            shipIcon.classList.add('sunk');
        }
        player1ShipStatus.appendChild(shipIcon);
    }
    
    for (const [shipName, positions] of Object.entries(player2Ships)) {
        const shipIcon = document.createElement('div');
        shipIcon.className = 'ship-icon';
        shipIcon.title = shipName;
        if (positions.length === 0) {
            shipIcon.classList.add('sunk');
        }
        player2ShipStatus.appendChild(shipIcon);
    }
}

function hideShips(player) {
    const playerBoard = document.getElementById(`player${player}Board`);
    playerBoard.querySelectorAll('.ship').forEach(cell => {
        if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
            cell.classList.remove('ship');
            cell.classList.add('hidden-ship');
        }
    });
}

function revealShips(player) {
    const playerBoard = document.getElementById(`player${player}Board`);
    playerBoard.querySelectorAll('.hidden-ship').forEach(cell => {
        cell.classList.remove('hidden-ship');
        cell.classList.add('ship');
    });
    
    setTimeout(() => {
        hideShips(player);
    }, 3000);
}

function toggleBoardVisibility() {
    if (!isSinglePlayer) {
        const player1Board = document.getElementById('player1Board');
        const player2Board = document.getElementById('player2Board');
        
        if (currentPlayer === 1) {
            player1Board.style.opacity = '0.5';
            player2Board.style.opacity = '1';
        } else {
            player1Board.style.opacity = '1';
            player2Board.style.opacity = '0.5';
        }
    }
}

function endGame(winner) {
    gameOver = true;
    updateMessage(`Player ${winner} wins! Game Over.`);
    document.getElementById('startGame').disabled = false;
    removeAllClickListeners();
}

function removeAllClickListeners() {
    const player1Board = document.getElementById('player1Board');
    const player2Board = document.getElementById('player2Board');
    
    player1Board.querySelectorAll('.cell').forEach(cell => {
        cell.removeEventListener('click', handleCellClick);
    });
    player2Board.querySelectorAll('.cell').forEach(cell => {
        cell.removeEventListener('click', handleCellClick);
    });
}

function addClickListeners() {
    if (gameOver) return;

    const targetBoard = currentPlayer === 1 ? 'player2Board' : 'player1Board';
    const playerBoard = document.getElementById(targetBoard);
    playerBoard.querySelectorAll('.cell').forEach(cell => {
        if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
            cell.addEventListener('click', handleCellClick);
        }
    });
}

// Initialize the game
document.getElementById('singlePlayerBtn').addEventListener('click', () => {
    isSinglePlayer = true;
    document.getElementById('gameSetup').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('player2Title').textContent = 'Enemy Waters';
    document.getElementById('revealPlayer1Ships').style.display = 'none';
    document.getElementById('revealPlayer2Ships').style.display = 'none';
    resetGame();
});

document.getElementById('twoPlayerBtn').addEventListener('click', () => {
    isSinglePlayer = false;
    document.getElementById('gameSetup').style.display = 'none';
    document.getElementById('gameArea').style.display = 'block';
    document.getElementById('player2Title').textContent = 'Player 2';
    document.getElementById('revealPlayer1Ships').style.display = 'inline-block';
    document.getElementById('revealPlayer2Ships').style.display = 'inline-block';
    resetGame();
});

document.getElementById('startGame').addEventListener('click', resetGame);

document.getElementById('revealPlayer1Ships').addEventListener('click', () => revealShips(1));
document.getElementById('revealPlayer2Ships').addEventListener('click', () => revealShips(2));

// Call this function to set up the initial game state
createGameBoards();