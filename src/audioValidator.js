// Простая проверка - является ли файл аудио
function isAudioFile(file) {
    // Проверяем расширение файла и MIME-тип
    const audioExtensions = [
        '.mp3',
        '.wav',
        '.ogg',
        '.flac',
        '.aac',
        '.m4a',
        '.webm',
    ];
    const fileName = file.name.toLowerCase();
    const isAudio =
        file.type.startsWith('audio/') ||
        audioExtensions.some((ext) => fileName.endsWith(ext));

    return isAudio;
}

// Основная функция валидации (files - массив выбранных файлов)
export function validateAudioFiles(files) {
    // Массив валидных файлов
    const validFiles = [];

    // Проверяем каждый файл, невалидные игнорируем
    files.forEach((file, index) => {
        const validation = validateSingleAudioFiles(file);

        if (validation.isValid) {
            validFiles.push({
                file: file, // Объект файла
                fileName: validation.fileName,
                fileSize: validation.fileSize,
                fileType: validation.fileType,
                fileIndex: index,
            });
        }
    });

    return validFiles;
}

// Вспомогательная функция для валидации одного файла
function validateSingleAudioFiles(file) {
    // Проверяем, что файл не null или undefined (т.е. файл не выбран)
    if (!file) {
        return { isValid: false };
    }

    // Проверяем на пустой файл
    if (file.size === 0) {
        return { isValid: false };
    }

    // Проверяем размер (50MB максимум)
    if (file.size > 50 * 1024 * 1024) {
        return { isValid: false };
    }

    // Проверяем тип файла
    if (!isAudioFile(file)) {
        return { isValid: false };
    }

    return {
        isValid: true,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
    };
}
