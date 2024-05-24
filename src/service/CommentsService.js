export default class CommentsService {
    static async fetchComments() {
        return [
            {
                client: 'Client name',
                date: '2024-05-23',
                rating: 4.45,
                message: 'Нормальне насіння'
            },
            {
                client: 'Client name',
                date: '2024-05-23',
                rating: 4.45,
                message: 'Нормальне насіння'
            },
        ];
    }
}