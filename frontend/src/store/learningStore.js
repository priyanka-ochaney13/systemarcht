import { create } from 'zustand';

const MODULE_COUNT = 9;

const createModuleProgress = () => ({
  buildStarted: false,
  architectureValidated: false,
  costCalculated: false,
  aiActivityCompleted: false,
  quizCompleted: false,
  completed: false,
});

const createInitialModules = () =>
  Object.fromEntries(
    Array.from({ length: MODULE_COUNT }, (_, index) => [
      `module-${index + 1}`,
      createModuleProgress(),
    ])
  );

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

  resetLearning: () =>
    set({
      activeModuleId: null,
      modules: createInitialModules(),
    }),
}));