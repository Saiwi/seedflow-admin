import { getDoc, doc, collection, getDocs, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

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
    static async fetchPromo() {
        const productsRef = await collection(window.db, 'promos');
        const snapshot = await getDocs(productsRef);
        console.log(snapshot.docs[0].data());
        return snapshot.docs[0].data();
    }
    static async updatePromo({ text, start, end }) {
        const promosCollection = collection(window.db, 'promos');
        const promosSnapshot = await getDocs(promosCollection);

        if (!promosSnapshot.empty) {
            const firstPromoDoc = promosSnapshot.docs[0];

            // Оновлення документа
            await updateDoc(doc(window.db, 'promos', firstPromoDoc.id), {
                text,
                startDate: start ? new Date(end) : null,
                endDate: end ? new Date(end) : null,
            });

            console.log('Promo updated successfully');
        } else {
            console.log('No promo documents found');
        }
    }
}