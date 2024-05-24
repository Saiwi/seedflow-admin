export default class OrderService {
    static async fetchOrders() {
        return [
            {
                orderDate: '2024-05-23',
                total: 255,
                department: 22,
                post: 'Nova Poshta',
                city: 'Rivne',

                client: 'Client',
                phone: '0973347483',
                products: [
                    { id: 1, name: 'First', price: 10, count: 2 },
                    { id: 2, name: 'Second', price: 10, count: 2 },
                    { id: 3, name: 'Third', price: 10, count: 2 },
                    { id: 4, name: 'Fourth', price: 10, count: 2 },
                    { id: 5, name: 'Fifth', price: 10, count: 2 },
                    { id: 6, name: 'Sixth', price: 10, count: 2 }
                ]
            },
            {
                orderDate: '2024-05-22',
                total: 50,
                department: 22,
                post: 'Nova Poshta',
                city: 'Rivne',

                client: 'Client',
                phone: '0973347483',
                products: [
                    { id: 1, name: 'First', price: 10, count: 2 },
                    { id: 2, name: 'Second', price: 10, count: 2 },
                    { id: 3, name: 'Third', price: 10, count: 2 },
                    { id: 4, name: 'Fourth', price: 10, count: 2 },
                    { id: 5, name: 'Fifth', price: 10, count: 2 },
                    { id: 6, name: 'Sixth', price: 10, count: 2 }
                ]
            }
        ];
    }
}