import {
    loadAudioFile,
    loadAudioFromUrl,
    playAudio,
    pauseAudio,
    getIsPlaying,
} from './audioManager.js';
import { validateAudioFile } from './audioValidator.js';
import {
    initPixiVisualizer,
    stopPixiVisualizer,
    setPixiProfile,
    setAdaptiveSensitivity,
} from './pixiVisualizer.js';

// Получаем DOM элементы
const fileButton = document.querySelector('.file-button');
const fileInput = document.getElementById('audioFile');
const playButton = document.querySelector('.btnPlay');
const pauseButton = document.querySelector('.btnPause');
const canvas = document.getElementById('canvas');
const adaptiveToggle = document.getElementById('adaptiveToggle');
const profileSelect = document.getElementById('profileSelect');

// Обработчик переключателя "Auto Sense"
adaptiveToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    setAdaptiveSensitivity(enabled);

    // Для контроля
    console.log(`Адаптивная чувствительность: ${enabled ? 'ВКЛ' : 'ВЫКЛ'}`);
});

// Обработчик выбора звуковых профилей
profileSelect.addEventListener('change', (e) => {
    const profileName = e.target.value;
    setPixiProfile(profileName);

    // Для контроля
    console.log(`Установлен профиль: ${profileName}`);
});

// Настраиваем Canvas
function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 100; // минус место для кнопок
    console.log('setup canvas run');
}

// Вызываем при загрузке и ресайзе окна браузера
window.addEventListener('resize', setupCanvas);
setupCanvas();

//------------------------------------------------
// И для touch
fileButton.addEventListener('touchend', (e) => {
    alert('TV touch');
    e.preventDefault();
});

//------------------------------------------------

// Обработчик выбора файла (кнопка "Choose Audio File")
fileInput.addEventListener('change', async (event) => {
    // Получение первого выбранного файла из события
    const file = event.target.files[0];

    // Проверка на соответствие file аудио формату
    const validation = validateAudioFile(file);
    if (!validation.isValid) {
        alert(validation.error);
        fileInput.value = '';
        return;
    }

    try {
        // Показываем загрузку на кнопке
        fileButton.textContent = 'Loading...';
        fileButton.disabled = true;
        console.log('Загрузка файла...');

        // Вызов асинхронной функции загрузки аудиофайла
        await loadAudioFile(file);

        // Показываем имя файла в кнопке "Choose Audio File"
        fileButton.classList.add('has-file'); // стилизация элемента input
        // Обрезаем длинные названия файлов
        const fileName =
            file.name.length > 20
                ? file.name.substring(0, 17) + '...'
                : file.name;
        fileButton.textContent = fileName;
        console.log('Файл успешно обработан');

        // Инициализируем визуализатор (пока потухшие прожекторы) !!!
        initPixiVisualizer();
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        fileButton.classList.remove('has-file'); // убираем стилизацию элемента input
        fileButton.textContent = 'Choose Audio File';
    } finally {
        // Всегда снимаем блокировку
        fileButton.disabled = false;
    }
});

// Обработчик нажатия на кнопку "Play"
playButton.addEventListener('click', async () => {
    // Проверка на повторное нажатие, если уже играет файл
    if (getIsPlaying()) {
        // Мигание кнопки для обратной связи
        playButton.style.opacity = '0.5';
        setTimeout(() => {
            playButton.style.opacity = '1';
        }, 200);
        return;
    }

    try {
        // Запускаем воспроизведение аудио файла
        await playAudio();
        // Инициализируем визуализатор (пошла динамика) !!!
        initPixiVisualizer();
    } catch (error) {
        // Если аудио не загружено, предлагаем выбрать трек
        if (
            error.message.includes('load') ||
            error.message.includes('source')
        ) {
            alert('Сначала выберите аудио трек из списка выше');
        } else {
            alert(error.message);
        }
    }
});

// Обработчик нажатия на кнопку "Pause"
pauseButton.addEventListener('click', () => {
    // Без try/catch - потому что функция безопасная (не бросает ошибки)
    // Без await - потому что пауза происходит мгновенно
    pauseAudio();
    // Остановка визуализации
    stopPixiVisualizer();
});

// Пауза воспроизведения при скрытии вкладки браузера (экономия ресурсов)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseAudio();
        stopPixiVisualizer();
    }
});

// Финальное сообщение об успешной загрузке приложения
console.log('Приложение инициализировано');

//--------------------------------------
// Демо-треки с прямыми ссылками
const DEMO_TRACKS = [
    {
        name: 'Электронная музыка (бит)',
        url: './audio/track1.mp3',
        description: 'Ритмичный электронный бит',
    },
];

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    createLocalTrackSelector();
    setupEventListeners();
});

// Создаем выбор треков
function createLocalTrackSelector() {
    const selector = document.createElement('div');
    selector.innerHTML = `
        <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: white; margin-bottom: 15px;">🎵 Выберите трек</h3>
            <div id="localTracksList" style="display: flex; flex-direction: column; gap: 10px;">
                ${DEMO_TRACKS.map(
                    (track) => `
                    <button class="local-track-btn" data-url="${track.url}"
                            style="padding: 15px; background: #333; color: white; border: 1px solid #555; border-radius: 8px;">
                        <strong>${track.name}</strong>
                        <div style="font-size: 12px; opacity: 0.7;">${track.description}</div>
                    </button>
                `
                ).join('')}
            </div>
        </div>
    `;

    document.body.insertBefore(selector, document.body.firstChild);

    // Обработчики треков
    document.querySelectorAll('.local-track-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            await loadLocalTrack(
                btn.dataset.url,
                btn.querySelector('strong').textContent
            );
        });
    });
}

// Загрузка трека
async function loadLocalTrack(url, name) {
    try {
        await loadAudioFromUrl(url, name);
        console.log('Трек загружен:', name);
    } catch (error) {
        alert('Ошибка загрузки: ' + error.message);
    }
}

// Обработчики событий
function setupEventListeners() {
    // Play
    fileButton.addEventListener('touchend', async () => {
        if (getIsPlaying()) return;
        try {
            await playAudio();
            initPixiVisualizer();
        } catch (error) {
            alert('Сначала выберите трек');
        }
    });
}
// ----------------------------------------------------------
