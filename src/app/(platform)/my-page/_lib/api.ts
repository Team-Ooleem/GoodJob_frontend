import { MentoringApplicationResponse } from './mock-data';

interface FetchMentoringApplicationsParams {
    user_idx: number;
    page?: number;
    limit?: number;
}

export async function fetchMentoringApplications({
    user_idx,
    page = 1,
    limit = 10,
}: FetchMentoringApplicationsParams): Promise<MentoringApplicationResponse> {
    const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
    });

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/mentoring-applications/${user_idx}?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch mentoring applications');
    }

    return response.json();
}
