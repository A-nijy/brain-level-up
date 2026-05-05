import { useState, useEffect, useCallback, useMemo } from 'react';
import { runQuery, runCommand } from '@/lib/db';
import { StatsService } from '@/services/StatsService';
import { useAuth } from '@/contexts/AuthContext';
import { Item } from '@/types';

export interface StudyOptions {
    ranges?: string[];
    frontSide?: 'question' | 'answer';
    order?: 'sequential' | 'random';
}

export function useStudySession(libraryId: string, sectionId?: string, options?: StudyOptions) {
    const { profile } = useAuth();
    const [items, setItems] = useState<Item[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState({ correct: 0, wrong: 0 });
    const [isFinished, setIsFinished] = useState(false);
    const [startTime] = useState(Date.now());
    const [error, setError] = useState<Error | null>(null);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            let sql = 'SELECT * FROM items WHERE library_id = ?';
            let params: any[] = [libraryId];

            if (sectionId) {
                sql += ' AND section_id = ?';
                params.push(sectionId);
            }

            // Status filtering
            if (options?.ranges && !options.ranges.includes('all')) {
                const placeholders = options.ranges.map(() => '?').join(',');
                sql += ` AND study_status IN (${placeholders})`;
                params.push(...options.ranges);
            }

            const data = await runQuery(sql, params);
            let processedItems = (data || []) as Item[];

            // Card face swapping
            if (options?.frontSide === 'answer') {
                processedItems = processedItems.map(item => ({
                    ...item,
                    question: item.answer,
                    answer: item.question
                }));
            }

            // Ordering
            if (options?.order !== 'sequential') {
                processedItems = [...processedItems].sort(() => Math.random() - 0.5);
            }

            setItems(processedItems);
            setError(null);
        } catch (err: any) {
            console.error('[useStudySession] Fetch error:', err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [libraryId, sectionId, options]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleFlip = useCallback(() => {
        setIsFlipped(prev => !prev);
    }, []);

    const updateItemStats = async (itemId: string, success: boolean) => {
        try {
            await runCommand(
                'UPDATE items SET study_status = ? WHERE id = ?',
                [success ? 'learned' : 'confused', itemId]
            );
        } catch (err: any) {
            console.error("[useStudySession] Update status error:", err);
        }
    };

    const saveSessionProgress = useCallback(async (currentResults = results) => {
        if (!profile || (currentResults.correct === 0 && currentResults.wrong === 0)) return;

        try {
            const totalItems = currentResults.correct + currentResults.wrong;
            const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
            await StatsService.logStudyActivity(profile.id, totalItems, currentResults.correct, durationSeconds);
        } catch (err) {
            console.error("[useStudySession] Failed to save session progress:", err);
        }
    }, [profile, results, startTime]);

    const handleResult = useCallback(async (success: boolean) => {
        const currentItem = items[currentIndex];
        if (!currentItem) return;

        const newResults = {
            correct: success ? results.correct + 1 : results.correct,
            wrong: !success ? results.wrong + 1 : results.wrong
        };

        setResults(newResults);
        updateItemStats(currentItem.id, success);

        if (currentIndex < items.length - 1) {
            setIsFlipped(false);
            setCurrentIndex(prev => prev + 1);
        } else {
            // End session
            await saveSessionProgress(newResults);
            setIsFinished(true);
        }
    }, [items, currentIndex, results, saveSessionProgress]);

    const currentItem = useMemo(() => items[currentIndex], [items, currentIndex]);
    const progress = items.length > 0 ? (currentIndex + 1) / items.length : 0;

    return {
        items,
        currentItem,
        currentIndex,
        isFlipped,
        loading,
        results,
        isFinished,
        error,
        progress,
        handleFlip,
        handleResult,
        saveSessionProgress,
        setIsFlipped
    };
}
