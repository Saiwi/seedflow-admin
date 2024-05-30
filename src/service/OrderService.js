import { collection, getDocs, query, where, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';

export default class OrderService {
    static async removeOrderById(orderId) {
        const db = window.db; // Передбачається, що Firestore ініціалізовано в window.db

        try {
            const batch = writeBatch(db);

            // Видалення замовлення з колекції orders
            const orderRef = doc(db, 'orders', orderId);
            batch.delete(orderRef);

            // Видалення елементів замовлення з колекції order_items
            const orderItemsRef = collection(db, 'order_items');
            const orderItemsQuery = query(orderItemsRef, where('orderId', '==', orderId));
            const orderItemsSnapshot = await getDocs(orderItemsQuery);

            orderItemsSnapshot.forEach(itemDoc => {
                batch.delete(itemDoc.ref);
            });

            // Застосовуємо транзакцію
            await batch.commit();

            return { result: true };
        } catch (error) {
            console.error("Error removing order: ", error);
            return { result: false, error: error.message };
        }
    }
    static async completeOrder(orderId) {
        const db = window.db; // Передбачається, що Firestore ініціалізовано в window.db

        try {
            const orderRef = doc(db, 'orders', orderId);
            await updateDoc(orderRef, {
                complete: true
            });

            return { result: true };
        } catch (error) {
            console.error("Error completing order: ", error);
            return { result: false, error: error.message };
        }
    }
    static async fetchOrders() {
        const db = window.db; // Передбачається, що Firestore ініціалізовано в window.db

        try {
            const ordersRef = collection(db, 'orders');
            const ordersSnapshot = await getDocs(ordersRef);

            const orders = [];
            for (const orderDoc of ordersSnapshot.docs) {
                const order = orderDoc.data();
                order.id = orderDoc.id;

                // Форматування дати замовлення
                if (order.orderDate) {
                    order.orderDate = order.orderDate.toDate();
                    order.formattedOrderDate = format(order.orderDate, 'yyyy-MM-dd HH:mm:ss');
                }

                // Отримуємо всі елементи замовлення для конкретного замовлення
                const orderItemsRef = collection(db, 'order_items');
                const orderItemsQuery = query(orderItemsRef, where('orderId', '==', order.id));
                const orderItemsSnapshot = await getDocs(orderItemsQuery);

                const orderItems = [];
                for (const itemDoc of orderItemsSnapshot.docs) {
                    const orderItem = itemDoc.data();
                    orderItem.id = itemDoc.id;

                    // Отримуємо дані продукту для кожного елемента замовлення
                    const productRef = doc(db, 'products', orderItem.productId);
                    const productDoc = await getDoc(productRef);
                    if (productDoc.exists()) {
                        orderItem.product = productDoc.data();
                        orderItem.product.id = productDoc.id;
                    }

                    orderItems.push(orderItem);
                }

                order.items = orderItems;
                orders.push(order);
            }

            return orders;
        } catch (error) {
            console.error("Error fetching orders: ", error);
            return { success: false, error: error.message };
        }
    }
}