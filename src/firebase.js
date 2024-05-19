import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDATJZ8Whu3rUf1btU3xzcJpyPdcQO_THw",
    authDomain: "seedflow-4a30f.firebaseapp.com",
    projectId: "seedflow-4a30f",
    storageBucket: "seedflow-4a30f.appspot.com",
    messagingSenderId: "973890727616",
    appId: "1:973890727616:web:97efcd5c72dc9c1b3a8725",
    measurementId: "G-R22PPJ1QV2",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export default {
    firestore,
    storage: getStorage(),
};
