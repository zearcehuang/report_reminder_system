import { useState, useEffect, useCallback } from 'react';
import { Project, MilestoneRule } from '../types';

interface UseReportDateOffsetProps {
  activeProject: Project | null;
  rule: MilestoneRule | null;
  isOpen: boolean;
}

export const useReportDateOffset = ({ activeProject, rule, isOpen }: UseReportDateOffsetProps) => {
  const [dateMode, setDateMode] = useState<'offset' | 'date'>('date');
  const [dayOffset, setDayOffset] = useState<number>(0);
  const [targetDate, setTargetDate] = useState<string>('');

  useEffect(() => {
    if (isOpen && rule && activeProject) {
      setDayOffset(rule.dayOffset ?? 0);
      
      // Calculate initial target date from D-Day + dayOffset
      if (activeProject.dDay) {
        const d = new Date(activeProject.dDay);
        d.setDate(d.getDate() + (rule.dayOffset ?? 0));
        setTargetDate(d.toISOString().split('T')[0]);
      } else {
        setTargetDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [isOpen, rule, activeProject]);

  // Calculate preview date for offset mode
  const getOffsetPreviewDate = useCallback((): string => {
    if (!activeProject?.dDay) return '未設定開工日 (D-Day)';
    const d = new Date(activeProject.dDay);
    d.setDate(d.getDate() + Number(dayOffset || 0));
    return d.toISOString().split('T')[0];
  }, [activeProject, dayOffset]);

  // Calculate calculated offset for specific date mode
  const getCalculatedOffset = useCallback((): number => {
    if (!activeProject?.dDay || !targetDate) return 0;
    const d1 = new Date(targetDate);
    const d2 = new Date(activeProject.dDay);
    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    return isNaN(diffDays) ? 0 : diffDays;
  }, [activeProject, targetDate]);

  return {
    dateMode,
    setDateMode,
    dayOffset,
    setDayOffset,
    targetDate,
    setTargetDate,
    getOffsetPreviewDate,
    getCalculatedOffset,
  };
};
