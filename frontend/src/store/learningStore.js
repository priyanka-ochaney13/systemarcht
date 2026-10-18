import { create } from 'zustand';

const MODULE_COUNT = 9;

const createModuleProgress = () => ({
  buildStarted: false,
  architectureValidated: false,
  costCalculated: false,
  aiActivityCompleted: false,
  quizCompleted: false,
  completed: false,
  completedSections: [],
  quizAnswers: {},
});

const createInitialModules = () => {
  const modules = Object.fromEntries(
    Array.from({ length: MODULE_COUNT }, (_, index) => [
      `module-${index + 1}`,
      createModuleProgress(),
    ])
  );

  return modules;
};

export const useLearningStore = create((set) => ({
  activeModuleId: null,
  modules: createInitialModules(),

  startModule: (moduleId) =>
    set((state) => ({
      activeModuleId: moduleId,
      modules: {
        ...state.modules,
        [moduleId]: {
          ...(state.modules[moduleId] || createModuleProgress()),
          buildStarted: true,
        },
      },
    })),

  updateModuleProgress: (moduleId, updates) =>
    set((state) => ({
      modules: {
        ...state.modules,
        [moduleId]: {
          ...(state.modules[moduleId] || createModuleProgress()),
          ...updates,
        },
      },
    })),

  completeModuleSection: (moduleId, sectionId) =>
    set((state) => {
      const progress = state.modules[moduleId] || createModuleProgress();
      const completedSections = progress.completedSections || [];
      const nextSections = completedSections.includes(sectionId)
        ? completedSections
        : [...completedSections, sectionId];

      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...progress,
            completedSections: nextSections,
          },
        },
      };
    }),

  updateQuizAnswer: (moduleId, questionId, answer) =>
    set((state) => {
      const progress = state.modules[moduleId] || createModuleProgress();

      return {
        modules: {
          ...state.modules,
          [moduleId]: {
            ...progress,
            quizAnswers: {
              ...(progress.quizAnswers || {}),
              [questionId]: answer,
            },
          },
        },
      };
    }),

  resetLearning: () =>
    set({
      activeModuleId: null,
      modules: createInitialModules(),
    }),
}));