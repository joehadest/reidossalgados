export interface Category {
    _id: string;
    name: string;
    emoji?: string;
    orderIndex?: number; // Índice para controlar a ordem das categorias
}

export interface MenuItem {
    _id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    destaque: boolean;
    available: boolean;
    sizes?: {
        P?: number;
        G?: number;
        'Única'?: number;
        '350ml'?: number;
        '600ml'?: number;
        '300ml'?: number;
        '500ml'?: number;
        'Fatia'?: number;
        [key: string]: number | undefined;
    };
    borderOptions?: {
        [key: string]: number;
    };
    extraOptions?: {
        [key: string]: number;
    };
    ingredients?: string[];
} 