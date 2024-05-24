<script setup>
import { useLayout } from '@/layout/composables/layout';
import { onAuthStateChanged, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppConfig from '@/layout/AppConfig.vue';
import Translates from '@/service/Translates';
import { doc, getDoc } from 'firebase/firestore';

const router = useRouter();
const auth = getAuth();
const message = ref([]);

const { layoutConfig } = useLayout();
const email = ref('');
const password = ref('');
const isLoading = ref(false);

const logoUrl = computed(() => {
    return `/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const showError = (content) => {
    message.value = [{ severity: 'error', detail: 'Помилка!', content, id: 1 }];
};

const onSubmit = () => {
    isLoading.value = true;
    signInWithEmailAndPassword(auth, email.value, password.value)
        .catch((error) => {
            showError(Translates.translateAuthErrorCodeToUkrainian(error.code));
        })
        .finally(() => {
            isLoading.value = false;
        });
};

onMounted(() => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const profileDocRef = doc(window.db, 'profiles', user.uid);
            getDoc(profileDocRef)
                .then((result) => {
                    const { isAdmin } = result.data();
                    if (!isAdmin) {
                        signOut(auth).then(() => {
                            showError('Користувач не є адміністратором');
                        });
                    } else {
                        router.push('/');
                    }
                })
                .catch((error) => {
                    showError(Translates.translateAuthErrorCodeToUkrainian(error.code));
                });
        }
    });
});
</script>

<template>
    <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
        <div class="flex flex-column align-items-center justify-content-center">
            <img :src="logoUrl" alt="Sakai logo" class="mb-5 w-10rem flex-shrink-0" />
            <div style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
                <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
                    <div class="text-center mb-5">
                        <div class="text-900 text-3xl font-medium mb-6">Панель адміністратора</div>
                    </div>

                    <div>
                        <label for="email1" class="block text-900 text-xl font-medium mb-2">Електронна адреса</label>
                        <InputText id="email1" type="text" placeholder="Введіть електронну адресу" class="w-full md:w-30rem mb-5" style="padding: 1rem" v-model="email" />

                        <label for="password1" class="block text-900 font-medium text-xl mb-2">Пароль</label>
                        <Password id="password1" v-model="password" placeholder="Введіть пароль" :toggleMask="true" class="w-full mb-3" inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>

                        <Button label="Sign In" class="w-full p-3 mt-4 text-xl" :loading="isLoading" @click="onSubmit"></Button>

                        <transition-group name="p-message" tag="div">
                            <Message v-for="msg of message" :severity="msg.severity" :key="msg.content">{{ msg.content }}</Message>
                        </transition-group>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <AppConfig simple />
</template>

<style scoped>
.pi-eye {
    transform: scale(1.6);
    margin-right: 1rem;
}

.pi-eye-slash {
    transform: scale(1.6);
    margin-right: 1rem;
}
</style>
