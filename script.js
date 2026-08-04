(function() {
  "use strict";

  // ======= ФОНОВАЯ МУЗЫКА =======
  let audioElement = null;
  let isMusicPlaying = false;

  // ======= ЗВУКИ КНОПОК =======
  let clickAudio = null;
  let clickSoundLoaded = false;

  function initClickSound() {
    if (!clickAudio) {
      // ★★★ ИЗМЕНИТЕ ПУТЬ К СВОЕМУ ЗВУКОВОМУ ФАЙЛУ ★★★
      clickAudio = new Audio('music/click.mp3');
      clickAudio.volume = 0.1;
      
      clickAudio.addEventListener('loadeddata', function() {
        clickSoundLoaded = true;
        console.log('Звук кнопок загружен');
      });
      
      clickAudio.addEventListener('error', function(e) {
        console.error('Ошибка загрузки звука:', e);
        createFallbackClickSound();
      });
    }
  }

  function createFallbackClickSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      clickAudio = {
        ctx: audioCtx,
        isFallback: true
      };
      console.log('Используется резервный звук (Web Audio)');
    } catch (e) {
      console.log('Web Audio не поддерживается');
    }
  }

  function playClickSound() {
    if (!isMusicPlaying) return;
    
    try {
      if (clickAudio) {
        if (clickAudio instanceof HTMLAudioElement) {
          clickAudio.currentTime = 0;
          clickAudio.play().catch(function(e) {
            // Игнорируем ошибки
          });
        } else if (clickAudio.isFallback) {
          const ctx = clickAudio.ctx;
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.value = 600 + Math.random() * 400;
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          
          osc.connect(gain);
          gain.connect(ctx.destination);
          
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.08);
        }
      }
    } catch (e) {
      // Игнорируем ошибки
    }
  }

  function initAudio() {
    if (!audioElement) {
      audioElement = new Audio('music/Loyalty_Freak_Music_-_08_-_I_care(chosic.com).mp3');
      audioElement.loop = true;
      audioElement.volume = 0.3;
    }
    initClickSound();
  }

  function startMusic() {
    initAudio();
    if (!audioElement) return;
    audioElement.play()
      .then(() => {
        isMusicPlaying = true;
        updateMusicButton(true);
      })
      .catch(() => {});
  }

  function stopMusic() {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      isMusicPlaying = false;
      updateMusicButton(false);
    }
  }

  function toggleMusic() {
    if (isMusicPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  }

  function updateMusicButton(playing) {
    const musicBtn = document.getElementById('musicBtn');
    if (playing) {
      musicBtn.textContent = '🔊';
      musicBtn.classList.remove('muted');
    } else {
      musicBtn.textContent = '🔇';
      musicBtn.classList.add('muted');
    }
  }

  // ======= ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =======
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getCategoryAnswers(pool, category, excludeAnswer) {
    const answers = pool
      .filter(q => q.category === category && q.answer !== excludeAnswer)
      .map(q => q.answer);
    const unique = [...new Set(answers)];
    return shuffleArray(unique);
  }

  function getDistractors(correctAnswer, pool, category, count = 3) {
    const categoryAnswers = getCategoryAnswers(pool, category, correctAnswer);
    if (categoryAnswers.length < count) {
      const allAnswers = pool
        .filter(q => q.answer !== correctAnswer)
        .map(q => q.answer);
      const uniqueAll = [...new Set(allAnswers)];
      const shuffledAll = shuffleArray(uniqueAll);
      const additional = shuffledAll.filter(a => !categoryAnswers.includes(a));
      return [...categoryAnswers, ...additional].slice(0, count);
    }
    return categoryAnswers.slice(0, count);
  }

  function normalize(str) {
    return str.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  // ======= ТАЙМЕР =======
  let timerInterval = null;
  let timeLeft = 20;
  const MAX_TIME = 20;
  let isTimerPaused = false;

  const timerCompact = document.getElementById('timerCompact');
  const timerValue = document.getElementById('timerValue');

  function startTimer() {
    stopTimer();
    timeLeft = MAX_TIME;
    updateTimerDisplay();
    isTimerPaused = false;
    timerCompact.classList.remove('hidden');
    
    timerInterval = setInterval(() => {
      if (isTimerPaused) return;
      
      timeLeft--;
      updateTimerDisplay();
      
      if (timeLeft <= 0) {
        stopTimer();
        handleTimeout();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    timerCompact.classList.add('hidden');
    timerCompact.className = 'timer-compact hidden';
  }

  function pauseTimer() {
    isTimerPaused = true;
  }

  function resumeTimer() {
    if (isTimerPaused && timerInterval) {
      isTimerPaused = false;
    }
  }

  function updateTimerDisplay() {
    timerValue.textContent = timeLeft;
    timerCompact.className = 'timer-compact';
    
    if (timeLeft <= 5 && timeLeft > 0) {
      timerCompact.classList.add('danger');
    } else if (timeLeft <= 10 && timeLeft > 0) {
      timerCompact.classList.add('warning');
    }
  }

  function handleTimeout() {
    if (isAnswered || gameOver) return;
    
    isAnswered = true;
    optionBtns.forEach(btn => btn.disabled = true);
    
    const correct = currentQuestions[currentIndex].answer;
    
    optionBtns.forEach(btn => {
      const val = btn.dataset.answer;
      if (normalize(val) === normalize(correct)) {
        btn.classList.add('correct');
      }
    });
    
    messageBox.textContent = `⏰ Время вышло! Правильный ответ: "${correct}"`;
    messageBox.className = 'message-box timeout';
    
    timerCompact.classList.add('timeout');
    
    nextBtn.style.display = 'inline-flex';
    nextBtn.classList.add('active');
    if (currentIndex === currentQuestions.length - 1) {
      nextBtn.textContent = '🏁 Завершить';
    } else {
      nextBtn.textContent = '▶ Следующий';
    }
  }

  // ======= СОСТОЯНИЕ =======
  let currentQuestions = [];
  let currentIndex = 0;
  let score = 0;
  let isAnswered = false;
  let gameOver = false;
  let currentTheme = 'pop';
  let isGameActive = false;

  // DOM
  const menuScreen = document.getElementById('menuScreen');
  const gameScreen = document.getElementById('gameScreen');
  const questionText = document.getElementById('questionText');
  const questionImage = document.getElementById('questionImage');
  const optionsGrid = document.getElementById('optionsGrid');
  const optionBtns = optionsGrid.querySelectorAll('.option-btn');
  const messageBox = document.getElementById('messageBox');
  const scoreDisplay = document.getElementById('scoreDisplay');
  const currentNumEl = document.getElementById('currentQuestionNum');
  const totalNumEl = document.getElementById('totalQuestionsNum');
  const nextBtn = document.getElementById('nextBtn');
  const restartBtn = document.getElementById('restartBtn');
  const menuBtn = document.getElementById('menuBtn');
  const themeBadge = document.getElementById('themeBadge');
  const musicBtn = document.getElementById('musicBtn');

  const modalOverlay = document.getElementById('modalOverlay');
  const modalContinueBtn = document.getElementById('modalContinueBtn');
  const modalConfirmBtn = document.getElementById('modalConfirmBtn');

  const themeNames = {
    all: '🎶 Все',
    pop: '🎤 Поп',
    rock: '🎸 Рок',
    rap: '🎧 Рэп'
  };

  // ======= ФУНКЦИЯ ДЛЯ ДОБАВЛЕНИЯ ЗВУКА К КНОПКАМ =======
  function addClickSoundToButton(button) {
    if (!button) return;
    button.addEventListener('click', function(e) {
      if (this.id === 'musicBtn') return;
      playClickSound();
    });
  }

  // ======= ОТОБРАЖЕНИЕ ВОПРОСА =======
  function renderQuestion() {
    if (gameOver) {
      questionText.innerHTML = `
        <div class="final-result">Викторина завершена!</div>
        <div class="final-sub">Правильных ответов: ${score} из ${currentQuestions.length}</div>
      `;
      questionImage.style.display = 'none';
      messageBox.textContent = `🏆 Ваш результат: ${score} / ${currentQuestions.length}`;
      messageBox.className = 'message-box';
      
      optionBtns.forEach(btn => {
        btn.disabled = true;
        btn.style.display = 'none';
      });
      
      nextBtn.classList.remove('active');
      nextBtn.style.display = 'none';
      
      stopTimer();
      
      currentNumEl.textContent = '🎯';
      isGameActive = false;
      return;
    }

    if (currentQuestions.length === 0) return;

    const q = currentQuestions[currentIndex];
    
    optionBtns.forEach(btn => {
      btn.style.display = 'flex';
    });
    
    if (q.image) {
      questionImage.src = q.image;
      questionImage.style.display = 'block';
      questionImage.alt = 'Изображение к вопросу';
    } else {
      questionImage.style.display = 'none';
    }
    
    questionText.textContent = q.question;
    currentNumEl.textContent = currentIndex + 1;
    totalNumEl.textContent = currentQuestions.length;

    const correct = q.answer;
    const category = q.category;
    
    let distractors = getDistractors(correct, currentQuestions, category, 3);
    while (distractors.length < 3) {
      const fallbackAnswers = currentQuestions
        .filter(q => q.answer !== correct && !distractors.includes(q.answer))
        .map(q => q.answer);
      if (fallbackAnswers.length === 0) break;
      distractors.push(fallbackAnswers[0]);
    }
    while (distractors.length < 3) {
      distractors.push('???');
    }
    
    let options = shuffleArray([correct, ...distractors]);

    optionBtns.forEach((btn, idx) => {
      btn.textContent = options[idx] || '—';
      btn.dataset.answer = options[idx] || '';
      btn.className = 'option-btn';
      btn.disabled = false;
      btn.style.display = 'flex';
    });

    isAnswered = false;
    nextBtn.classList.remove('active');
    nextBtn.style.display = 'none';
    messageBox.textContent = 'Выберите один из вариантов';
    messageBox.className = 'message-box';
    scoreDisplay.textContent = score;
    isGameActive = true;
    
    startTimer();
  }

  // ======= ОБРАБОТЧИК ВЫБОРА ОТВЕТА =======
  function handleOptionClick(e) {
    const btn = e.currentTarget;
    if (isAnswered || gameOver || btn.disabled) return;

    stopTimer();

    const selected = btn.dataset.answer;
    const correct = currentQuestions[currentIndex].answer;
    const isCorrect = normalize(selected) === normalize(correct);

    optionBtns.forEach(b => b.disabled = true);
    isAnswered = true;

    optionBtns.forEach(b => {
      const val = b.dataset.answer;
      if (normalize(val) === normalize(correct)) {
        b.classList.add('correct');
      } else if (b === btn && !isCorrect) {
        b.classList.add('wrong');
      }
    });

    if (isCorrect) {
      score++;
      scoreDisplay.textContent = score;
      messageBox.textContent = '✅ Верно! +1 балл';
      messageBox.className = 'message-box correct';
    } else {
      messageBox.textContent = `❌ Неверно. Правильный ответ: "${correct}"`;
      messageBox.className = 'message-box wrong';
    }

    nextBtn.style.display = 'inline-flex';
    nextBtn.classList.add('active');
    if (currentIndex === currentQuestions.length - 1) {
      nextBtn.textContent = '🏁 Завершить';
    } else {
      nextBtn.textContent = '▶ Следующий';
    }
  }

  // ======= СЛЕДУЮЩИЙ ВОПРОС / ЗАВЕРШЕНИЕ =======
  function goToNext() {
    if (gameOver) return;

    if (currentIndex === currentQuestions.length - 1) {
      gameOver = true;
      renderQuestion();
      nextBtn.classList.remove('active');
      nextBtn.style.display = 'none';
      return;
    }

    currentIndex++;
    renderQuestion();
  }

  // ======= ЗАПУСК ИГРЫ =======
  function startGame(theme) {
    currentTheme = theme;
    const pool = QUESTIONS_BY_THEME[theme] || QUESTIONS_BY_THEME.pop;
    const shuffledPool = shuffleArray([...pool]);
    currentQuestions = shuffledPool.slice(0, 20);

    currentIndex = 0;
    score = 0;
    isAnswered = false;
    gameOver = false;
    isGameActive = true;

    optionBtns.forEach(btn => {
      btn.disabled = false;
      btn.className = 'option-btn';
      btn.style.display = 'flex';
    });

    nextBtn.classList.remove('active');
    nextBtn.style.display = 'none';
    nextBtn.textContent = '▶ Следующий';
    messageBox.className = 'message-box';
    messageBox.textContent = `🎵 Тема: ${themeNames[theme] || theme}`;

    themeBadge.textContent = themeNames[theme] || theme;

    menuScreen.classList.remove('active');
    menuScreen.style.display = 'none';
    gameScreen.classList.add('active');
    gameScreen.style.display = 'block';

    renderQuestion();

    if (!isMusicPlaying) {
      startMusic();
    }
  }

  // ======= МЕНЮ =======
  function requestGoToMenu() {
    if (!isGameActive || gameOver || currentQuestions.length === 0) {
      goToMenuDirect();
      return;
    }
    pauseTimer();
    modalOverlay.classList.add('active');
  }

  function goToMenuDirect() {
    modalOverlay.classList.remove('active');
    isGameActive = false;
    gameScreen.classList.remove('active');
    gameScreen.style.display = 'none';
    menuScreen.style.display = 'flex';
    menuScreen.classList.add('active');
    nextBtn.classList.remove('active');
    nextBtn.style.display = 'none';
    stopTimer();
  }

  function cancelGoToMenu() {
    modalOverlay.classList.remove('active');
    resumeTimer();
  }

  function restartGame() {
    startGame(currentTheme);
  }

  // ======= ИНИЦИАЛИЗАЦИЯ =======
  function initGame() {
    // Добавляем звук на все кнопки (кроме кнопки музыки)
    const allButtons = document.querySelectorAll('button');
    allButtons.forEach(btn => {
      if (btn.id !== 'musicBtn') {
        addClickSoundToButton(btn);
      }
    });

    optionBtns.forEach(btn => {
      btn.addEventListener('click', handleOptionClick);
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const theme = this.dataset.theme;
        startGame(theme);
      });
    });

    nextBtn.addEventListener('click', goToNext);
    restartBtn.addEventListener('click', restartGame);
    menuBtn.addEventListener('click', requestGoToMenu);
    musicBtn.addEventListener('click', toggleMusic);

    modalContinueBtn.addEventListener('click', cancelGoToMenu);
    modalConfirmBtn.addEventListener('click', goToMenuDirect);
    
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === this) {
        cancelGoToMenu();
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        cancelGoToMenu();
      }
    });

    menuScreen.style.display = 'flex';
    menuScreen.classList.add('active');
    gameScreen.style.display = 'none';
    gameScreen.classList.remove('active');

    updateMusicButton(false);
    initAudio();
  }

  initGame();
})();