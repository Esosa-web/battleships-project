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

// Place ships randomly for player 2
function placeShipsRandomly() {
    player2Ships = placeShipsForPlayer(2);
    startManualPlacement();
}

function placeShipsForPlayer(player) {
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
                ships[getShipName(size)] = newShip;
                placed = true;

                // Visualize ships on player 1's board
                if (player === 1) {
                    newShip.forEach(pos => {
                        const cell = document.getElementById(`p1-${pos}`);
                        cell.classList.add('ship');
                    });
                }
            }
        }
    }
    return ships;
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
    if (currentPlayer !== 1) return;

    const cellId = parseInt(event.target.id.split('-')[1]);
    let shipHit = null;
    for (const [shipName, positions] of Object.entries(player2Ships)) {
        if (positions.includes(cellId)) {
            shipHit = shipName;
            break;
        }
    }

    if (shipHit) {
        event.target.classList.add('hit');
        player1Hits++;
        player2Ships[shipHit] = player2Ships[shipHit].filter(pos => pos !== cellId);
        if (player2Ships[shipHit].length === 0) {
            updateMessage(`You sunk the computer's ${shipHit}!`);
            setTimeout(() => {
                if (!checkWin(1)) {
                    currentPlayer = 2;
                    computerTurn();
                }
            }, 2000); // Delay for 2 seconds after sinking a ship
        } else {
            updateMessage("Hit!");
            setTimeout(() => {
                currentPlayer = 2;
                computerTurn();
            }, 1000);
        }
    } else {
        event.target.classList.add('miss');
        updateMessage("Miss!");
        setTimeout(() => {
            currentPlayer = 2;
            computerTurn();
        }, 1000);
    }
    event.target.removeEventListener('click', handleCellClick);
}

// Computer's turn
function computerTurn() {
    let cellId;
    do {
        cellId = Math.floor(Math.random() * (boardSize * boardSize));
    } while (document.getElementById(`p1-${cellId}`).classList.contains('hit') || 
             document.getElementById(`p1-${cellId}`).classList.contains('miss'));

    const cell = document.getElementById(`p1-${cellId}`);
    let shipHit = null;
    for (const [shipName, positions] of Object.entries(player1Ships)) {
        if (positions.includes(cellId)) {
            shipHit = shipName;
            break;
        }
    }

    if (shipHit) {
        cell.classList.add('hit');
        player2Hits++;
        player1Ships[shipHit] = player1Ships[shipHit].filter(pos => pos !== cellId);
        if (player1Ships[shipHit].length === 0) {
            updateMessage(`The computer sunk your ${shipHit}!`);
            setTimeout(() => {
                if (!checkWin(2)) {
                    currentPlayer = 1;
                    updateMessage("Your turn");
                }
            }, 2000); // Delay for 2 seconds after sinking a ship
        } else {
            updateMessage("The computer hit your ship!");
            setTimeout(() => {
                currentPlayer = 1;
                updateMessage("Your turn");
            }, 1000);
        }
    } else {
        cell.classList.add('miss');
        updateMessage("The computer missed!");
        setTimeout(() => {
            currentPlayer = 1;
            updateMessage("Your turn");
        }, 1000);
    }
}

// Check if a player has won
function checkWin(player) {
    const allShipsSunk = (player === 1) 
        ? Object.values(player2Ships).every(ship => ship.length === 0)
        : Object.values(player1Ships).every(ship => ship.length === 0);

    if (allShipsSunk) {
        const winMessage = player === 1 ? "Congratulations! You win!" : "The computer wins!";
        updateMessage(winMessage);
        document.getElementById('startGame').disabled = false;
        // Disable further clicks on the opponent's board
        const opponentBoard = (player === 1) ? 'player2Board' : 'player1Board';
        document.querySelectorAll(`#${opponentBoard} .cell`).forEach(cell => {
            cell.removeEventListener('click', handleCellClick);
        });
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

    player2Ships = placeShipsForPlayer(2);
    startManualPlacement();
}

// Manual ship placement functions
function startManualPlacement() {
    placingShips = true;
    currentShipIndex = 0;
    updateMessage(`Place your ${getShipName(shipSizes[currentShipIndex])} (size: ${shipSizes[currentShipIndex]}). Press R to rotate.`);
    addManualPlacementListeners();
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
    
    removeHighlight(); // Remove any existing highlights

    if (canPlaceShip(Object.values(player1Ships).flat(), row, col, size, currentShipOrientation === 'horizontal')) {
        const shipCells = getShipCells(row, col, size, currentShipOrientation === 'horizontal');
        shipCells.forEach(id => {
            const cell = document.getElementById(`p1-${id}`);
            cell.classList.add('ship-preview');
        });
    } else {
        // Add invalid placement highlight
        const shipCells = getShipCells(row, col, size, currentShipOrientation === 'horizontal');
        shipCells.forEach(id => {
            const cell = document.getElementById(`p1-${id}`);
            if (cell) {
                cell.classList.add('invalid-placement');
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
        player1Ships[getShipName(size)] = newShip;
        newShip.forEach(pos => {
            document.getElementById(`p1-${pos}`).classList.add('ship');
        });
        
        removeHighlight(); // Remove the preview highlight
        
        currentShipIndex++;
        if (currentShipIndex < shipSizes.length) {
            updateMessage(`Place your ${getShipName(shipSizes[currentShipIndex])} (size: ${shipSizes[currentShipIndex]}). Press R to rotate.`);
        } else {
            finishManualPlacement();
        }
    }
}

function rotateShip(event) {
    if (event.key.toLowerCase() === 'r') {
        currentShipOrientation = currentShipOrientation === 'horizontal' ? 'vertical' : 'horizontal';
        removeHighlight();
    }
}

function finishManualPlacement() {
    placingShips = false;
    removeManualPlacementListeners();
    updateMessage("Your turn");
    document.getElementById('startGame').disabled = true;
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

function getShipName(size) {
    const shipNames = {
        5: 'Carrier',
        4: 'Battleship',
        3: 'Cruiser/Submarine',
        2: 'Destroyer'
    };
    return shipNames[size];
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

// Initialize the game
document.getElementById('startGame').addEventListener('click', () => {
    resetGame();
    document.getElementById('startGame').disabled = true;
});

// Call these functions to set up the initial game state
createGameBoards();
resetGame();