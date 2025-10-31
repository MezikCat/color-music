// ***************************************************
// ***** МОДУЛЬ АДАПТИВНОГО ПРОЦЕССОРА, функции: *****
// *  [1] Динамическая коррекция чувствительности    *
// *  [2] Автоматическая адаптация к громкости       *
// *  [3] Более равномерная визуализация             *
// ***************************************************

// Модуль адаптивной подстройки чувствительности
export class AdaptiveSensitivity {
    constructor(numBands, options = {}) {
        this.numBands = numBands;

        // Настройки
        this.targetPeak = options.targetPeak || 0.85; // Целевой пик (85%)
        this.adaptationSpeed = options.adaptationSpeed || 0.05; // Скорость адаптации
        this.noiseFloor = options.noiseFloor || 0.05; // Порог шума
        this.maxSensitivity = options.maxSensitivity || 2.0; // Макс. чувствительность
        this.minSensitivity = options.minSensitivity || 0.1; // Мин. чувствительность

        // Состояние для каждой полосы
        this.bands = Array(numBands)
            .fill()
            .map(() => ({
                currentSensitivity: 1.0,
                peakHistory: [],
                averageLevel: 0,
                adaptationCounter: 0,
            }));

        this.frameCount = 0;
    }

    // Основной метод обработки
    processFrame(rawIntensities) {
        this.frameCount++;

        return rawIntensities.map((rawIntensity, bandIndex) => {
            const band = this.bands[bandIndex];

            // 1. ОБНОВЛЯЕМ СРЕДНИЙ УРОВЕНЬ
            this.updateAverageLevel(band, rawIntensity);

            // 2. ОБНОВЛЯЕМ ИСТОРИЮ ПИКОВ
            this.updatePeakHistory(band, rawIntensity);

            // 3. ПРОВЕРЯЕМ НЕОБХОДИМОСТЬ ПОДСТРОЙКИ (каждые 10 кадров)
            if (this.frameCount % 10 === 0) {
                this.adaptSensitivity(band, bandIndex);
            }

            // 4. ПРИМЕНЯЕМ ТЕКУЩУЮ ЧУВСТВИТЕЛЬНОСТЬ
            const adjustedIntensity = rawIntensity * band.currentSensitivity;

            // 5. SOFT CLIPPING для предотвращения клиппинга
            return this.softClip(adjustedIntensity);
        });
    }

    updateAverageLevel(band, rawIntensity) {
        // Экспоненциальное скользящее среднее
        const alpha = 0.1;
        band.averageLevel =
            alpha * rawIntensity + (1 - alpha) * band.averageLevel;
    }

    updatePeakHistory(band, rawIntensity) {
        // Добавляем текущее значение в историю
        band.peakHistory.push(rawIntensity);

        // Держим только последние 30 кадров (~0.5 секунды)
        if (band.peakHistory.length > 30) {
            band.peakHistory.shift();
        }
    }

    adaptSensitivity(band, bandIndex) {
        if (band.peakHistory.length === 0) return;

        // Находим максимальный пик за последние 0.5 секунды
        const recentPeak = Math.max(...band.peakHistory);

        // Если сигнал выше порога шума
        if (recentPeak > this.noiseFloor) {
            // Вычисляем насколько далеки от целевого пика
            const currentPeak = recentPeak * band.currentSensitivity;
            const ratio = this.targetPeak / currentPeak;

            // Плавная корректировка чувствительности
            const newSensitivity =
                band.currentSensitivity *
                (1 + this.adaptationSpeed * (ratio - 1));

            // Ограничиваем диапазон
            band.currentSensitivity = Math.max(
                this.minSensitivity,
                Math.min(this.maxSensitivity, newSensitivity)
            );
        }
    }

    softClip(value) {
        // Мягкое ограничение - плавное сжатие выше 0.9
        if (value > 0.9) {
            return 0.9 + (value - 0.9) * 0.3; // Сильное сжатие пиков
        }
        return Math.min(1.0, value);
    }

    // Методы для отладки
    getBandInfo(bandIndex) {
        const band = this.bands[bandIndex];
        return {
            sensitivity: band.currentSensitivity,
            averageLevel: band.averageLevel,
            recentPeak:
                band.peakHistory.length > 0 ? Math.max(...band.peakHistory) : 0,
        };
    }

    reset() {
        this.bands.forEach((band) => {
            band.currentSensitivity = 1.0;
            band.peakHistory = [];
            band.averageLevel = 0;
        });
        this.frameCount = 0;
    }
}
