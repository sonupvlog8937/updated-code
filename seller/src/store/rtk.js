const isObject = (value) => value !== null && typeof value === "object";

const deepClone = (obj) => {
  if (!isObject(obj)) return obj;
  if (Array.isArray(obj)) return obj.map(deepClone);
  const clone = {};
  Object.keys(obj).forEach((key) => {
    clone[key] = deepClone(obj[key]);
  });
  return clone;
};

export const createSlice = ({ name, initialState, reducers }) => {
  const actions = {};

  Object.keys(reducers).forEach((key) => {
    actions[key] = (payload) => ({
      type: `${name}/${key}`,
      payload,
    });
  });

  const reducer = (state = initialState, action) => {
    if (!action?.type?.startsWith(`${name}/`)) {
      return state;
    }

    const actionName = action.type.slice(name.length + 1);
    const caseReducer = reducers[actionName];

    if (!caseReducer) {
      return state;
    }

    const draft = deepClone(state);
    caseReducer(draft, action);
    return draft;
  };

  return { actions, reducer };
};

export const configureStore = ({ reducer }) => {
  const rootReducer = (state = {}, action) => {
    if (typeof reducer === "function") {
      return reducer(state, action);
    }

    return Object.keys(reducer).reduce((nextState, key) => {
      nextState[key] = reducer[key](state[key], action);
      return nextState;
    }, {});
  };

  let state = rootReducer(undefined, { type: "@@INIT" });
  const listeners = new Set();

  const getState = () => state;

  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const dispatch = (action) => {
    state = rootReducer(state, action);
    listeners.forEach((listener) => listener());
    return action;
  };

  return {
    getState,
    dispatch,
    subscribe,
  };
};