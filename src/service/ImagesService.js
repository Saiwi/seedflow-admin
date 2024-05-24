import { getStorage, ref, getDownloadURL } from "firebase/storage";

export default class ImagesService {
    static async getImage(url) {
        const storage = getStorage();
        const pathReference = ref(storage, url);
        const downloadUrl = await getDownloadURL(pathReference);
        return downloadUrl;
    }
}