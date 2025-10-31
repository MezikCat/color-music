// Простая проверка - является ли файл аудио
function isAudioFile(file) {
    // Проверяем расширение файла и MIME-тип
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a'];
    const fileName = file.name.toLowerCase();
    const isAudio =
        file.type.startsWith('audio/') ||
        audioExtensions.some((ext) => fileName.endsWith(ext));

    return isAudio;
}

// Основная функция валидации
export function validateAudioFile(file) {
    // Проверяем, что файл не null или undefined
    if (!file) {
        return { isValid: false, error: 'Файл не выбран' };
    }

    // Проверяем на пустой файл
    if (file.size === 0) {
        return { isValid: false, error: 'Файл пустой' };
    }

    // Проверяем размер (50MB максимум)
    if (file.size > 50 * 1024 * 1024) {
        return { isValid: false, error: 'Файл слишком большой (макс. 50MB)' };
    }

    if (!isAudioFile(file)) {
        return { isValid: false, error: 'Это не аудиофайл' };
    }

    return {
        isValid: true,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
    };
}
