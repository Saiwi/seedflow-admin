import { getDocs, collection, query } from 'firebase/firestore';
export default class ClientsService {
    static async fetchClients() {
        const filterCollection = collection(window.db, 'profiles');
        const ordersSnap = await query(collection(window.db, 'orders'));
        const snapshot = await getDocs(filterCollection);
        const orders = await getDocs(ordersSnap);

        return snapshot.docs.map((document) => {
            const count = orders.docs.filter((order) => order.data().profileId == document.id);
            const sum = orders.docs.reduce((currentValue, order) => currentValue += order.data().total, 0);
            return { ...document.data(), id: document.id, ordersCount: count.length, sum };
        }).filter((client) => !client.isAdmin);
    }
}
