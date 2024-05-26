import { getDocs, collection, deleteDoc, doc } from 'firebase/firestore';

export default class CommentsService {
    static async fetchComments() {
        const commentsRef = await collection(window.db, 'comments');
        const commentsSnap = await getDocs(commentsRef);

        return commentsSnap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    }
    static async removeCommentById(id) {
        const commentRef = await doc(window.db, 'comments', id);

        await deleteDoc(commentRef);

        return { result: true };
    }
}