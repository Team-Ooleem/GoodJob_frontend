// result/_utils/data-processing.ts
import type { AudioAnalysisData, VisualAnalysisData } from '../_apis/result-api';

// 오디오 지표 병합: 기존 값(prev)을 우선 보존하고, next에서 없는 값만 보충
export const mergeAudioData = (
    prev: AudioAnalysisData | null,
    next: AudioAnalysisData | null,
): AudioAnalysisData | null => {
    if (!prev) return next;
    if (!next) return prev;

    const mergedOverall = {
        ...(next.overall || {}),
        ...(prev.overall || {}),
    } as any;

    // perQuestion: questionNumber/question_id를 숫자로 정규화하여 병합
    const prevArr = Array.isArray(prev.perQuestion) ? prev.perQuestion : [];
    const nextArr = Array.isArray(next.perQuestion) ? next.perQuestion : [];
    const map = new Map<number, any>();

    const toKey = (it: any, idx: number) => {
        const raw = (it?.questionNumber ?? it?.question_id ?? idx + 1) as any;
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : idx + 1;
    };

    nextArr.forEach((it, idx) => {
        if (!it) return;
        const key = toKey(it, idx);
        map.set(key, { ...it, questionNumber: key });
    });

    prevArr.forEach((it, idx) => {
        if (!it) return;
        const key = toKey(it, idx);
        // prev는 보조 소스: 존재하는 키에만 병합하고, 새로운 키는 추가하지 않음
        if (map.has(key)) {
            map.set(key, { ...(map.get(key) || {}), ...it, questionNumber: key });
        }
    });

    const mergedPerQ = Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([_, v]) => v);

    return { overall: mergedOverall, perQuestion: mergedPerQ };
};

// 비주얼 데이터 병합: next 우선(overall 구조), prev의 점수 필드는 보존
export const mergeVisualData = (
    prev: VisualAnalysisData | null,
    next: VisualAnalysisData | null,
): VisualAnalysisData | null => {
    if (!prev) return next;
    if (!next) return prev;

    const mergedOverall: any = {
        ...(prev.overall || {}),
        ...(next.overall || {}),
    };

    // 점수 필드 명시 보존/갱신
    if ((next.overall as any)?.confidence_score != null)
        mergedOverall.confidence_score = (next.overall as any).confidence_score;
    if ((next.overall as any)?.behavior_score != null)
        mergedOverall.behavior_score = (next.overall as any).behavior_score;

    // perQuestion: 객체 키를 숫자 문자열로 정규화 후 병합
    const norm = (obj?: Record<string, any> | null) => {
        const src = obj || {};
        const out: Record<string, any> = {};
        for (const [k, v] of Object.entries(src)) {
            const n = Number(k);
            const key = Number.isFinite(n) && n > 0 ? String(n) : String(k);
            out[key] = v;
        }
        return out;
    };

    const a = norm(next.perQuestion as any);
    const b = norm(prev.perQuestion as any);
    // 숫자 키만 유지하고, next(권위 소스)에 없는 키는 버림
    const perQ: Record<string, any> = { ...a };
    for (const k of Object.keys(b)) if (perQ[k]) perQ[k] = { ...b[k], ...perQ[k] };

    return { overall: mergedOverall, perQuestion: perQ };
};

// 시각 지표 perQuestion 정규화(숫자 키만 유지)
export const sanitizeVisualPack = (pack: VisualAnalysisData | null): VisualAnalysisData | null => {
    if (!pack?.perQuestion) return pack;
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(pack.perQuestion as Record<string, any>)) {
        const n = Number(k);
        if (Number.isFinite(n) && n > 0) out[String(n)] = v;
    }
    return { ...pack, perQuestion: out } as VisualAnalysisData;
};

// 오디오 perQuestion 정규화/중복 제거: 숫자 키만 유지하고 qaLength 초과 항목은 제거
export const normalizeAudioPerQuestion = (
    arr: any[] | null | undefined,
    qaLength?: number,
): any[] => {
    const list = Array.isArray(arr) ? arr : [];
    const map = new Map<number, any>();

    for (let i = 0; i < list.length; i++) {
        const it = list[i];
        const n = Number(it?.questionNumber ?? it?.question_id ?? i + 1);
        if (!Number.isFinite(n) || n <= 0) continue; // 숫자가 아닌 키(q1 등) 제거
        if (!map.has(n))
            map.set(n, { ...it, questionNumber: n, question: it?.question || `질문 ${n}` });
    }

    let out = Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([_, v]) => v);

    if (qaLength && qaLength > 0) out = out.slice(0, qaLength);
    return out;
};

// 서버에서 받은 audio_metrics rows 정리(숫자 question_id만 유지)
export const sanitizeAudioRows = (rows: any[]): any[] => {
    if (!Array.isArray(rows)) return [];
    return rows
        .filter((r) => Number.isFinite(Number(r?.question_id)) && Number(r?.question_id) > 0)
        .map((r, idx) => ({ ...r, questionNumber: Number(r.question_id) || idx + 1 }));
};

// 비주얼 점수 폴백 계산: confidence_score/behavior_score가 없을 때 채워넣음
export const enrichVisualScores = (pack: VisualAnalysisData | null): VisualAnalysisData | null => {
    if (!pack?.overall) return pack;
    const o: any = { ...(pack.overall as any) };

    if (o.confidence_score == null && typeof o.confidence_mean === 'number') {
        o.confidence_score = Math.max(0, Math.min(100, Math.round(o.confidence_mean * 100)));
    }

    if (o.behavior_score == null) {
        const count = Number(o.count) || 0;
        const smile = typeof o.smile_mean === 'number' ? o.smile_mean : 0;
        const presGood = Number(o.presence_dist?.good) || 0;
        const warn = Number(o.level_dist?.warning) || 0;
        const crit = Number(o.level_dist?.critical) || 0;
        const goodRatio = count > 0 ? presGood / count : 0;
        const alertRatio = count > 0 ? (warn + crit) / count : 0;
        const score01 = Math.max(
            0,
            Math.min(1, 0.6 * smile + 0.25 * goodRatio + 0.15 * (1 - alertRatio)),
        );
        o.behavior_score = Math.round(score01 * 100);
    }

    return { ...pack, overall: o } as VisualAnalysisData;
};

// 오디오 정규화 비율 계산
export const computeAudioNormalizedRatios = (
    rawOverall: Record<string, any>,
    baseline: Record<string, any>,
): Record<string, number> => {
    const keys = ['f0_mean', 'f0_std', 'rms_cv', 'jitter_like', 'shimmer_like', 'silence_ratio'];
    const out: Record<string, number> = {};

    for (const k of keys) {
        const v = Number((rawOverall as any)?.[k]);
        const b = Number((baseline as any)?.[k]);
        if (Number.isFinite(v) && Number.isFinite(b) && b !== 0) {
            out[k] = v / b;
        }
    }

    return out;
};

// 숫자 포맷팅 유틸리티
export const formatNumber = (n: any, digits = 3) => {
    if (n == null || Number.isNaN(Number(n))) return '-';
    const num = Number(n);
    if (!Number.isFinite(num)) return '-';
    return Number(num.toFixed(digits));
};

// 퍼센트 계산
export const calculatePercentage = (n?: number | null, total?: number | null) => {
    if (!n || !total || total <= 0) return '0%';
    return `${((n / total) * 100).toFixed(0)}%`;
};
