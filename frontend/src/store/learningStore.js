import { create } from 'zustand';

export const useLearningStore = create((set) => ({
  activeModuleId: null,

  module1: {
    buildStarted: false,
    architectureValidated: false,
    costCalculated: false,
    quizCompleted: false,
    completed: false,
  },

  module2: {
    buildStarted: false,
    architectureValidated: false,
    costCalculated: false,
    aiActivityCompleted: false,
    quizCompleted: false,
    completed: false,
  },

  startModule: (moduleId) =>
    set((state) => ({
      activeModuleId: moduleId,
      [moduleId === 'module-1' ? 'module1' : 'module2']: {
        ...state[moduleId === 'module-1' ? 'module1' : 'module2'],
        buildStarted: true,
      },
    })),

  updateModuleProgress: (moduleId, updates) =>
    set((state) => {
      const key = moduleId === 'module-1' ? 'module1' : 'module2';

      return {
        [key]: {
          ...state[key],
          ...updates,
        },
      };
    }),

  resetLearning: () =>
    set({
      activeModuleId: null,

      module1: {
        buildStarted: false,
        architectureValidated: false,
        costCalculated: false,
        quizCompleted: false,
        completed: false,
      },

      module2: {
        buildStarted: false,
        architectureValidated: false,
        costCalculated: false,
        aiActivityCompleted: false,
        quizCompleted: false,
        completed: false,
      },
    }),
}));