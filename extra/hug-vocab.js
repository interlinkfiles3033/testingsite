const fetchVocabularyData = async () => {
    try {
        const response = await fetch('https://sheets.livepolls.app/api/spreadsheets/4d69aeca-6e4c-458a-b7fe-0a7e765b2e61/Sheet1');
        const data = await response.json();
        return data.data || []; // Return empty array if data is null or undefined
    } catch (error) {
        console.error('Error fetching vocabulary data:', error);
        return []; // Return empty array in case of error
    }
};

let vocabularyData = [];
let currentCard = null;
let isWeeklyMode = false;
let isRepeatsMode = false;
let filteredTerms = [];
let currentTermIndex = 0;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const backNavigation = document.getElementById('backNavigation');
const forwardNavigation = document.getElementById('forwardNavigation');

const searchInput = document.getElementById('searchInput');
const dropdownList = document.getElementById('dropdownList');
const flipButton = document.getElementById('flipButton');
const weeklyToggle = document.getElementById('weeklyToggle');
const weeklyLabel = document.getElementById('weeklyLabel');
const repeatsToggle = document.getElementById('repeatsToggle');
const repeatsLabel = document.getElementById('repeatsLabel');

const cardWidth = 600;
const cardHeight = 400;
const cardX = (canvas.width - cardWidth) / 2;
const cardY = (canvas.height - cardHeight) / 2;

let isFlipped = false;
let flipProgress = 0;

const getWrappedText = (text, maxWidth) => {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + word + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && currentLine !== '') {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine = testLine;
        }
    });

    lines.push(currentLine.trim());
    return lines;
};

const updateSliderColor = () => {
    const weeklySlider = document.querySelector('#weeklyToggle + .slider');
    const repeatsSlider = document.querySelector('#repeatsToggle + .slider');

    const defaultColor = '#808080';
    const weeklyBlue = '#2196F3';
    const repeatsRed = '#FF6B6B';

    weeklySlider.style.backgroundColor = isWeeklyMode ? weeklyBlue : defaultColor;
    repeatsSlider.style.backgroundColor = isRepeatsMode ? repeatsRed : defaultColor;
};

const navigateCards = (direction) => {
    if (!vocabularyData || vocabularyData.length === 0) return;

    filteredTerms = vocabularyData.filter(item => {
        if (isWeeklyMode) {
            return item.Term.includes('!');
        }
        return true;
    });

    if (!isWeeklyMode && !isRepeatsMode) {
        filteredTerms.sort((a, b) => {
            const termA = a.Term.replace(/!R?/g, '').toLowerCase();
            const termB = b.Term.replace(/!R?/g, '').toLowerCase();
            return termA.localeCompare(termB);
        });
    }

    if (filteredTerms.length === 0) return;

    if (!currentCard) {
        currentTermIndex = direction > 0 ? 0 : filteredTerms.length - 1;
    } else {
        currentTermIndex += direction;
        if (currentTermIndex < 0) {
            currentTermIndex = filteredTerms.length - 1;
        } else if (currentTermIndex >= filteredTerms.length) {
            currentTermIndex = 0;
        }
    }

    currentCard = filteredTerms[currentTermIndex];
    isFlipped = false;
    drawCard();
};

const flipCard = () => {
    if (!currentCard) return;

    isFlipped = !isFlipped;
    flipProgress = 0;
    animateFlip();
};

const animateFlip = () => {
    flipProgress += 0.1;

    if (flipProgress < 1) {
        const scale = Math.cos(flipProgress * Math.PI);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, 1);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        drawCard();
        ctx.restore();
        requestAnimationFrame(animateFlip);
    } else {
        drawCard();
    }
};

const drawCard = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 10);
    ctx.fill();
    ctx.stroke();

    if (currentCard) {
        ctx.font = '24px Montserrat';
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const cleanTerm = currentCard.Term.replace(/!R?/g, '');
        const cleanDefinition = currentCard.Definition.replace(/!R?/g, '');

        const text = isFlipped ? cleanDefinition : cleanTerm;
        
        const isRepeat = currentCard.Term.includes('!R');
        const isWeekly = currentCard.Term.includes('!');

        if (isRepeatsMode && isRepeat) {
            ctx.fillStyle = '#FF6B6B';
            ctx.font = 'bold 24px Montserrat';
        } else if (isWeekly) {
            ctx.fillStyle = '#2196F3';
            ctx.font = 'bold 24px Montserrat';
        }

        const lines = getWrappedText(text, cardWidth - 40);

        if (isRepeat && isRepeatsMode) {
            lines.push('(REPEAT)');
        }
        
        lines.forEach((line, index) => {
            ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index - (lines.length - 1) / 2) * 30);
        });
    } else {
        ctx.font = '24px Montserrat';
        ctx.fillStyle = '#888888';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Search for a term...', canvas.width / 2, canvas.height / 2);
    }
};

const updateDropdown = (searchTerm) => {
    if (!vocabularyData || vocabularyData.length === 0) return;

    const cleanSearchTerm = searchTerm.replace(/!R?/g, '');

    let matchingTerms = vocabularyData.filter(item => 
        item.Term.replace(/!R?/g, '').toLowerCase().includes(cleanSearchTerm.toLowerCase())
    );

    if (!isWeeklyMode && !isRepeatsMode) {
        matchingTerms.sort((a, b) => {
            const termA = a.Term.replace(/!R?/g, '').toLowerCase();
            const termB = b.Term.replace(/!R?/g, '').toLowerCase();
            return termA.localeCompare(termB);
        });
    }

    const weeklyCount = vocabularyData.filter(item => 
        item.Term.includes('!')
    ).length;

    const repeatsCount = vocabularyData.filter(item => 
        item.Term.includes('!R')
    ).length;

    weeklyLabel.innerHTML = `This Week's Flashcards <span style="color: #2196F3; font-weight: bold;">(${weeklyCount})</span>`;
    repeatsLabel.innerHTML = `Mark Repeats <span style="color: #FF6B6B; font-weight: bold;">(${repeatsCount})</span>`;

    if (isWeeklyMode) {
        matchingTerms = matchingTerms.filter(item => 
            item.Term.includes('!')
        );
    }

    dropdownList.innerHTML = '';
    matchingTerms.forEach(item => {
        const option = document.createElement('option');
        
        const cleanTerm = item.Term.replace(/!R?/g, '');
        const cleanSearchTerm = searchTerm.replace(/!R?/g, '');

        const isRepeat = item.Term.includes('!R');

        const lowerCleanTerm = cleanTerm.toLowerCase();
        const lowerSearchTerm = cleanSearchTerm.toLowerCase();
        const matchIndex = lowerCleanTerm.indexOf(lowerSearchTerm);

        if (matchIndex !== -1 && cleanSearchTerm) {
            const beforeMatch = cleanTerm.slice(0, matchIndex);
            const matchedPart = cleanTerm.slice(matchIndex, matchIndex + cleanSearchTerm.length);
            const afterMatch = cleanTerm.slice(matchIndex + cleanSearchTerm.length);
            
            option.innerHTML = `${beforeMatch}<strong>${matchedPart}</strong>${afterMatch}`;
        } else {
            option.textContent = cleanTerm;
        }

        if (isRepeatsMode && isRepeat) {
            option.style.fontWeight = 'bold';
            option.style.color = '#FF6B6B';
        }
        dropdownList.appendChild(option);
    });

    const noResultsOption = document.createElement('option');
    noResultsOption.textContent = 'No matching terms found.';
    noResultsOption.disabled = true;
    dropdownList.appendChild(noResultsOption);
};

// Handle dropdown selection
dropdownList.addEventListener('change', () => {
    searchInput.value = dropdownList.value;
    updateDropdown(searchInput.value);
    navigateCards(0);
});

// Handle search input
searchInput.addEventListener('input', () => {
    updateDropdown(searchInput.value);
});

weeklyToggle.addEventListener('change', () => {
    isWeeklyMode = weeklyToggle.checked;
    updateSliderColor();
    updateDropdown(searchInput.value);
});

repeatsToggle.addEventListener('change', () => {
    isRepeatsMode = repeatsToggle.checked;
    updateSliderColor();
    updateDropdown(searchInput.value);
});

// Handle navigation
backNavigation.addEventListener('click', () => {
    navigateCards(-1);
});

forwardNavigation.addEventListener('click', () => {
    navigateCards(1);
});

// Initialize
fetchVocabularyData().then(data => {
    vocabularyData = data;
    navigateCards(0);
});
