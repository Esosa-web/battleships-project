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

// AI variables
let lastHit = null;
let hitStack = [];
let huntMode = false;

// Create the game boards
function createGameBoards() {
    const player1Board = document.getElementById('player1Board');
    const player2Board = document.getElementById('player2Board');
    
    for (let i = 0; i < boardSize * boardSize; i++) {
        const cell1 = document.createElement('div');
        cell1.className = 'cell';
        cell1.id = `p1-${i}`;
        player1Board.appendChild(cell1);

        const cell2 = document.createElement('div');
        cell2.className = 'cell';
        cell2.id = `p2-${i}`;
        cell2.addEventListener('click', handleCellClick);
        player2Board.appendChild(cell2);
    }
}

// Place ships randomly for computer
function placeShipsRandomly() {
    player2Ships = {};
    for (let i = 0; i < shipSizes.length; i++) {
        const size = shipSizes[i];
        let placed = false;
        while (!placed) {
            const isHorizontal = Math.random() < 0.5;
            const startRow = Math.floor(Math.random() * boardSize);
            const startCol = Math.floor(Math.random() * boardSize);
            
            if (canPlaceShip(Object.values(player2Ships).flat(), startRow, startCol, size, isHorizontal)) {
                const newShip = placeShip(startRow, startCol, size, isHorizontal);
                player2Ships[getShipName(size, i)] = newShip;
                placed = true;
            }
        }
    }
    startManualPlacement();
    updateShipStatus();
}

function canPlaceShip(existingShips, row, col, size, isHorizontal) {
    if (isHorizontal) {
        if (col + size > boardSize) return false;
        for (let i = 0; i < size; i++) {
            if (existingShips.includes(row * boardSize + col + i)) return false;
        }
    } else {
        if (row + size > boardSize) return false;
        for (let i = 0; i < size; i++) {
            if (existingShips.includes((row + i) * boardSize + col)) return false;
        }
    }
    return true;
}

function placeShip(row, col, size, isHorizontal) {
    const shipPositions = [];
    for (let i = 0; i < size; i++) {
        if (isHorizontal) {
            shipPositions.push(row * boardSize + col + i);
        } else {
            shipPositions.push((row + i) * boardSize + col);
        }
    }
    return shipPositions;
}

// Handle cell click event
function handleCellClick(event) {
    if (gameOver || currentPlayer !== 1) return; // Only allow clicks when it's the player's turn and game is not over

    const cellId = parseInt(event.target.id.split('-')[1]);
    let shipHit = null;
    for (const [shipName, positions] of Object.entries(player2Ships)) {
        if (positions.includes(cellId)) {
            shipHit = shipName;
            player2Ships[shipName] = positions.filter(pos => pos !== cellId);
            break;
        }
    }

    if (shipHit) {
        event.target.classList.add('hit');
        player1Hits++;
        if (player2Ships[shipHit].length === 0) {
            updateMessage(`You sunk the enemy's ${shipHit}!`);
            updateShipStatus();
        } else {
            updateMessage("Hit! Your turn again.");
        }
        if (checkWin(1)) return;
    } else {
        event.target.classList.add('miss');
        currentPlayer = 2;
        updateMessage("Miss! Computer's turn");
        setTimeout(computerTurn, 1000);
    }
    event.target.removeEventListener('click', handleCellClick);
}

// Improved Computer's turn with hunt and target strategy
function computerTurn() {
    if (gameOver) return;

    let cellId;
    if (huntMode && hitStack.length > 0) {
        cellId = hitStack.pop();
    } else {
        do {
            cellId = Math.floor(Math.random() * (boardSize * boardSize));
        } while (document.getElementById(`p1-${cellId}`).classList.contains('hit') || 
                 document.getElementById(`p1-${cellId}`).classList.contains('miss'));
    }

    const cell = document.getElementById(`p1-${cellId}`);
    let shipHit = null;
    for (const [shipName, positions] of Object.entries(player1Ships)) {
        if (positions.includes(cellId)) {
            shipHit = shipName;
            player1Ships[shipName] = positions.filter(pos => pos !== cellId);
            break;
        }
    }

    if (shipHit) {
        cell.classList.add('hit');
        player2Hits++;
        lastHit = cellId;
        huntMode = true;
        addAdjacentCells(cellId);
        if (player1Ships[shipHit].length === 0) {
            updateMessage(`Computer sunk your ${shipHit}!`);
            updateShipStatus();
        } else {
            updateMessage("Computer hit! Computer's turn again.");
        }
        if (checkWin(2)) return;
        setTimeout(computerTurn, 1000);
    } else {
        cell.classList.add('miss');
        if (hitStack.length === 0) {
            huntMode = false;
            lastHit = null;
        }
        currentPlayer = 1;
        updateMessage("Computer missed! Your turn");
    }
}

function addAdjacentCells(cellId) {
    const row = Math.floor(cellId / boardSize);
    const col = cellId % boardSize;
    const adjacentCells = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
    ];

    for (const [adjRow, adjCol] of adjacentCells) {
        if (adjRow >= 0 && adjRow < boardSize && adjCol >= 0 && adjCol < boardSize) {
            const adjCellId = adjRow * boardSize + adjCol;
            const adjCell = document.getElementById(`p1-${adjCellId}`);
            if (!adjCell.classList.contains('hit') && !adjCell.classList.contains('miss')) {
                hitStack.push(adjCellId);
            }
        }
    }
}

// Check if a player has won
function checkWin(player) {
    if ((player === 1 && player1Hits === Object.values(player2Ships).flat().length) || 
        (player === 2 && player2Hits === Object.values(player1Ships).flat().length)) {
        updateMessage(`Player ${player} wins!`);
        document.getElementById('startGame').disabled = false;
        gameOver = true;
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
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.className = 'cell';
        if (cell.id.startsWith('p2-')) {
            cell.addEventListener('click', handleCellClick);
        }
    });

    player1Ships = {};
    player2Ships = {};
    player1Hits = 0;
    player2Hits = 0;
    currentPlayer = 1;
    gameOver = false;

    // Reset AI variables
    lastHit = null;
    hitStack = [];
    huntMode = false;

    placeShipsRandomly();
}

// Manual ship placement functions
function startManualPlacement() {
    placingShips = true;
    currentShipIndex = 0;
    addManualPlacementListeners();
    updateMessage(`Place your ${getShipName(shipSizes[currentShipIndex], currentShipIndex)} (size: ${shipSizes[currentShipIndex]}). Press R to rotate.`);
}

function addManualPlacementListeners() {
    const player1Cells = document.querySelectorAll('#player1Board .cell');
    player1Cells.forEach(cell => {
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
    if (canPlaceShip(Object.values(player1Ships).flat(), row, col, size, currentShipOrientation === 'horizontal')) {
        shipCells.forEach(id => {
            document.getElementById(`p1-${id}`).classList.add('ship-preview');
        });
    } else {
        shipCells.forEach(id => {
            if (id < boardSize * boardSize) {
                document.getElementById(`p1-${id}`).classList.add('invalid-placement');
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
    
    if (canPlaceShip(Object.values(player1Ships).flat(), row, col, size, currentShipOrientation === 'horizontal')) {
        const newShip = placeShip(row, col, size, currentShipOrientation === 'horizontal');
        player1Ships[getShipName(size, currentShipIndex)] = newShip;
        newShip.forEach(pos => {
            const cell = document.getElementById(`p1-${pos}`);
            cell.classList.remove('ship-preview');
            cell.classList.add('ship');
        });
        
        currentShipIndex++;
        if (currentShipIndex < shipSizes.length) {
            updateMessage(`Place your ${getShipName(shipSizes[currentShipIndex], currentShipIndex)} (size: ${shipSizes[currentShipIndex]}). Press R to rotate.`);
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
    updateMessage("All ships placed. Game starting!");
    setTimeout(() => {
        updateMessage("Your turn");
    }, 2000);
    document.getElementById('startGame').disabled = false;
    updateShipStatus();
}

function removeManualPlacementListeners() {
    const player1Cells = document.querySelectorAll('#player1Board .cell');
    player1Cells.forEach(cell => {
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
            cells.push(row * boardSize + col + i);
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

// Initialize the game
document.getElementById('startGame').addEventListener('click', () => {
    resetGame();
    document.getElementById('startGame').disabled = true;
});

// Call these functions to set up the initial game state
createGameBoards();
resetGame();