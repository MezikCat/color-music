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
        url: 'https://dw2.hitmos.fm/L21wMy83MzMzMjY4L05laWtlZCwgUG9ydHVnYWwuIFRoZSBNYW4gLSBHbGlkZSAoaGl0bW9zLmZtKS5tcDM=.mp3',
        description: 'Ритмичный электронный бит',
    },
    {
        name: 'Джазовый саксофон',
        url: 'https://dw2.hitmos.fm/L21wMy84MDk0ODQxL0F2YSBNYXggLSBEb24ndCBDbGljayBQbGF5IChoaXRtb3MuZm0pLm1wMw==.mp3',
        description: 'Мягкий джазовый саунд',
    },
    {
        nmae: 'Шансон',
        url: 'https://s2dw.pesni.fm/L3RyYWNrLzE5MzEyNzE3L01hZ2FzIC0g0KHQvtGI0LXQuyDRgSDRg9C80LAgKHBlc25pLmZtKS5tcDM=.mp3',
        description: 'Мягкий джазовый саунд',
    },
];

// Создаем интерфейс выбора треков
function createTrackSelector() {
    const selector = document.createElement('div');
    selector.className = 'track-selector';
    selector.innerHTML = `
        <div style="background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: white; margin-bottom: 15px;">🎵 Выберите демо-трек</h3>
            <div id="demoTracksList" style="display: flex; flex-direction: column; gap: 10px;">
                ${DEMO_TRACKS.map(
                    (track, index) => `
                    <button class="demo-track-btn" 
                            data-url="${track.url}"
                            data-name="${track.name}"
                            style="padding: 12px; background: #333; color: white; border: 1px solid #555; border-radius: 5px; text-align: left;">
                        <strong>${track.name}</strong>
                        <br><small style="opacity: 0.7;">${track.description}</small>
                    </button>
                `
                ).join('')}
            </div>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #555;">
                <h4 style="color: white; margin-bottom: 10px;">🔗 Или введите свою ссылку</h4>
                <input type="text" id="customUrl" placeholder="https://example.com/audio.mp3" 
                       style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <button id="loadCustomUrl" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px;">
                    Загрузить по ссылке
                </button>
            </div>
        </div>
    `;

    // Вставляем перед кнопками управления
    const controls = document.querySelector('.file-button').parentNode;
    controls.parentNode.insertBefore(selector, controls);

    setupTrackSelectorEvents();
}

// Настраиваем обработчики событий
function setupTrackSelectorEvents() {
    // Кнопки демо-треков
    document.querySelectorAll('.demo-track-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
            const url = btn.dataset.url;
            const name = btn.dataset.name;
            await loadTrackFromUrl(url, name);
        });

        // Для TV добавляем поддержку фокуса
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // Загрузка по кастомной ссылке
    document
        .getElementById('loadCustomUrl')
        .addEventListener('click', async () => {
            const url = document.getElementById('customUrl').value.trim();
            if (!url) {
                alert('Введите ссылку на аудио файл');
                return;
            }

            if (!url.startsWith('http')) {
                alert('Ссылка должна начинаться с http:// или https://');
                return;
            }

            await loadTrackFromUrl(url, 'Custom Track');
        });
}

// Функция загрузки трека по URL
async function loadTrackFromUrl(url, trackName) {
    try {
        fileButton.textContent = 'Loading...';
        fileButton.disabled = true;

        console.log('Loading track:', trackName, url);

        // Загружаем аудио по URL
        await loadAudioFromUrl(url, trackName);

        // Обновляем интерфейс
        fileButton.classList.add('has-file');
        fileButton.textContent =
            trackName.length > 20
                ? trackName.substring(0, 17) + '...'
                : trackName;

        console.log('Track loaded successfully');

        // Автоматически запускаем визуализатор (опционально)
        setTimeout(() => {
            initPixiVisualizer();
        }, 500);
    } catch (error) {
        console.error('Error loading track:', error);
        fileButton.classList.remove('has-file');
        fileButton.textContent = 'Choose Audio File';
        alert('Ошибка загрузки: ' + error.message);
    } finally {
        fileButton.disabled = false;
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    createTrackSelector();

    // Скрываем оригинальный file input на TV
    if (/TV|Android.*TV/i.test(navigator.userAgent)) {
        fileInput.style.display = 'none';
        fileButton.style.display = 'none'; // или оставить как fallback
    }
});
// ----------------------------------------------------------
