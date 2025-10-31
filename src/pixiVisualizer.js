//import * as PIXI from 'pixi.js';
//import * as PIXI from 'https://cdn.jsdelivr.net/npm/pixi.js@7.3.3/dist/pixi.min.js';

import { getAnalyser } from './audioManager.js';
import { PROFILES } from './frequencyProfiles.js';
import { AdaptiveSensitivity } from './adaptiveSensitivity.js';

let PIXI = null; // Модуль PixiJS
let app; // Приложение PIXI
let spotlights = []; // массив прожекторов
let currentBands = PROFILES.DEFAULT; // Частотный профиль по умолчанию
let frequencyData; // Типизированный массив частот для анализа звука
let adaptiveProcessor; // Процессор для управления адаптивной чувствительностью
// Флаг управления адаптивной чувствительностью
let useAdaptiveSensitivity = false;

// ФУНКЦИЯ ДЛЯ АСИНХРОННОЙ ЗАГРУЗКИ PIXIJS
async function loadPixiJS() {
    return new Promise((resolve, reject) => {
        if (window.PIXI) {
            PIXI = window.PIXI;
            resolve(PIXI);
            return;
        }

        const script = document.createElement('script');
        script.src =
            'https://cdn.jsdelivr.net/npm/pixi.js@7.3.3/dist/pixi.min.js';

        script.onload = () => {
            PIXI = window.PIXI;
            console.log('PIXI загружен');
            resolve(PIXI);
        };

        script.onerror = reject;
        document.head.appendChild(script);
    });
}

export async function initPixiVisualizer() {
    console.log('Инициализация PixiJS визуализатора...');

    try {
        // Убеждаемся, что PIXI загружен
        if (!PIXI) {
            await loadPixiJS();
        }

        // Останавливаем предыдущую визуализацию
        stopPixiVisualizer();

        // Создаем отдельный canvas для PixiJS
        const pixiCanvas = document.createElement('canvas');
        pixiCanvas.width = window.innerWidth;
        pixiCanvas.height = window.innerHeight - 100;
        pixiCanvas.style.position = 'fixed';
        pixiCanvas.style.top = '0';
        pixiCanvas.style.left = '0';
        pixiCanvas.style.zIndex = '1000';
        pixiCanvas.id = 'pixi-visualizer';
        document.body.appendChild(pixiCanvas);

        // Создаем PixiJS приложение
        app = new PIXI.Application({
            view: pixiCanvas, // v7: view вместо canvas
            width: pixiCanvas.width,
            height: pixiCanvas.height,
            backgroundColor: 0x000000, // черный фон
            antialias: true,
            backgroundAlpha: 1, // непрозрачный фон
            autoDensity: true,
            resolution: window.devicePixelRatio || 1, // для четкости
        });

        console.log('PixiJS приложение создано');
        console.log('Renderer:', app.renderer.type);

        // Инициализируем аудиоанализатор
        const analyser = getAnalyser();
        if (!analyser) {
            console.error('Анализатор не найден');
            return false;
        }

        // Создаем массив для данных частот
        const bufferLength = analyser.frequencyBinCount;
        frequencyData = new Uint8Array(bufferLength);
        console.log('Анализатор настроен, bufferLength:', bufferLength);

        // Создаем прожекторы
        createSpotlights();
        // Обработчик изменения размеров окна
        window.addEventListener('resize', handleResize);

        // Запускаем анимацию
        app.ticker.add(animate);
        console.log('Анимация запущена');

        return true;
    } catch (error) {
        console.error('Ошибка инициализации PixiJS:', error);
        return false;
    }
}

// Точка управления режимом адаптивной чуствительности
export function setAdaptiveSensitivity(enabled) {
    useAdaptiveSensitivity = enabled;

    if (enabled && !adaptiveProcessor) {
        // Инициализация при первом включении
        adaptiveProcessor = new AdaptiveSensitivity(currentBands.bands.length, {
            targetPeak: 0.8,
            adaptationSpeed: 0.03,
            noiseFloor: 0.02,
            maxSensitivity: 3.0,
            minSensitivity: 0.2,
        });
        console.log('Адаптивная чувствительность ВКЛЮЧЕНА');
    } else if (!enabled && adaptiveProcessor) {
        adaptiveProcessor.reset();
        console.log('Адаптивная чувствительность ВЫКЛЮЧЕНА');
    }
}

function createSpotlights() {
    console.log('Создаем РЕАЛИСТИЧНЫЕ прожекторы с градиентами...');

    // Очищаем старые прожекторы
    spotlights.forEach((spotlight) => spotlight.destroy());
    spotlights = [];

    // Число частотных полос из профиля
    const totalBands = currentBands.bands.length;
    // расстояние между прожекторами
    const gap = 20;
    // Расчет радиуса и координаты прожектора в зависимости от размера экрана
    const availableWidth = app.screen.width - gap * (totalBands - 1);
    const spotDiameter = availableWidth / totalBands;
    const spotRadius = spotDiameter / 2;
    const centerY = app.screen.height / 2; // координата Y прожектора

    // Темный фон
    createDarkBackground();

    // Обходим все прожекторы (кол.прожекторов = числу полос из профиля)
    currentBands.bands.forEach((band, index) => {
        // Координата X прожектора
        const centerX = (spotDiameter + gap) * index + spotRadius;

        // Создаем PIXI контейнер для прожектора
        const spotlight = new PIXI.Container();
        spotlight.x = centerX;
        spotlight.y = centerY;
        spotlight.band = band;

        // ******* Свойства прожектора для перетаскивания мышью *******
        spotlight.dragged = false; // Флаг состояния перетаскивания
        // Смещение точки клика относительно центра прожектора
        spotlight.offsetX = 0;
        spotlight.offsetY = 0;
        // Включаем интерактивность (для обработки событий мыши для этого объекта)
        spotlight.interactive = true;
        // Курсор-указатель при наведении
        spotlight.buttonMode = true;
        // Область клика
        spotlight.hitArea = new PIXI.Circle(0, 0, spotRadius * 1.5);
        // ************************************************************

        // Обработчики событий на прожекторах
        spotlight
            // При нажатии кнопки мыши
            .on('mousedown', onSpotlightDragStart)
            // При перемещении мыши (будет работать только при зажатой кнопке)
            .on('mousemove', onSpotlightDragMove)
            // При отпускании кнопки мыши
            .on('mouseup', onSpotlightDragEnd)
            // Если отпустили вне объекта
            .on('mouseupoutside', onSpotlightDragEnd);

        // *********** Версия с одним контейнером *************
        // 1. Создаем текстуру с градиентом
        const gradientTexture = createGradientTexture(spotRadius, band.color);

        // 2. Создаем PIXI Sprite с градиентом (тело прожектора)
        const gradientSprite = new PIXI.Sprite(gradientTexture);
        gradientSprite.anchor.set(0.5);
        gradientSprite.width = spotDiameter;
        gradientSprite.height = spotDiameter;

        // 3. Внешнее свечение прожектора
        // Создаем фильтр с контролем качества
        const glowBlur = new PIXI.BlurFilter();
        glowBlur.blur = 100; //8;
        glowBlur.quality = 20; //4;
        glowBlur.repeatEdgePixels = false;

        // Тело свечения
        const glow = new PIXI.Graphics();
        glow.beginFill(hexToNumber(band.color));
        glow.drawCircle(0, 0, spotRadius * 1.3);
        glow.endFill();
        glow.alpha = 0.3;
        glow.filters = [glowBlur];

        // 4. Текст из профиля
        const text = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: '#ffffff',
            align: 'center',
            fontWeight: 'bold',
        });
        text.anchor.set(0.5);
        text.y = spotRadius * 1.8;

        // 5. Создаем лучи света
        const rays = createLightRays(spotRadius, band.color);

        // Собираем прожектор
        spotlight.addChild(glow); // Внешнее свечение
        spotlight.addChild(gradientSprite); // Градиентный спрайт
        spotlight.addChild(rays); // Лучи
        spotlight.addChild(text); // Текст

        // Сохраняем ссылки
        spotlight.gradientSprite = gradientSprite;
        spotlight.glow = glow;
        spotlight.rays = rays;
        spotlight.text = text;

        // Помещаем прожектор на сцену для отрисовки
        app.stage.addChild(spotlight);
        // Добавляем прожектор в массив прожекторов
        spotlights.push(spotlight);
    });

    console.log('Прожекторы с радиальным градиентом созданы');
}

// Создание радиального градиента из canvas
function createGradientTexture(radius, color) {
    // Создаем временный canvas для градиента
    const canvas = document.createElement('canvas');
    const size = radius * 2;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Создаем радиальный градиент
    const gradient = ctx.createRadialGradient(
        radius,
        radius,
        0, // Начальный круг (центр)
        radius,
        radius,
        radius // Конечный круг (край)
    );

    const hexColor = color.replace('#', '');
    // Формируем плавную прозрачность тела прожектора
    gradient.addColorStop(0, `#${hexColor}FF`); // центр: непрозрачный
    gradient.addColorStop(0.1, `#${hexColor}FF`); // 10%: все еще непрозрачный
    gradient.addColorStop(0.2, `#${hexColor}EE`); // 20%: почти непрозрачный
    gradient.addColorStop(0.4, `#${hexColor}AA`); // 40%: хорошо видимый
    gradient.addColorStop(0.7, `#${hexColor}55`); // 70%: полупрозрачный
    gradient.addColorStop(0.9, `#${hexColor}22`); // 90%: почти прозрачный
    gradient.addColorStop(1, `#${hexColor}00`); // край: полностью прозрачный

    // Рисуем градиент
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Создаем текстуру из canvas
    return PIXI.Texture.from(canvas);
}

// Создание лучей
function createLightRays(radius, color) {
    // Контейнер для лучей
    const raysContainer = new PIXI.Container();

    // Обходим все лучи
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;

        const ray = new PIXI.Graphics();
        // Создаем фильтр с контролем качества
        const rayBlur = new PIXI.BlurFilter();
        rayBlur.blur = 8;
        rayBlur.quality = 4;
        rayBlur.repeatEdgePixels = false;

        // Рисуем луч
        ray.beginFill(hexToNumber(color));
        ray.moveTo(0, 0);
        ray.lineTo(
            Math.cos(angle) * radius * 0.5,
            Math.sin(angle) * radius * 0.5
        );
        ray.lineTo(
            Math.cos(angle + 0.15) * radius * 2.0,
            Math.sin(angle + 0.15) * radius * 2.0
        );
        ray.lineTo(
            Math.cos(angle - 0.15) * radius * 2.0,
            Math.sin(angle - 0.15) * radius * 2.0
        );
        ray.closePath();
        ray.endFill();

        ray.alpha = 0.2;
        ray.filters = [rayBlur];
        // Добавляем луч в контейнер лучей
        raysContainer.addChild(ray);
    }

    return raysContainer;
}

// Создание фона экрана
function createDarkBackground() {
    // Удаляем старый фон
    const oldBackground = app.stage.getChildByName('background');
    if (oldBackground) oldBackground.destroy();

    // Темный градиентный фон
    const background = new PIXI.Graphics();
    background.name = 'background';

    // Градиент от черного к темно-синему
    background.beginFill(0x000011);
    background.drawRect(0, 0, app.screen.width, app.screen.height);
    background.endFill();

    app.stage.addChildAt(background, 0);
}

// Обработчик нажатия кнопки мыши
function onSpotlightDragStart(event) {
    const spotlight = event.currentTarget;

    // Сохраняем смещение курсора относительно центра прожектора
    spotlight.offsetX = event.data.global.x - spotlight.x;
    spotlight.offsetY = event.data.global.y - spotlight.y;

    // Устанавливаем флаг перетаскивания
    spotlight.dragged = true;

    // Поднимаем прожектор наверх (чтобы был поверх остальных)
    app.stage.removeChild(spotlight);
    app.stage.addChild(spotlight);

    // Визуальный эффект - уменьшаем прозрачность при перетаскивании
    spotlight.alpha = 0.8;

    console.log(`Начали перетаскивать прожектор "${spotlight.band.name}"`);
}

// Обработчик перемещения мыши (работает при зажатой кнопке)
function onSpotlightDragMove(event) {
    const spotlight = event.currentTarget;

    if (!spotlight.dragged) return; // Проверка на перетаскиваемость

    // Обновляем позицию с учетом смещения
    spotlight.x = event.data.global.x - spotlight.offsetX;
    spotlight.y = event.data.global.y - spotlight.offsetY;

    console.log(
        `Перемещаем прожектор "${spotlight.band.name}": ${spotlight.x.toFixed(
            0
        )}, ${spotlight.y.toFixed(0)}`
    );
}

// Обработчик отпускания кнопки мыши
function onSpotlightDragEnd(event) {
    const spotlight = event.currentTarget;

    if (!spotlight.dragged) return;

    // Сбрасываем флаг перетаскивания
    spotlight.dragged = false;
    // Восстанавливаем прозрачность
    spotlight.alpha = 1.0;

    console.log(`Завершили перетаскивание прожектора "${spotlight.band.name}"`);
}

// Анимация прожекторов
function animate() {
    const analyser = getAnalyser();
    if (!analyser || !frequencyData) return;

    // Подключаем массив частот к анализатору
    analyser.getByteFrequencyData(frequencyData);

    // Обходим все прожекторы
    spotlights.forEach((spotlight, index) => {
        // Получаем интенсивность свечения из профиля
        const intensity = getBandIntensity(spotlight.band.range);

        // Нелинейная шкала для внешнего свечения прожектора
        let glowIntensity;
        if (intensity <= 0.5) {
            // 1. до 50% громкости - пропорционально
            glowIntensity = intensity;
        } else if (intensity <= 0.8) {
            // 2. от 50% до 80% - коэффициент 1.3
            glowIntensity = 0.5 + (intensity - 0.5) * 1.3;
        } else {
            // 3. от 80% до 100% - коэффициент 1.6
            glowIntensity = 0.5 + 0.3 * 1.3 + (intensity - 0.8) * 1.6;
        }

        // Ограничиваем максимальное значение
        glowIntensity = Math.min(glowIntensity, 1.0);

        // ОСНОВНОЙ МАСШТАБ (для градиентного спрайта)
        const baseScale = 0.8 + intensity * 0.6;

        // АНИМАЦИЯ ГРАДИЕНТНОГО СПРАЙТА
        spotlight.gradientSprite.scale.set(baseScale);

        // АНИМАЦИЯ ВНЕШНЕГО СВЕЧЕНИЯ С НЕЛИНЕЙНОЙ ШКАЛОЙ
        const glowScale = 0.9 + glowIntensity * 0.8; // Больше диапазон для свечения
        spotlight.glow.scale.set(glowScale);
        spotlight.glow.alpha = 0.15 + glowIntensity * 0.5; // Ярче при высокой громкости

        // АНИМАЦИЯ ЛУЧЕЙ
        spotlight.rays.rotation += 0.005 * intensity;
        const raysIntensity = intensity > 0.7 ? glowIntensity : intensity * 0.7;
        spotlight.rays.alpha = 0.1 + raysIntensity * 0.3;
        spotlight.rays.scale.set(0.9 + intensity * 0.4);

        // ТЕКСТ
        const percent = Math.round(intensity * 100);
        spotlight.text.text = `${spotlight.band.name} ${percent}%`;
        spotlight.text.style.fill = intensity > 0.8 ? '#ffff00' : '#ffffff';
    });
}

// Получение интенсивности из профиля
function getBandIntensity([lowFreq, highFreq]) {
    const analyser = getAnalyser();
    if (!analyser || !frequencyData) return 0;

    const sampleRate = analyser.context.sampleRate;
    const dataLength = frequencyData.length;

    const startIndex = Math.floor((lowFreq / sampleRate) * dataLength * 2);
    const endIndex = Math.floor((highFreq / sampleRate) * dataLength * 2);

    let sum = 0;
    let count = 0;

    for (let i = startIndex; i < endIndex && i < dataLength; i++) {
        sum += frequencyData[i];
        count++;
    }

    const rawIntensity = count > 0 ? sum / count / 255 : 0;

    // ЕДИНОЕ МЕСТО ПЕРЕКЛЮЧЕНИЯ ЛОГИКИ адаптивного процессора
    if (useAdaptiveSensitivity && adaptiveProcessor) {
        // Адаптивная обработка
        const bandIndex = currentBands.bands.findIndex(
            (b) => b.range[0] === lowFreq && b.range[1] === highFreq
        );
        if (bandIndex !== -1) {
            // ПРИМЕНЯЕМ ПРОФИЛЬ К СЫРОМУ СИГНАЛУ
            const band = currentBands.bands[bandIndex];
            const profileAdjusted = rawIntensity * band.sensitivity;

            // АДАПТИВНАЯ КОРРЕКЦИЯ ПОВЕРХ ПРОФИЛЯ
            const adjustedIntensities = adaptiveProcessor.processFrame([
                profileAdjusted,
            ]);
            return adjustedIntensities[0];
        }
    } else {
        // Стандартная обработка (оригинальная логика, только профиль)
        const band = currentBands.bands.find(
            (b) => b.range[0] === lowFreq && b.range[1] === highFreq
        );
        const sensitivity = band ? band.sensitivity : 1;

        return Math.min(rawIntensity * sensitivity, 1);
    }

    return rawIntensity; // fallback
}

// Преобразование для работы с цветом в PIXI
function hexToNumber(hex) {
    return parseInt(hex.replace('#', '0x'));
}

// Остановка визуализации
export function stopPixiVisualizer() {
    console.log('Останавливаем PixiJS визуализатор...');

    if (app) {
        app.ticker.stop();
        app.destroy(true);
        app = null;
        console.log('PixiJS приложение остановлено');
    }

    const pixiCanvas = document.getElementById('pixi-visualizer');
    if (pixiCanvas) {
        pixiCanvas.remove();
        console.log('Canvas удален');
    }

    // СБРАСЫВАЕМ АДАПТИВНЫЙ ПРОЦЕССОР (без удаления)
    if (adaptiveProcessor) {
        adaptiveProcessor.reset();
    }

    // Очищаем переменные
    spotlights = [];
    frequencyData = null;
    console.log('PixiJS визуализатор полностью остановлен');
}

// Смена частотного профиля
export function setPixiProfile(profileName) {
    console.log('Меняем профиль на:', profileName);
    currentBands = PROFILES[profileName] || PROFILES.DEFAULT;
    if (app) {
        createSpotlights();
    }
}

// Перерисовка при изменении размеров окна
function handleResize() {
    if (!app) return;

    const pixiCanvas = document.getElementById('pixi-visualizer');
    if (!pixiCanvas) return;

    // СОХРАНЯЕМ ТЕКУЩИЕ ПОЗИЦИИ и РАЗМЕРЫ ПРОЖЕКТОРОВ
    const oldWidth = app.screen.width;
    const oldHeight = app.screen.height;
    const savedPositions = spotlights.map((spotlight) => ({
        band: spotlight.band,
        x: spotlight.x,
        y: spotlight.y,
        dragged: spotlight.dragged, // Сохраняем состояние перетаскивания
    }));

    // Обновляем размеры canvas
    pixiCanvas.width = window.innerWidth;
    pixiCanvas.height = window.innerHeight - 100;

    // Обновляем рендерер PixiJS
    app.renderer.resize(pixiCanvas.width, pixiCanvas.height);

    // Пересоздаем прожекторы с новыми размерами
    createSpotlights();

    // МАСШТАБИРУЕМ ПОЗИЦИИ ПРОПОРЦИОНАЛЬНО
    const scaleX = app.screen.width / oldWidth;
    const scaleY = app.screen.height / oldHeight;
    // ВОССТАНАВЛИВАЕМ ПОЗИЦИИ
    savedPositions.forEach((savedPos, index) => {
        if (index < spotlights.length) {
            spotlights[index].x = savedPos.x * scaleX;
            spotlights[index].y = savedPos.y * scaleY;
            spotlights[index].dragged = savedPos.dragged;
        }
    });

    console.log('PixiJS canvas resized:', pixiCanvas.width, pixiCanvas.height);
}

/*
// Глобальный доступ для отладки
window.pixiVisualizer = {
    init: initPixiVisualizer,
    stop: stopPixiVisualizer,
    setProfile: setPixiProfile,
    setAdaptiveSensitivity: setAdaptiveSensitivity, // ← НОВАЯ ФУНКЦИЯ
    getSpotlights: () => spotlights,
    getApp: () => app,
    getAdaptiveState: () => ({
        enabled: useAdaptiveSensitivity,
        processor: adaptiveProcessor,
    }),
};
*/

/*
Для UI потом просто нужно будет вызывать setAdaptiveSensitivity(true/false)
- вся логика инкапсулирована!
*/
/*
Итоговый поток данных:
Сырая интенсивность → Условие → Адаптивная/Стандартная обработка → Результат
*/
