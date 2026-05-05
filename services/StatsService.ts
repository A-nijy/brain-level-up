import { runQuery, runCommand } from '../lib/db';
import { StudyLog } from '@/types';
import * as Crypto from 'expo-crypto';

/**
 * [Local-First] 학습 통계 및 로그 기록을 담당하는 서비스
 * SQLite를 직접 사용하도록 리팩토링됨
 */
export const StatsService = {
    /**
     * 오늘의 학습 내역을 기록하거나 업데이트합니다.
     */
    async logStudyActivity(
        userId: string,
        itemsCount: number,
        correctCount: number,
        timeInSeconds: number
    ): Promise<void> {
        const today = new Date().toISOString().split('T')[0];

        try {
            // 1. 기존 데이터 확인
            const existing = await runQuery(
                'SELECT * FROM study_logs WHERE user_id = ? AND study_date = ?',
                [userId, today]
            );

            if (existing && existing.length > 0) {
                // 업데이트
                const log = existing[0] as any;
                await runCommand(
                    `UPDATE study_logs 
                     SET items_count = items_count + ?, 
                         correct_count = correct_count + ?, 
                         study_time_seconds = study_time_seconds + ? 
                     WHERE id = ?`,
                    [itemsCount, correctCount, timeInSeconds, log.id]
                );
            } else {
                // 새로 추가
                const id = Crypto.randomUUID();
                const now = new Date().toISOString();
                await runCommand(
                    `INSERT INTO study_logs (id, user_id, study_date, items_count, correct_count, study_time_seconds, created_at) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [id, userId, today, itemsCount, correctCount, timeInSeconds, now]
                );
            }
        } catch (error) {
            console.error('[StatsService] Error logging study activity:', error);
            throw error;
        }
    },

    /**
     * 최근 N일간의 통계를 가져옵니다.
     */
    async getRecentStats(userId: string, days: number = 7): Promise<StudyLog[]> {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const startDateStr = startDate.toISOString().split('T')[0];

        const data = await runQuery(
            'SELECT * FROM study_logs WHERE user_id = ? AND study_date >= ? ORDER BY study_date ASC',
            [userId, startDateStr]
        );
        return data as StudyLog[];
    },

    /**
     * 현재 학습 스트릭(Streak)을 계산합니다.
     */
    async getStudyStreak(userId: string): Promise<number> {
        const data = await runQuery(
            'SELECT study_date FROM study_logs WHERE user_id = ? ORDER BY study_date DESC',
            [userId]
        );

        if (!data || data.length === 0) return 0;

        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        // 오늘 기록이 있는지 먼저 확인
        let lastDateInLog = new Date((data[0] as any).study_date);
        lastDateInLog.setHours(0, 0, 0, 0);

        // 마지막 학습이 어제나 오늘이 아니면 스트릭은 0
        const diffInDays = Math.floor((currentDate.getTime() - lastDateInLog.getTime()) / (1000 * 3600 * 24));
        if (diffInDays > 1) return 0;

        for (let i = 0; i < data.length; i++) {
            let logDate = new Date((data[i] as any).study_date);
            logDate.setHours(0, 0, 0, 0);

            // 예상되는 날짜 계산
            let expectedDate = new Date(currentDate);
            expectedDate.setDate(expectedDate.getDate() - i);

            // 만약 오늘 기록이 없고 어제부터 시작한다면 하나씩 뒤로 밀림
            if (diffInDays === 1) {
                expectedDate.setDate(expectedDate.getDate() - 1);
            }

            if (logDate.getTime() === expectedDate.getTime()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * 모든 암기장 또는 특정 암기장의 학습 상태 분포를 가져옵니다.
     */
    async getStudyDistribution(userId: string, libraryId?: string): Promise<{
        learned: number;
        confused: number;
        undecided: number;
        total: number;
    }> {
        let query = '';
        let params: any[] = [];

        if (libraryId) {
            query = 'SELECT study_status, COUNT(*) as count FROM items WHERE library_id = ? GROUP BY study_status';
            params = [libraryId];
        } else {
            query = `
                SELECT study_status, COUNT(*) as count 
                FROM items 
                WHERE library_id IN (SELECT id FROM libraries WHERE user_id = ?) 
                GROUP BY study_status
            `;
            params = [userId];
        }

        const results = await runQuery(query, params);
        
        let learned = 0;
        let confused = 0;
        let undecided = 0;
        let total = 0;

        results.forEach((row: any) => {
            const count = row.count || 0;
            total += count;
            if (row.study_status === 'learned') learned = count;
            else if (row.study_status === 'confused') confused = count;
            else undecided += count; // 'undecided' or null/others
        });

        return { learned, confused, undecided, total };
    },

    /**
     * 월간 학습 활동 기록을 가져옵니다 (캘린더용).
     */
    async getMonthlyActivity(userId: string, year: number, month: number): Promise<string[]> {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        const data = await runQuery(
            'SELECT study_date FROM study_logs WHERE user_id = ? AND study_date >= ? AND study_date <= ?',
            [userId, startDate, endDate]
        );
        
        return data.map((log: any) => log.study_date);
    }
};
