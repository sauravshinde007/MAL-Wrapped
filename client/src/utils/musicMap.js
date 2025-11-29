export const getThemeSong = (genre) => {
    // Normalize string to lowercase to be safe
    const g = genre ? genre.toLowerCase() : 'unknown';

    // Map MAL Genres to your MP3 files
    switch (g) {
        case 'action':
        case 'adventure':
        case 'sports':
        case 'sci-fi':
            return '/music/action(OPM_Seigi_Shikkou).mp3';
        
        case 'drama':
        case 'romance':
        case 'slice of life':
            return '/music/roamnce(Kimi_ni_Todoke).mp3';

        case 'horror':
        case 'mystery':
        case 'psychological':
        case 'thriller':
            return '/music/spooky(Death_Note).mp3';

        case 'comedy':
        case 'fantasy':
        default:
            return '/music/fun(Gintama_Pray).mp3';
    }
};