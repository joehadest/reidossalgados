import { MenuItem } from '../types/menu';

export const menuItems: MenuItem[] = [
    // SALGADOS
    {
        _id: '100',
        name: 'Coxinha de Frango',
        description: 'Deliciosa coxinha de frango desfiado com catupiry, massa crocante por fora e macia por dentro',
        price: 8.00,
        category: 'salgados',
        image: 'https://listadereceitas.com/wp-content/uploads/2024/10/coxinha-de-frango.jpg',
        destaque: true,
        sizes: { 'Única': 8.00 },
        ingredients: ['Massa', 'Frango Desfiado', 'Catupiry', 'Farinha de Rosca'],
        borderOptions: {}
    },
    {
        _id: '101',
        name: 'Risoles de Carne',
        description: 'Risoles recheado com carne moída temperada, massa crocante e dourada',
        price: 7.00,
        category: 'salgados',
        image: 'https://i0.wp.com/blogdocheftaico.com/wp-content/uploads/2022/03/Risoles-de-Carne-Chef-Taico-1.png?fit=800%2C533&ssl=1',
        destaque: false,
        sizes: { 'Única': 7.00 },
        ingredients: ['Massa', 'Carne Moída', 'Cebola', 'Temperos'],
        borderOptions: {}
    },
    {
        _id: '102',
        name: 'Risoles de Frango',
        description: 'Risoles recheado com frango desfiado e catupiry, massa crocante e dourada',
        price: 7.00,
        category: 'salgados',
        image: 'https://i0.wp.com/blogdocheftaico.com/wp-content/uploads/2022/03/Risoles-de-Carne-Chef-Taico-1.png?fit=800%2C533&ssl=1',
        destaque: false,
        sizes: { 'Única': 7.00 },
        ingredients: ['Massa', 'Frango Desfiado', 'Catupiry', 'Temperos'],
        borderOptions: {}
    },
    
    // PORÇÕES
    {
        _id: '500',
        name: 'Porção de Coxinhas (6 unidades)',
        description: 'Porção de 6 coxinhas de frango com catupiry',
        price: 45.00,
        category: 'porcoes',
        image: 'https://img.cybercook.com.br/receitas/232/como-fazer-coxinha-2.jpeg',
        destaque: false,
        sizes: { 'Única': 45.00 },
        ingredients: ['6 Coxinhas de Frango', 'Catupiry'],
        borderOptions: {}
    },
    {
        _id: '501',
        name: 'Porção de Risoles (8 unidades)',
        description: 'Porção de 8 risoles de carne moída',
        price: 50.00,
        category: 'porcoes',
        image: 'https://i0.wp.com/blogdocheftaico.com/wp-content/uploads/2022/03/Risoles-de-Carne-Chef-Taico-1.png?fit=800%2C533&ssl=1',
        destaque: false,
        sizes: { 'Única': 50.00 },
        ingredients: ['8 Risoles de Carne'],
        borderOptions: {}
    },
    {
        _id: '502',
        name: 'Porção de Pastéis (10 unidades)',
        description: 'Porção de 10 pastéis de queijo',
        price: 45.00,
        category: 'porcoes',
        image: 'https://www.estadao.com.br/resizer/v2/5O6HYRGA55EJTA3E6YOT43MZ6E.jpeg?quality=80&auth=d1be537d9af67b43918aab534f8ec9f2a44beca067b8a1347ec0df990e6b78db&width=1075&height=527&smart=true',
        destaque: false,
        sizes: { 'Única': 45.00 },
        ingredients: ['10 Pastéis de Queijo'],
        borderOptions: {}
    },
];

export const categories = [
    'salgados',
    'porcoes',
];

