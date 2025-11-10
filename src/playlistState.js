// *** Менеджер состояния плейлиста ***

let state = {
    playlist: [],
    currentIndex: 0,
};

// Публичный API модуля
export const playlistState = {
    // Геттеры
    getPlayList: () => [...state.playlist], // возвращаем копию
    getCurrentTrack: () => state.playlist[state.currentIndex],
    getCurrentIndex: () => state.currentIndex,
    getPlaylistInfo: () => ({
        total: state.playlist.length,
        current: state.currentIndex + 1, // ???
        hasNext: state.currentIndex < state.playlist.length - 1,
        hasPrevious: state.currentIndex > 0,
    }),

    // Сеттеры
    setPlaylist: (files) => {
        state.playlist = files;
        state.currentIndex = 0;
        console.log(`Плейлист установлен: ${files.length} треков`);
    },

    // Навигация по плейлисту
    nextTrack: () => {
        if (state.playlist.length === 0) return false;

        state.currentIndex = (state.currentIndex + 1) % state.playlist.length;
        console.log(
            `Переход к треку ${state.currentIndex + 1}/${state.playlist.length}`
        );
        return true;
    },

    previousTrack: () => {
        if (state.playlist.length === 0) return false;

        state.currentIndex =
            state.currentIndex > 0
                ? state.currentIndex - 1
                : state.playlist.length - 1;
        console.log(
            `Переход к треку ${state.currentIndex + 1}/${state.playlist.length}`
        );
        return true;
    },

    goToTrack: (index) => {
        if (index >= 0 && index < state.playlist.length) {
            state.currentIndex = index;
            return true;
        }
        return false;
    },

    // Утилиты
    clearPlaylist: () => {
        state.playlist = [];
        state.currentIndex = 0;
        console.log('Плейлист очищен');
    },

    // Для отладки
    debug: () => ({ ...state }),
};
