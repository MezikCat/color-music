// ************************** ПРОФИЛИ ******************************
// ***** соответствие частоты звука (Гц) - цвету визуализации  *****
// ***** и чувствительность диапазона для разных типов музыки  *****
// *****************************************************************

export const PROFILES = {
    // Профиль по умолчанию (чувствительность у всех полос = 1)
    DEFAULT: {
        label: 'По умолчанию',
        bands: [
            // 0-60 Гц: Суб-бас (бочка, бас-синth) - самая мощная часть
            {
                range: [0, 60],
                color: '#8B0000',
                name: 'Sub Bass',
                sensitivity: 1,
            },
            // 60-120 Гц: Основной бас (электрическая бас-гитара)
            {
                range: [60, 120],
                color: '#FF0000',
                name: 'Bass',
                sensitivity: 1,
            },
            // 120-200 Гц: Вторые и третьи гармоники басовых (высокие гармоники баса)
            {
                range: [120, 200],
                color: '#FF4500',
                name: 'Bass Harmonics',
                sensitivity: 1,
            },
            // ОСТАЛЬНЫЕ ДИАПАЗОНЫ
            {
                range: [200, 800],
                color: '#FFD700',
                name: 'Low-Mid',
                sensitivity: 1,
            },
            {
                range: [800, 3500],
                color: '#32CD32',
                name: 'Mid',
                sensitivity: 1,
            },
            {
                range: [3500, 22050],
                color: '#1E90FF',
                name: 'High',
                sensitivity: 1,
            },
        ],
    },

    // Профиль - рок музыка
    ROCK: {
        label: 'Рок',
        bands: [
            {
                range: [0, 60],
                color: '#8B0000',
                name: 'Kick',
                sensitivity: 0.4,
            },
            {
                range: [60, 120],
                color: '#FF0000',
                name: 'Bass Guitar',
                sensitivity: 0.6,
            },
            {
                range: [120, 200],
                color: '#FF4500',
                name: 'Low Tom',
                sensitivity: 0.7,
            },
            {
                range: [200, 800],
                color: '#FFD700',
                name: 'Rhythm Guitar',
                sensitivity: 0.9,
            },
            {
                range: [800, 3500],
                color: '#32CD32',
                name: 'Vocals',
                sensitivity: 1.1,
            },
            {
                range: [3500, 22050],
                color: '#1E90FF',
                name: 'Cymbals',
                sensitivity: 1.0,
            },
        ],
    },

    // Профиль - электронная музыка
    ELECTRONIC: {
        label: 'Электронная',
        bands: [
            { range: [0, 60], color: '#8B0000', name: 'Sub', sensitivity: 0.2 },
            {
                range: [60, 120],
                color: '#FF0000',
                name: 'Kick',
                sensitivity: 0.4,
            },
            {
                range: [120, 200],
                color: '#FF4500',
                name: 'Bass',
                sensitivity: 0.6,
            },
            {
                range: [200, 800],
                color: '#FFD700',
                name: 'Synth',
                sensitivity: 0.8,
            },
            {
                range: [800, 3500],
                color: '#32CD32',
                name: 'Lead',
                sensitivity: 1.2,
            },
            {
                range: [3500, 22050],
                color: '#1E90FF',
                name: 'Hi-Hats',
                sensitivity: 1.5,
            },
        ],
    },

    // Профиль - классическая музыка
    CLASSICAL: {
        label: 'Классическая',
        bands: [
            {
                range: [0, 80],
                color: '#5D4037', // глубокий коричневый - контрабас, фагот
                name: 'Basses',
                sensitivity: 0.7,
            },
            {
                range: [80, 200],
                color: '#8D6E63', // теплый коричневый - виолончели, валторны
                name: 'Cellos',
                sensitivity: 0.9,
            },
            {
                range: [200, 600],
                color: '#D7CCC8', // нейтральный бежевый - альты, кларнеты
                name: 'Violas',
                sensitivity: 1.0,
            },
            {
                range: [600, 1200],
                color: '#FFD54F', // теплый золотой - основные скрипки
                name: 'Violins',
                sensitivity: 1.2,
            },
            {
                range: [1200, 5000],
                color: '#4FC3F7', // нежный голубой - флейты, солирующие скрипки
                name: 'Soloists',
                sensitivity: 1.1,
            },
            {
                range: [5000, 22050],
                color: '#E1F5FE', // ледяной бело-голубой - колокольчики, арфа
                name: 'Sparkle',
                sensitivity: 1.0,
            },
        ],
    },

    // Профиль музыка Эннио Морриконе
    MORRICONE: {
        label: 'Морриконе',
        bands: [
            {
                range: [0, 80],
                color: '#8B4513', // темно-коричневый - контрабас, литавры
                name: 'Contrabass',
                sensitivity: 0.8,
            },
            {
                range: [80, 200],
                color: '#CD853F', // светло-коричневый - виолончели, фагот
                name: 'Cellos',
                sensitivity: 0.9,
            },
            {
                range: [200, 600],
                color: '#DAA520', // золотой - альты, валторны
                name: 'Violas',
                sensitivity: 1.0,
            },
            {
                range: [600, 1200],
                color: '#FFD700', // желтый - скрипки, флейты
                name: 'Violins',
                sensitivity: 1.1,
            },
            {
                range: [1200, 3500],
                color: '#87CEEB', // небесно-голубой - солирующие скрипки, трубы
                name: 'Solo Violin',
                sensitivity: 1.2,
            },
            {
                range: [3500, 22050],
                color: '#FFFFFF', // белый - флейты-пикколо, колокольчики
                name: 'Piccolo',
                sensitivity: 1.0,
            },
        ],
    },
};
