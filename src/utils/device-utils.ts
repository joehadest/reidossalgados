// src/utils/device-utils.ts

export const isIphone = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }
    // Expressão regular para detectar iPhone, iPod, e iPad (que se comporta como iPhone no Safari Mobile)
    return /iPhone|iPod|iPad/i.test(navigator.userAgent);
};
