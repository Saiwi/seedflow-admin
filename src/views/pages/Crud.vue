<script setup>
import { onBeforeMount, ref } from 'vue';
import { FilterMatchMode } from 'primevue/api';
import orderService from '@/service/OrderService';
import productService from '@/service/ProductService';
import commentsService from '@/service/CommentsService';
import FilterService from '@/service/FilterService';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { useRouter } from 'vue-router';
import Editor from 'primevue/editor';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';

const confirm = useConfirm();

const loading = ref(false);
const toast = useToast();

const ordersList = ref([]);
const orderFilters = ref(null);

const commentsList = ref([]);
const commentsFilters = ref(null);

const productsFilters = ref(null);
const productsList = ref([]);

const allFilters = ref([]);
const productFiltersData = ref([]);

const router = useRouter();

const initOrderFilters = () => {
    orderFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
const initCommentsFilters = () => {
    commentsFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};
const initProductsFilters = () => {
    productsFilters.value = {
        global: { value: null, matchMode: FilterMatchMode.CONTAINS }
    };
};

const showSuccess = (text) => {
    toast.add({ severity: 'info', summary: 'Виконано', detail: text, life: 3000 });
};
const showError = (text) => {
    toast.add({ severity: 'error', summary: 'Помилка', detail: text, life: 3000 });
};

const catalogsList = ref([]);
const categoriesList = ref([]);
const filtersList = ref([]);
const showAddModal = ref(false);
const addFormData = ref({
    name: '',
    price: '',
    status: true,
    image: '',
    description: '',
    catalogId: '',
    categoryId: '',
    filters: {}
});
const validate = (data) => {
    return Object.keys(data).every((field) => {
        if (!status) {
            return true;
        }
        return !!data[field];
    });
};
const submitAddForm = async () => {
    loading.value = true;

    if (!validate({ ...addFormData.value })) {
        showError('Заповність всі поля!');
        return false;
    }

    const { result, message } = await productService.createProduct({ ...addFormData.value });

    loading.value = false;
    if (result) {
        showSuccess(message);
    } else {
        showError(message);
        return false;
    }
    addFormData.value = {
        name: '',
        price: '',
        status: true,
        image: '',
        description: '',
        catalogId: '',
        categoryId: '',
        filters: {}
    };
    categoriesList.value = [];
    showAddModal.value = false;
    loading.value = false;

    loadProducts();
};
const onCatalogChange = async (newCatalogId) => {
    const categories = await productService.fetchCategories(newCatalogId);
    const filters = await productService.fetchFilters(newCatalogId);

    categoriesList.value = categories;
    filtersList.value = filters;
};
const onAddImageUpload = ({ files }) => {
    addFormData.value.image = files[0];
};
const onAddImageRemove = () => {
    addFormData.value.image = '';
};

const tableLoading = ref(false);
const loadProducts = async () => {
    tableLoading.value = true;

    productFiltersData.value = await FilterService.fetchProductFilters();

    const dryProducts = await productService.fetchProducts();
    productsList.value = await productService.formatForTable(
        dryProducts,
        {
            ...allFilters.value
        },
        {
            ...productFiltersData.value
        }
    );
    tableLoading.value = false;
};

// Remove product
const removeProduct = ($event, id) => {
    confirm.require({
        target: document.activeElement,
        message: 'Ви дійсно хочете видалити цей товар?',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
        acceptClass: 'p-button-sm',
        rejectLabel: 'Ні',
        acceptLabel: 'Так',
        accept: async () => {
            const { result } = await productService.removeProductById(id);
            if (result) {
                toast.add({ severity: 'info', summary: `Продукт ${id} видалено`, life: 2000 });
                productsList.value = productsList.value.filter((product) => product.id !== id);
            }
        }
    });
};
const removeComment = (id) => {
    confirm.require({
        target: document.activeElement,
        message: 'Ви дійсно хочете видалити коментар?',
        icon: 'pi pi-exclamation-triangle',
        rejectClass: 'p-button-secondary p-button-outlined p-button-sm',
        acceptClass: 'p-button-sm',
        rejectLabel: 'Ні',
        acceptLabel: 'Так',
        accept: async () => {
            const { result } = await commentsService.removeCommentById(id);
            if (result) {
                toast.add({ severity: 'info', summary: `Коментар ${id} видалено`, life: 2000 });
                commentsList.value = commentsList.value.filter((comment) => comment.id !== id);
            }
        }
    });
};

onBeforeMount(async () => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            router.push('/auth/login');
        }
    });

    initOrderFilters();
    initCommentsFilters();
    initProductsFilters();

    allFilters.value = await FilterService.fetchFilters();

    ordersList.value = await orderService.fetchOrders();
    commentsList.value = await commentsService.fetchComments();
    catalogsList.value = await productService.fetchCatalogs();

    loadProducts();
});
</script>

<template>
    <div>
        <ConfirmDialog key="removeCommon"></ConfirmDialog>

        <Dialog :loading="loading" header="Створити товар" v-model:visible="showAddModal" modal>
            <form @submit.prevent="submitAddForm" class="flex flex-column mt-2 mb-2 gap-4">
                <div class="flex flex-column gap-2">
                    <label for="nameField">Назва</label>
                    <InputText id="nameField" v-model="addFormData.name" required />
                </div>
                <div class="flex flex-column gap-2">
                    <label for="priceField">Ціна</label>
                    <InputNumber id="priceField" :minFractionDigits="2" :maxFractionDigits="2" v-model="addFormData.price" required />
                </div>
                <div class="flex flex-column gap-2">
                    <label for="statusField">В наявності</label>
                    <InputSwitch id="statusField" v-model="addFormData.status" required />
                </div>
                <div class="flex flex-column gap-2">
                    <label for="nameField">Каталог</label>
                    <Dropdown placeholder="Виберіть каталог" id="sampleField" emptyMessage="Немає даних" v-model="addFormData.catalogId" optionLabel="title" optionValue="id" :options="catalogsList" required @update:modelValue="onCatalogChange">
                    </Dropdown>
                </div>

                <div class="flex flex-column gap-2">
                    <label for="categoryIdField">Категорія</label>
                    <Dropdown placeholder="Виберіть категорію" id="categoryIdField" emptyMessage="Немає даних" v-model="addFormData.categoryId" optionLabel="name" optionValue="id" :options="categoriesList" required> </Dropdown>
                </div>

                <div v-for="filter of filtersList" :key="filter.id" class="flex flex-column gap-2">
                    <label :for="`filter_${filter.id}`">{{ filter.name }}</label>
                    <Dropdown :placeholder="`Виберіть ${filter.name}`" :id="`filter_${filter.id}`" emptyMessage="Немає даних" v-model="addFormData['filters'][`${filter.id}`]" optionLabel="name" optionValue="id" :options="filter.options" required>
                    </Dropdown>
                </div>

                <div class="flex flex-column gap-2">
                    <label for="descriptionField">Опис</label>
                    <Editor v-model="addFormData.description" editorStyle="height: 120px" />
                </div>

                <div class="flex flex-column gap-2">
                    <label for="imageField">Зображення</label>
                    <FileUpload name="image[]" mode="basic" customUpload accept="image/*" @select="onAddImageUpload" :fileLimit="1" @clear="onAddImageRemove" chooseLabel="Обрати" :multiple="false" />
                </div>

                <div class="mt-4 text-right">
                    <Button label="Створити" :loading="loading" type="submit" icon="pi pi-plus" />
                </div>
            </form>
        </Dialog>

        <DataTable :loading="tableLoading" :filters="productsFilters" v-model:filters="productsFilters" :value="productsList" :paginator="true" :rows="10" dataKey="id" :rowHover="true" showGridlines>
            <template #empty>
                <div class="flex align-items-center gap-2"><span>Товарів немає:</span></div>
            </template>
            <template #loading>
                <div class="w-full h-full bg-white flex justify-content-center align-items-center opacity-90">Завантаження...</div>
            </template>
            <template #header>
                <h5>Товари</h5>
                <div class="flex align-items-center w-full justify-content-between flex-wrap gap-2">
                    <Button label="Новий" icon="pi pi-plus" @click="showAddModal = true"></Button>
                    <div class="flex justify-content-between flex-column sm:flex-row flex-wrap gap-2">
                        <Button class="mr-2" type="button" icon="pi pi-filter-slash" label="Збити фільтр" outlined @click="initProductsFilters" />
                        <IconField iconPosition="left">
                            <InputIcon class="pi pi-search" />
                            <InputText v-model="productsFilters['global'].value" placeholder="Пошук товару" style="width: 100%" />
                        </IconField>
                    </div>
                </div>
            </template>
            <Column field="status" header="№" style="width: 3%" :sortable="true">
                <template #body="{ data }">
                    {{ data.id }}
                </template>
            </Column>
            <Column field="status" header="Наявність" style="width: 5%" :sortable="true">
                <template #body="{ data }">
                    {{ data.status ? '+' : '-' }}
                </template>
            </Column>
            <Column field="status" header="Каталог" style="width: 5%" :sortable="true">
                <template #body="{ data }">
                    {{ data.catalog }}
                </template>
            </Column>
            <Column field="name" header="Назва" style="width: 10%" :sortable="true">
                <template #body="{ data }">
                    {{ data.name }}
                </template>
            </Column>
            <Column field="price" header="Ціна" :sortable="true">
                <template #body="{ data }"> {{ data.price }} грн </template>
            </Column>
            <Column field="category" header="Категорія" :sortable="true">
                <template #body="{ data }"> {{ data.category }}<br /> </template>
            </Column>
            <Column field="filters" header="Фільтри" :sortable="true">
                <template #body="{ data }">
                    <ul class="flex flex-column gap-2 p-2 m-2">
                        <li v-for="filter of data.filters" :key="filter.value">
                            <b>{{ filter.title }}:</b> - {{ filter.value }}
                        </li>
                    </ul>
                </template>
            </Column>
            <Column field="image" header="Фото">
                <template #body="{ data }">
                    <img width="80" height="100" :src="data.image" style="object-fit: contain" />
                </template>
            </Column>
            <Column field="description" header="Опис">
                <template #body="{ data }"> <div v-html="data.description"></div> </template>
            </Column>
            <Column field="actions" header="Дії">
                <template #body="{ data }">
                    <div class="flex flex-wrap gap-2">
                        <Button icon="pi pi-times" class="p-button-danger" @click="removeProduct($event, data.id)" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <div class="mb-8"></div>

        <DataTable :filters="orderFilters" v-model:filters="orderFilters" :value="ordersList" :paginator="true" :rows="10" dataKey="id" :rowHover="true" showGridlines>
            <template #header>
                <h5>Замовлення</h5>
                <div class="flex flex-wrap gap-2 justify-content-between flex-column sm:flex-row flex-wrap gap-2">
                    <Button type="button" icon="pi pi-filter-slash" label="Збити фільтр" outlined @click="initOrderFilters" />
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="orderFilters['global'].value" placeholder="Пошук" style="width: 100%" />
                    </IconField>
                </div>
            </template>
            <template #empty> Замовлень не знайдено. </template>
            <template #loading> Зачекайте... </template>

            <Column field="total" header="Сума" :sortable="true">
                <template #body="{ data }"> {{ data.total }} грн </template>
            </Column>
            <Column field="orderDate" header="Дата" :sortable="true">
                <template #body="{ data }">
                    {{ data.orderDate }}
                </template>
            </Column>
            <Column field="name" header="Ім'я клієнта">
                <template #body="{ data }">
                    {{ data.client }}
                </template>
            </Column>
            <Column field="phone" header="Номер клієнта">
                <template #body="{ data }">
                    {{ data.phone }}
                </template>
            </Column>
            <Column field="address" header="Адреса доставки">
                <template #body="{ data }">
                    {{ [data.city, data.post, data.department].join(', ') }}
                </template>
            </Column>
            <Column field="products" header="Товари">
                <template #body="{ data }">
                    <div :key="product.id" v-for="product of data.products">
                        <b>№</b> {{ product.id }}, <b>Назва:</b> {{ product.name }}, <b>Кількість:</b> {{ product.count }}, <b>Ціна:</b> {{ product.price }} грн
                        <hr />
                    </div>
                </template>
            </Column>
            <Column field="actions" header="Дії">
                <template #body>
                    <div class="flex flex-wrap gap-2">
                        <Button icon="pi pi-check" class="p-button-success" />
                        <Button icon="pi pi-times" class="p-button-danger" />
                    </div>
                </template>
            </Column>
        </DataTable>

        <div class="mb-8"></div>

        <DataTable :filters="commentsFilters" v-model:filters="commentsFilters" :value="commentsList" :paginator="true" :rows="10" dataKey="id" :rowHover="true" showGridlines>
            <template #header>
                <h5>Відгуки</h5>
                <div class="flex justify-content-between flex-column sm:flex-row flex-wrap gap-2">
                    <Button type="button" icon="pi pi-filter-slash" label="Збити фільтр" outlined @click="initCommentsFilters" />
                    <IconField iconPosition="left">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="commentsFilters['global'].value" placeholder="Пошук" style="width: 100%" />
                    </IconField>
                </div>
            </template>
            <template #empty> Відгуків немає. </template>
            <template #loading> Зачекайте... </template>

            <Column field="id" header="№">
                <template #body="{ data }"> {{ data.id }}</template>
            </Column>
            <Column field="author" header="Клієнт">
                <template #body="{ data }"> {{ data.author }}</template>
            </Column>
            <Column field="date" header="Дата" :sortable="true">
                <template #body="{ data }">
                    {{ data.date }}
                </template>
            </Column>
            <Column field="rating" :sortable="true" header="Оцінка">
                <template #body="{ data }">
                    {{ data.rating }}
                </template>
            </Column>
            <Column field="message" header="Повідомлення">
                <template #body="{ data }">
                    {{ data.message }}
                </template>
            </Column>
            <Column field="remove" header="Видалити">
                <template #body="{ data }">
                    <Button @click="removeComment(data.id)" icon="pi pi-times" class="p-button-danger" />
                </template>
            </Column>
        </DataTable>
    </div>
</template>
