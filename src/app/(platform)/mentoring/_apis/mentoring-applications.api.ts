import { api } from '@/apis/api';

export interface CreateApplicationPayment {
  amount: number;
  transaction_id: string;
  status: 'completed' | 'pending' | 'failed' | string;
}

export interface CreateApplicationDto {
  mentee_idx: number;
  regular_slots_idx: number;
  booked_date: string; // YYYY-MM-DD
  message_to_mentor?: string;
  payment: CreateApplicationPayment;
}

export interface ApplicationResponse {
  application_id: number;
  product_idx: number;
  mentee_idx: number;
  regular_slots_idx: number;
  booked_date: string;
  application_status: string;
  message_to_mentor?: string;
  payment: {
    payment_id: number;
    amount: number;
    status: string;
    transaction_id: string;
    paid_at?: string;
  };
  created_at: string;
}

export async function createMentoringApplication(
  productIdx: number | string,
  payload: CreateApplicationDto,
): Promise<ApplicationResponse> {
  const res = await api.post(`/mentoring-products/${productIdx}/applications`, payload);
  return res.data as ApplicationResponse;
}

