import {
    loadAudioFile,
    playAudio,
    pauseAudio,
    stopAudio,
    getIsPlaying,
} from './audioManager.js';
import { validateAudioFiles } from './audioValidator.js';
import {
    initPixiVisualizer,
    stopPixiVisualizer,
    setPixiProfile,
    setAdaptiveSensitivity,
} from './pixiVisualizer.js';
import { playlistState } from './playlistState.js';

// Получаем DOM элементы
const fileButton = document.querySelector('.file-button');
const fileInput = document.getElementById('audioFile');
const playButton = document.querySelector('.btnPlay');
const pauseButton = document.querySelector('.btnPause');
const stopButton = document.querySelector('.btnStop');
const canvas = document.getElementById('canvas');
const adaptiveToggle = document.getElementById('adaptiveToggle');
const profileSelect = document.getElementById('profileSelect');

// Колбэк для автоматического перехода к следующему треку
const handleTrackEnd = async () => {
    console.log('🎵 Трек завершен, проверяем следующий...');

    const playlistInfo = playlistState.getPlaylistInfo();

    if (playlistInfo.hasNext) {
        // Переходим к следующему треку
        playlistState.nextTrack();
        const nextFile = playlistState.getCurrentTrack();

        try {
            // Рекурсивно передаем тот же колбэк для цепочки воспроизведения
            await loadAudioFile(nextFile, handleTrackEnd);
            await playAudio();
            console.log('✅ Автопереход выполнен');
        } catch (error) {
            console.error('❌ Ошибка автоперехода:', error);
            // Пробуем следующий трек через секунду
            setTimeout(handleTrackEnd, 1000);
        }
    } else {
        console.log('🏁 Плейлист завершен');
        // Можно добавить логику повторения плейлиста
    }
};

// Обработчик переключателя "Auto Sense"
adaptiveToggle.addEventListener('change', (e) => {
    const enabled = e.target.checked;
    setAdaptiveSensitivity(enabled);
    console.log(`Адаптивная чувствительность: ${enabled ? 'ВКЛ' : 'ВЫКЛ'}`);
});

// Обработчик выбора звуковых профилей
profileSelect.addEventListener('change', (e) => {
    const profileName = e.target.value;
    setPixiProfile(profileName);
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
// Обработчик для Android TV
fileButton.addEventListener('touchend', async (e) => {
    e.preventDefault();

    try {
        fileButton.textContent = 'Loading...';
        fileButton.disabled = true;

        // Создаем фиктивный File объект
        const fakeFile = await createFakeFile(
            './audio/track1.mp3',
            'track1.mp3'
        );

        // Используем модуль состояния даже для одиночного файла
        playlistState.setPlaylist([fakeFile]);
        await loadAudioFile(fakeFile); // Без колбэка - одиночный файл

        fileButton.textContent = 'Demo Track';
        alert('Файл успешно загружен');

        // Инициализируем визуализатор и играем файл
        initPixiVisualizer();
        await playAudio();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        fileButton.textContent = 'Choose Audio File';
        alert('Ошибка загрузки файла');
    } finally {
        fileButton.disabled = false;
    }
});

// Функция создания фиктивного File объекта
async function createFakeFile(url, fileName) {
    try {
        // Загружаем файл через fetch
        const response = await fetch(url);
        const blob = await response.blob();
        // Создаем File объект из blob
        return new File([blob], fileName, { type: 'audio/mp3' });
    } catch (error) {
        throw new Error('Не удалось загрузить файл: ' + error.message);
    }
}
//------------------------------------------------

// Обработчик выбора файла (кнопка "Choose Audio File")
fileInput.addEventListener('change', async (event) => {
    // Массив выбранных файлов(а) из FileList объекта
    const files = Array.from(event.target.files);
    // Проверка на соответствие files аудио формату и прочим требованиям
    const validFiles = validateAudioFiles(files);

    console.log(`Из ${files.length} файлов валидны: ${validFiles.length}`);

    // Если нет валидных файлов
    if (validFiles.length === 0) {
        alert('Нет подходящих аудиофайлов для загрузки');
        return;
    }

    try {
        // Показываем загрузку на кнопке
        fileButton.textContent = 'Loading...';
        fileButton.disabled = true;

        // Сохраняем все валидные файлы в плейлист модуля состояния
        const audioFiles = validFiles.map((item) => item.file);
        playlistState.setPlaylist(audioFiles);

        console.log(`Плейлист создан: ${audioFiles.length} треков`);

        // Загружаем первый трек с колбеком для автоперехода
        const firstTrack = playlistState.getCurrentTrack();
        await loadAudioFile(firstTrack, handleTrackEnd);

        // Обновляем кнопку - показываем количество треков
        fileButton.classList.add('has-file');
        // Если есть плейлист (выбрано больше одного файла)
        if (audioFiles.length > 1) {
            fileButton.textContent = `Playlist: ${audioFiles.length} tracks`;
        } else {
            // При выборе одного файла
            const fileName =
                firstTrack.name.length > 20
                    ? firstTrack.name.substring(0, 17) + '...'
                    : firstTrack.name;
            fileButton.textContent = fileName;
        }

        // Инициализируем визуализатор (пока потухшие прожекторы) !!!
        initPixiVisualizer();

        console.log('Плейлист готов к воспроизведению');
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
        console.log('Воспроизведение запущено');
    } catch (error) {
        alert(error.message);
    }
});

// Обработчик нажатия на кнопку "Pause"
pauseButton.addEventListener('click', () => {
    // Без try/catch - потому что функция безопасная (не бросает ошибки)
    // Без await - потому что пауза происходит мгновенно
    pauseAudio();
    // Остановка визуализации
    stopPixiVisualizer();
    console.log('Пауза (можно продолжить с этого места)');
});

// Обработчик Stop (добавляем после обработчика Pause)
stopButton.addEventListener('click', () => {
    // Останавливаем аудио
    stopAudio();
    // Останавливаем визуализацию
    stopPixiVisualizer();

    // Сбрасываем плейлист на первый трек
    if (playlistState.getPlaylistInfo().total > 0) {
        playlistState.goToTrack(0);
        console.log('Плейлист сброшен на первый трек');
    }

    // Визуальная обратная связь
    stopButton.style.opacity = '0.6';
    setTimeout(() => {
        stopButton.style.opacity = '1';
    }, 200);

    console.log('Полная остановка выполнена');
});

// Пауза воспроизведения при скрытии вкладки браузера (экономия ресурсов)
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        pauseAudio();
        stopPixiVisualizer();
    }
});

// Глобальный доступ для отладки
window.playlistState = playlistState;

// Финальное сообщение об успешной загрузке приложения
console.log('Приложение инициализировано');
