let vocabularyData = [];
let currentCard = null;
let isWeeklyMode = false;
let isRepeatsMode = false;
let filteredTerms = [];
let currentTermIndex = 0;

const fetchVocabularyData = async () => {
    try {
        const response = await fetch('https://sheets.livepolls.app/api/spreadsheets/e20fc709-853b-45be-aa86-8fd4ea90ef8a/Sheet1');
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching vocabulary data:', error);
        return [];
    }
};

document.addEventListener('DOMContentLoaded', async () => {
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
        filteredTerms = vocabularyData.filter(item => {
            if (isWeeklyMode) {
                return item.Front.includes('!');
            }
            return true;
        });

        if (!isWeeklyMode && !isRepeatsMode) {
            filteredTerms.sort((a, b) => {
                const termA = a.Front.replace(/!R?/g, '').toLowerCase();
                const termB = b.Front.replace(/!R?/g, '').toLowerCase();
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

            const cleanFront = currentCard.Front.replace(/!R?/g, '');
            const cleanBack = currentCard.Back.replace(/!R?/g, '');
            const text = isFlipped ? cleanBack : cleanFront;
            const isRepeat = currentCard.Front.includes('!R');
            const isWeekly = currentCard.Front.includes('!');

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
        const cleanSearchTerm = searchTerm.replace(/!R?/g, '');
        let matchingTerms = vocabularyData.filter(item => 
            item.Front.replace(/!R?/g, '').toLowerCase().includes(cleanSearchTerm.toLowerCase())
        );

        if (!isWeeklyMode && !isRepeatsMode) {
            matchingTerms.sort((a, b) => {
                const termA = a.Front.replace(/!R?/g, '').toLowerCase();
                const termB = b.Front.replace(/!R?/g, '').toLowerCase();
                return termA.localeCompare(termB);
            });
        }

        const weeklyCount = vocabularyData.filter(item => item.Front.includes('!')).length;
        const repeatsCount = vocabularyData.filter(item => item.Front.includes('!R')).length;

        weeklyLabel.innerHTML = `This Week's Flashcards <span style="color: #2196F3; font-weight: bold;">(${weeklyCount})</span>`;
        repeatsLabel.innerHTML = `Mark Repeats <span style="color: #FF6B6B; font-weight: bold;">(${repeatsCount})</span>`;

        if (isWeeklyMode) {
            matchingTerms = matchingTerms.filter(item => item.Front.includes('!'));
        }

        dropdownList.innerHTML = '';
        matchingTerms.forEach(item => {
            const option = document.createElement('option');
            const cleanTerm = item.Front.replace(/!R?/g, '');
            const isRepeat = item.Front.includes('!R');
            
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
                option.innerHTML += ' <span style="color: #FF6B6B; font-style: italic;">(REPEAT)</span>';
            }

            option.value = item.Front;
            dropdownList.appendChild(option);
        });

        if (matchingTerms.length === 1) {
            updateCard(matchingTerms[0].Front);
        } else {
            currentCard = null;
            drawCard();
        }
    };

    const updateCard = (term) => {
        const cleanTerm = term.replace(/!R?/g, '');
        currentCard = vocabularyData.find(item => 
            item.Front.replace(/!R?/g, '').toLowerCase() === cleanTerm.toLowerCase()
        );
        searchInput.value = cleanTerm;
        isFlipped = false;
        drawCard();
    };

    const setupNavigation = () => {
        const backNav = document.getElementById('backNavigation');
        const forwardNav = document.getElementById('forwardNavigation');

        backNav.addEventListener('click', () => navigateCards(-1));
        forwardNav.addEventListener('click', () => navigateCards(1));

        backNav.addEventListener('mouseover', () => {
            backNav.src = 'https://interlinkcvhs.org/qotdBackwardHover.png';
        });
        backNav.addEventListener('mouseout', () => {
            backNav.src = 'https://interlinkcvhs.org/qotdBackward.png';
        });
        forwardNav.addEventListener('mouseover', () => {
            forwardNav.src = 'https://interlinkcvhs.org/qotdForwardHover.png';
        });
        forwardNav.addEventListener('mouseout', () => {
            forwardNav.src = 'https://interlinkcvhs.org/qotdForward.png';
        });
    };

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName.toLowerCase() === 'input' || 
            e.target.tagName.toLowerCase() === 'textarea' || 
            e.target.tagName.toLowerCase() === 'select') {
            return;
        }

        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                navigateCards(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                navigateCards(1);
                break;
            case ' ':
                e.preventDefault();
                flipCard();
                break;
        }
    });

    weeklyToggle.addEventListener('change', (e) => {
        isWeeklyMode = e.target.checked;
        if (!isWeeklyMode) {
            repeatsToggle.checked = false;
            isRepeatsMode = false;
        }
        searchInput.value = '';
        updateSliderColor();
        updateDropdown('');
    });

    repeatsToggle.addEventListener('change', (e) => {
        isRepeatsMode = e.target.checked;
        if (isRepeatsMode) {
            weeklyToggle.checked = true;
            isWeeklyMode = true;
        }
        searchInput.value = '';
        updateSliderColor();
        updateDropdown('');
    });

    searchInput.addEventListener('input', (e) => {
        updateDropdown(e.target.value);
    });

    dropdownList.addEventListener('change', (e) => {
        updateCard(e.target.value);
    });

    flipButton.addEventListener('click', flipCard);
    canvas.addEventListener('click', flipCard);

    vocabularyData = await fetchVocabularyData();
    setupNavigation();
    updateSliderColor();
    updateDropdown('');
    drawCard();
});
