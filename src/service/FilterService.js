import { getDocs, collection } from 'firebase/firestore';

export default class FilterService {
    static async fetchProductFilters() {
        const filterCollection = await collection(window.db, 'product_filters');
        const snapshot = await getDocs(filterCollection);

        return snapshot.docs.map(document => ({ ...document.data(), id: document.id }));
    }
    static async fetchFilters() {
        const filterCollection = await collection(window.db, 'filters');
        const snapshot = await getDocs(filterCollection);

        return snapshot.docs.map(document => ({ ...document.data(), id: document.id }));
    }
}