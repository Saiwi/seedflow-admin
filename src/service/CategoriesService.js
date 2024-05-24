import { getDoc, doc } from 'firebase/firestore';

export default class CategoriesService {
    static async getCategory(id) {
        const productsRef = await doc(window.db, 'categories', id);
        const snapshot = await getDoc(productsRef);
        return snapshot.data();
    }
    static async getCategoryCatalog(id) {
        const catalogRef = await doc(window.db, 'catalogs', id);
        const snapshot = await getDoc(catalogRef);
        return snapshot.data();
    }
}