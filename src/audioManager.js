/* ***** Создаем основные переменные ***** */
// Главный движок для работы со звуком в Web Audio API
let audioContext = null;

// Обычный HTML5 audio элемент
let audioElement = null;

// Связующее звено между HTML audio и Web Audio API
let source = null;

// Аудио анализатор
let analyser = null;

/*
  Как всё это работает вместе:
  audioElement → source → analyser → audioContext
*/

// Отслеживаем состояние проигрывания
let isPlaying = false;

// Текущий аудио URL
let currentAudioURL = null;

// Инициализация AudioContext
// window.AudioContext - стандартный API для современных браузеров
// window.webkitAudioContext - для старых браузеров (Safari)
export function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('AudioContext создан');
    }
    return audioContext;
}

// Загрузка аудиофайла
export async function loadAudioFile(file) {
    // Останавливаем предыдущее воспроизведение
    if (audioElement) {
        audioElement.pause();
    }

    // Освобождаем аудио URL перед созданием нового
    if (currentAudioURL) {
        URL.revokeObjectURL(currentAudioURL);
        console.log('🗑️ Освобожден предыдущий blob URL', currentAudioURL);
    }

    // Создаем новый URL для аудио файла
    currentAudioURL = URL.createObjectURL(file);
    console.log('📁 Создан blob URL:', currentAudioURL);

    // Создаем audio элемент
    audioElement = new Audio(currentAudioURL);

    // Инициализируем AudioContext
    initAudioContext();

    // Подключаем audio элемент к движку
    source = audioContext.createMediaElementSource(audioElement);

    // Включаем аудио анализатор
    analyser = audioContext.createAnalyser();
    // Устанавливаем детализацию анализатора (default)
    analyser.fftSize = 2048;

    // Сборка всей звуковой цепочки [источник -> анализатор -> выход]
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    // Сбрасываем статус воспроизведения
    isPlaying = false;

    console.log('Аудиофайл загружен:', file.name);
    return true;

    /* 
    Вся цепочка одним взглядом:
    Файл → Временная ссылка → Audio элемент → Источник → Анализатор → Колонки
    */
}

// Запуск воспроизведения
export async function playAudio() {
    if (!audioElement) {
        throw new Error('Аудиофайл не загружен');
    }

    // Возобновляем воспроизведение после Паузы
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    // Начинаем проигрывание аудио файла
    try {
        await audioElement.play();
        isPlaying = true;
        console.log('Воспроизведение начато');
    } catch (error) {
        // Браузер сам скажет, если формат файла не поддерживается
        console.error('Ошибка воспроизведения:', error);

        // Более понятное сообщение для пользователя
        let userMessage = 'Не удалось воспроизвести файл';
        if (error.name === 'NotSupportedError') {
            userMessage = 'Формат файла не поддерживается вашим браузером';
        } else if (error.name === 'NotAllowedError') {
            userMessage = 'Воспроизведение заблокировано браузером';
        }

        throw new Error(userMessage);
    }
}

// Пауза воспроизведения (работает мгновенно, не async)
export function pauseAudio() {
    if (audioElement) {
        audioElement.pause();
        isPlaying = false;
        console.log('Воспроизведение приостановлено');
    }
}

// Геттер для получения существующего анализатора (analyzer или null)
export function getAnalyser() {
    return analyser;
}

// Функция для проверки статуса воспроизведения (true или false)
export function getIsPlaying() {
    return isPlaying;
}

// Функция для получения audio элемента (пока не использовали)
// (полезно для получения дополнительной информации о треке и т.п.)
export function getAudioElement() {
    // Возвращает ссылку на HTML5 audio элемент
    return audioElement;
}

// *** Для Андроид TV ***
export async function loadAudioFromUrl(url, fileName = 'Online Audio') {
    try {
        console.log('Loading audio from URL:', url);

        // Останавливаем текущее воспроизведение
        if (window.audioContext) {
            await pauseAudio();
        }

        // Создаем новый AudioContext если нужно
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext ||
                window.webkitAudioContext)();
            window.audioElement = new Audio();
        }

        // Загружаем аудио по URL
        window.audioElement.src = url;
        window.audioElement.crossOrigin = 'anonymous';

        // Ждем загрузки метаданных
        await new Promise((resolve, reject) => {
            window.audioElement.addEventListener('loadedmetadata', resolve);
            window.audioElement.addEventListener('error', reject);
        });

        // Подключаем к Web Audio API
        const source = window.audioContext.createMediaElementSource(
            window.audioElement
        );
        window.analyser = window.audioContext.createAnalyser();
        window.analyser.fftSize = 256;

        source.connect(window.analyser);
        window.analyser.connect(window.audioContext.destination);

        console.log('Audio loaded successfully from URL');
        return true;
    } catch (error) {
        console.error('Error loading audio from URL:', error);
        throw new Error(`Failed to load audio: ${error.message}`);
    }
}
