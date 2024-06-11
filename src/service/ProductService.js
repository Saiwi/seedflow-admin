import { getDocs, getDoc, query, collection, where, addDoc, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject, uploadBytes } from 'firebase/storage';
import ImagesService from '@/service/ImagesService';

const storage = getStorage();
export default class ProductService {
    static getProductFilters(id, allFilters, productFilters) {
        const foundProductFilters = Object.values(productFilters).filter((filter) => filter.productId == id);
        const filters = [];
        foundProductFilters.forEach((filter) => {
            const origin = Object.values(allFilters).find(f => f.id === filter.filterId);
            filters.push({
                title: origin.name,
                value: origin.options[filter.value],
            });
        });
        return filters;
    }
    static async formatForTable(data, filtersData, productFiltersData, categories, catalogs) {
        for (let product of data) {
            product.filters = ProductService.getProductFilters(product.id, filtersData, productFiltersData);
            product.category = categories.find((category) => category.id == product.category);
            product.catalog = catalogs.find((catalog) => catalog.id == product.category.catalogId);
            product.catalogId = product.catalog.id;
            product.catalog = product.catalog.title;
            product.category = product.category.name;
        }

        return data;
    }
    static async fetchProducts() {
        const productsRef = await collection(window.db, 'products');
        const snapshot = await getDocs(productsRef);
        return snapshot.docs.map(document => ({ ...document.data(), id: document.id }));
    }
    static async updateProduct(id, data) {
        const productRef = doc(window.db, 'products', id);

        const updatedData = {
            name: data.name,
            description: data.description,
            price: data.price,
            status: data.status,
            category: data.categoryId,
        };

        // Оновлюємо продукт
        await updateDoc(productRef, updatedData);

        // Оновлюємо фільтри продукту
        const productFilterRef = collection(window.db, 'product_filters');
        const q = query(productFilterRef, where('productId', '==', id));
        const querySnapshot = await getDocs(q);

        // Видаляємо старі фільтри
        querySnapshot.forEach(async (doc) => {
            await deleteDoc(doc.ref);
        });

        // Додаємо нові фільтри
        for (const filter in data.filters) {
            await addDoc(productFilterRef, {
                productId: id,
                filterId: filter,
                value: data.filters[filter],
            });
        }

        // Оновлюємо зображення, якщо воно є в data
        if (data.image) {
            // Отримуємо старе зображення продукту
            const productDoc = await getDoc(productRef);
            const oldImagePath = productDoc.data().image;

            // Видаляємо старе зображення
            if (oldImagePath) {
                const oldImageRef = ref(storage, oldImagePath);
                await deleteObject(oldImageRef);
            }

            // Завантажуємо нове зображення
            const imagePath = `/products_images/${id}_${data.image.name}`;
            const imageRef = ref(storage, imagePath);
            await uploadBytes(imageRef, data.image);

            // Оновлюємо запис продукту з новим шляхом до зображення
            await updateDoc(productRef, {
                image: imagePath,
            });
        }

        return {
            result: true,
            id: id,
            message: 'Продукт оновлено'
        };
    }
    static async createProduct(data) {
        const productRef = await collection(window.db, 'products');
        const initialData = {
            name: data.name,
            image: '',
            description: data.description,
            price: data.price,
            status: data.status,
            category: data.categoryId,
        };
        const product = await addDoc(productRef, initialData);

        const productFilterRef = await collection(window.db, 'product_filters');
        for (const filter in data.filters) {
            await addDoc(productFilterRef, {
                productId: product.id,
                filterId: filter,
                value: data.filters[filter],
            });
        }

        const imagePath = `/products_images/${product.id}_${data.image.name}`;
        const imageRef = ref(storage, imagePath);
        await uploadBytes(imageRef, data.image);

        await setDoc(doc(window.db, 'products', product.id), {
            ...initialData,
            image: imagePath,
        });

        return {
            result: true,
            id: product.id,
            message: 'Продукт створено'
        };
    }
    static async fetchFilters(catalogId) {
        const filtersRef = collection(window.db, 'filters');
        const q = query(filtersRef, where('catalogId', '==', catalogId));
        const result = await getDocs(q);
        const array = [];
        result.forEach((snap) => {
            const data = snap.data();
            const options = [];
            data.options.forEach((option, index) => {
                options.push({ id: index, name: option })
            });
            data.options = options;
            array.push({
                ...data,
                id: snap.id,
            });
        });
        return array;
    }
    static async fetchCategories(catalogId) {
        const filtersRef = collection(window.db, 'categories');
        const q = query(filtersRef, where('catalogId', '==', catalogId));
        const result = await getDocs(q);
        const array = [];
        result.forEach((snap) => {
            array.push({
                ...snap.data(),
                id: snap.id,
            });
        });
        return array;
    }
    static async fetchCatalogs() {
        const catalogsRef = collection(window.db, 'catalogs');
        const result = await getDocs(catalogsRef);
        const array = [];
        result.forEach((snap) => {
            array.push({
                ...snap.data(),
                id: snap.id,
            });
        });
        return array;
    }
    static async removeProductById(productId) {
        try {
            // Видалення product_filters
            const productFiltersQuery = query(collection(window.db, 'product_filters'), where('productId', '==', productId));
            const productFiltersSnapshot = await getDocs(productFiltersQuery);

            await Promise.all(productFiltersSnapshot.docs.map(async (doc) => {
                await deleteDoc(doc.ref);
            }));

            // Видалення orders та order_items
            const ordersQuery = query(collection(window.db, 'orders'), where('productId', '==', productId));
            const ordersSnapshot = await getDocs(ordersQuery);

            await Promise.all(ordersSnapshot.docs.map(async (orderDoc) => {
                const orderItemsQuery = query(collection(window.db, 'order_items'), where('orderId', '==', orderDoc.id));
                const orderItemsSnapshot = await getDocs(orderItemsQuery);

                await Promise.all(orderItemsSnapshot.docs.map(async (itemDoc) => {
                    await deleteDoc(itemDoc.ref);
                }));

                await deleteDoc(orderDoc.ref);
            }));

            // Видалення зображення продукту
            const productDoc = await getDoc(doc(window.db, 'products', productId));
            if (productDoc.exists()) {
                const productData = productDoc.data();
                if (productData.image) {
                    const imageRef = ref(storage, productData.image);
                    await deleteObject(imageRef);
                }

                // Видалення продукту
                await deleteDoc(doc(window.db, 'products', productId));

                return { result: true };
            }

            return { result: false, message: 'Продукт не знайдено' };
        } catch (error) {
            console.log(error);
            return { result: false, message: 'Помилка під час видалення' };
        }
    }
}
