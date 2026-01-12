import React from 'react';
import { Course, UserProgress } from '../types';
import { Star, CheckCircle, Lock } from './ui/Icons';

interface PathMapProps {
  course: Course;
  userProgress: UserProgress;
  onStartLesson: (unitId: string, lessonId: string) => void;
}

export const PathMap: React.FC<PathMapProps> = ({ course, userProgress, onStartLesson }) => {
  return (
    <div className="flex flex-col items-center py-6 pb-10 space-y-10">
      {course.units.map((unit, unitIdx) => (
        <div key={unit.id} className="w-full max-w-2xl flex flex-col items-center">
          {/* Unit Header */}
          <div className="w-full mb-6 rounded-3xl border border-slate-200/70 bg-white/80 p-5 text-center shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/40 transition-colors relative overflow-hidden">
            <div className="absolute top-0 right-0 p-1 opacity-10">
              <Star className="w-24 h-24" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Unit {unitIdx + 1}
            </div>
            <h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">
              {unit.title}
            </h2>
            <p className="mt-1 text-slate-600 dark:text-slate-300 text-sm">{unit.description}</p>
          </div>

          {/* Lessons Path */}
          <div className="relative flex flex-col items-center w-full gap-8">
            {unit.lessons.map((lesson, lessonIdx) => {
              const isCompleted = !!userProgress.completedLessons[lesson.id];
              const isCurrent = userProgress.currentLessonId === lesson.id;
              const isLocked = !isCompleted && !isCurrent;

              // Simple Sine wave offset logic for visual interest
              const offset = Math.sin(lessonIdx) * 40;

              return (
                <div
                  key={lesson.id}
                  className="relative z-10"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  <button
                    onClick={() => !isLocked && onStartLesson(unit.id, lesson.id)}
                    disabled={isLocked}
                    className={`
                      group w-20 h-20 rounded-full flex items-center justify-center relative
                      shadow-[0_10px_25px_rgba(0,0,0,0.12)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.4)]
                      ring-1 ring-slate-900/10 dark:ring-white/10
                      active:translate-y-0.5 transition-all
                      ${
                        isCompleted
                          ? 'bg-hermetic-success text-white'
                          : isCurrent
                            ? 'bg-hermetic-accent text-slate-950'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                      }
                    `}
                  >
                    {isCompleted && <CheckCircle className="w-10 h-10 text-white" />}
                    {isCurrent && (
                      <Star className="w-10 h-10 text-slate-950 fill-slate-950 animate-pulse" />
                    )}
                    {isLocked && <Lock className="w-8 h-8 text-gray-400 dark:text-gray-600" />}

                    {/* Tooltip-like Label */}
                    <div className="absolute -bottom-9 rounded-full border border-slate-200/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60 dark:text-slate-200 whitespace-nowrap transition-colors">
                      {lesson.title}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Connector lines are tough in standard CSS without SVG, 
          but items close together imply the path nicely in a mobile vertical scroll. 
      */}
    </div>
  );
};
